"""
Comprehensive testing suite for AI Photo Mode functionality
"""

import pytest
import asyncio
import tempfile
import json
import io
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from PIL import Image
import requests
from fastapi.testclient import TestClient
from fastapi import UploadFile

# Import the main app and dependencies
from app_sqlite import app, get_db, get_current_user
from app_sqlite import AIPhotoSession, AIItemSuggestion, User
import security_config


class TestAIPhotoMode:
    """Test AI Photo Mode functionality"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture
    def mock_user(self):
        """Create mock user for testing"""
        return User(id=1, username="testuser", email="test@example.com", latitude=40.7128, longitude=-74.0060)

    @pytest.fixture
    def test_image(self):
        """Create test image file"""
        image = Image.new("RGB", (800, 600), color="red")
        img_buffer = io.BytesIO()
        image.save(img_buffer, format="JPEG")
        img_buffer.seek(0)
        return img_buffer

    @pytest.fixture
    def malicious_file(self):
        """Create malicious file for security testing"""
        # Create file with executable signature
        malicious_content = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
        malicious_content += b"\x00" * 100  # Pad to look like image
        return io.BytesIO(malicious_content)

    def test_security_validator_valid_image(self, test_image):
        """Test security validator with valid image"""
        # Save test image to temporary file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_file:
            test_image.seek(0)
            tmp_file.write(test_image.read())
            tmp_file.flush()

            # Test validation
            validator = security_config.ImageSecurityValidator()
            result = validator.validate_file_security(tmp_file.name, "test.jpg")

            assert result["is_safe"] is True
            assert len(result["violations"]) == 0
            assert "file_size" in result["metadata"]
            assert result["metadata"]["detected_mime_type"] == "image/jpeg"

            # Clean up
            Path(tmp_file.name).unlink()

    def test_security_validator_malicious_file(self, malicious_file):
        """Test security validator with malicious file"""
        # Save malicious content to temporary file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_file:
            malicious_file.seek(0)
            tmp_file.write(malicious_file.read())
            tmp_file.flush()

            # Test validation
            validator = security_config.ImageSecurityValidator()
            result = validator.validate_file_security(tmp_file.name, "test.jpg")

            assert result["is_safe"] is False
            assert len(result["violations"]) > 0
            assert any("executable signature" in violation.lower() for violation in result["violations"])

            # Clean up
            Path(tmp_file.name).unlink()

    def test_rate_limiter(self):
        """Test rate limiting functionality"""
        rate_limiter = security_config.RateLimitTracker()

        user_id = 1
        ip_address = "192.168.1.1"

        # Test normal usage
        check = rate_limiter.check_upload_rate_limit(user_id, ip_address)
        assert check["allowed"] is True

        # Record uploads up to limit
        for _ in range(security_config.SECURITY_CONFIG["MAX_UPLOAD_PER_USER_PER_HOUR"]):
            rate_limiter.record_upload(user_id, ip_address)

        # Should now be rate limited
        check = rate_limiter.check_upload_rate_limit(user_id, ip_address)
        assert check["allowed"] is False
        assert "limit exceeded" in check["reason"].lower()

    def test_filename_sanitization(self):
        """Test filename sanitization"""
        # Test malicious filenames
        malicious_names = [
            "../../../etc/passwd",
            "test<script>alert('xss')</script>.jpg",
            "normal/../../../dangerous.exe",
            "test|rm -rf /.jpg",
            "con.jpg",  # Windows reserved name
            "",
        ]

        for malicious_name in malicious_names:
            sanitized = security_config.sanitize_filename(malicious_name)

            # Should not contain path traversal
            assert ".." not in sanitized
            assert "/" not in sanitized
            assert "\\" not in sanitized

            # Should not be empty
            assert len(sanitized) > 0

            # Should not contain dangerous characters
            dangerous_chars = '<>:"/\\|?*'
            assert not any(char in sanitized for char in dangerous_chars)

    @patch("app_sqlite.grok_service.analyze_item_photo")
    def test_ai_photo_upload_endpoint(self, mock_analyze, client, mock_user, test_image):
        """Test AI photo upload endpoint"""

        # Mock dependencies
        def get_test_db():
            pass

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        # Mock Grok analysis
        mock_analyze.return_value = AsyncMock(
            return_value={
                "title": "Test Item",
                "description": "A test item for validation",
                "category": "electronics",
                "condition": "good",
                "estimated_price": 25.99,
                "confidence_score": 0.85,
            }
        )

        test_image.seek(0)
        files = {"photo": ("test.jpg", test_image, "image/jpeg")}

        with patch("app_sqlite.asyncio.create_task"):
            response = client.post("/api/items/analyze-photo", files=files)

        # Should create session successfully
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["analysis_status"] == "processing"

        # Clean up
        app.dependency_overrides.clear()

    def test_ai_photo_upload_security_rejection(self, client, mock_user, malicious_file):
        """Test that malicious files are rejected"""

        # Mock dependencies
        def get_test_db():
            pass

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        malicious_file.seek(0)
        files = {"photo": ("malicious.jpg", malicious_file, "image/jpeg")}

        # Should reject malicious file
        with patch("security_config.SECURITY_ENABLED", True):
            response = client.post("/api/items/analyze-photo", files=files)

        assert response.status_code == 400
        assert "security validation" in response.json()["detail"].lower()

        # Clean up
        app.dependency_overrides.clear()

    def test_ai_photo_rate_limiting(self, client, mock_user, test_image):
        """Test rate limiting on AI photo uploads"""

        # Mock dependencies
        def get_test_db():
            pass

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        test_image.seek(0)
        files = {"photo": ("test.jpg", test_image, "image/jpeg")}

        # Mock rate limiter to return exceeded
        with patch("security_config.rate_limiter.check_upload_rate_limit") as mock_check:
            mock_check.return_value = {"allowed": False, "reason": "Rate limit exceeded"}

            response = client.post("/api/items/analyze-photo", files=files)

        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()

        # Clean up
        app.dependency_overrides.clear()

    def test_invalid_file_types(self, client, mock_user):
        """Test rejection of invalid file types"""

        # Mock dependencies
        def get_test_db():
            pass

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        # Test various invalid file types
        invalid_files = [
            ("test.txt", b"Hello World", "text/plain"),
            ("test.exe", b"MZ\x90\x00", "application/octet-stream"),
            ("test.pdf", b"%PDF-1.4", "application/pdf"),
            ("test.zip", b"PK\x03\x04", "application/zip"),
        ]

        for filename, content, content_type in invalid_files:
            file_obj = io.BytesIO(content)
            files = {"photo": (filename, file_obj, content_type)}

            response = client.post("/api/items/analyze-photo", files=files)
            assert response.status_code == 400
            assert "invalid file type" in response.json()["detail"].lower()

        # Clean up
        app.dependency_overrides.clear()

    def test_file_size_limits(self, client, mock_user):
        """Test file size validation"""

        # Mock dependencies
        def get_test_db():
            pass

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        # Create oversized file (larger than 10MB limit)
        large_content = b"0" * (11 * 1024 * 1024)  # 11MB
        large_file = io.BytesIO(large_content)

        files = {"photo": ("large.jpg", large_file, "image/jpeg")}
        response = client.post("/api/items/analyze-photo", files=files)

        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

        # Test empty file
        empty_file = io.BytesIO(b"")
        files = {"photo": ("empty.jpg", empty_file, "image/jpeg")}
        response = client.post("/api/items/analyze-photo", files=files)

        assert response.status_code == 400
        assert "empty file" in response.json()["detail"].lower()

        # Clean up
        app.dependency_overrides.clear()

    @patch("app_sqlite.grok_service.analyze_item_photo")
    async def test_grok_service_integration(self, mock_grok):
        """Test Grok AI service integration"""
        from app_sqlite import GrokAIService

        # Test successful analysis
        mock_grok.return_value = {
            "title": "Vintage Camera",
            "description": "A well-maintained vintage film camera",
            "category": "electronics",
            "condition": "good",
            "estimated_price": 150.00,
            "confidence_score": 0.92,
            "features": ["35mm film", "manual focus", "built-in light meter"],
            "market_context": "Vintage cameras are in high demand",
        }

        service = GrokAIService()

        # Create test image file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_file:
            test_image = Image.new("RGB", (800, 600), color="blue")
            test_image.save(tmp_file.name, "JPEG")

            result = await service.analyze_item_photo(tmp_file.name)

            assert result["title"] == "Vintage Camera"
            assert result["confidence_score"] == 0.92
            assert "api_provider" in result

            # Clean up
            Path(tmp_file.name).unlink()

    def test_grok_service_fallback(self):
        """Test Grok service fallback when API unavailable"""
        from app_sqlite import GrokAIService

        # Test service without API key
        service = GrokAIService()
        service.api_key = None
        service.client = None

        # Should return fallback response
        result = asyncio.run(service.analyze_item_photo("nonexistent.jpg"))

        assert result["api_provider"] == "fallback"
        assert result["confidence_score"] == 0.0
        assert "unavailable" in result["title"].lower()

    def test_ai_suggestions_endpoint(self, client, mock_user):
        """Test AI suggestions retrieval endpoint"""
        # Mock dependencies and database
        mock_session = Mock()
        mock_session.analysis_status = "completed"

        mock_suggestion = Mock()
        mock_suggestion.suggested_title = "Test Item"
        mock_suggestion.suggested_price = 25.99
        mock_suggestion.confidence_score = 0.85

        def get_test_db():
            mock_db = Mock()
            mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_session
            mock_db.query.return_value.filter.return_value.first.return_value = mock_suggestion
            return mock_db

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        response = client.get("/api/items/ai-suggestions/test-session-id")

        # Should return suggestions if analysis complete
        assert response.status_code == 200

        # Clean up
        app.dependency_overrides.clear()

    def test_ai_suggestions_processing(self, client, mock_user):
        """Test AI suggestions endpoint when still processing"""
        # Mock session with processing status
        mock_session = Mock()
        mock_session.analysis_status = "processing"

        def get_test_db():
            mock_db = Mock()
            mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_session
            return mock_db

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        response = client.get("/api/items/ai-suggestions/test-session-id")

        # Should return 202 status for still processing
        assert response.status_code == 202
        assert "still in progress" in response.json()["detail"]

        # Clean up
        app.dependency_overrides.clear()

    def test_create_listing_from_ai(self, client, mock_user):
        """Test creating listing from AI analysis"""
        # Mock session and suggestion
        mock_session = Mock()
        mock_session.id = "test-session-id"
        mock_session.image_path = "uploads/ai_photos/test.jpg"

        mock_suggestion = Mock()
        mock_suggestion.suggested_title = "AI Generated Item"
        mock_suggestion.suggested_description = "Generated by AI"
        mock_suggestion.suggested_price = 50.0
        mock_suggestion.suggested_category = "electronics"
        mock_suggestion.suggested_condition = "good"

        # Mock database interactions
        def get_test_db():
            mock_db = Mock()
            mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_session
            mock_db.query.return_value.filter.return_value.first.return_value = mock_suggestion

            # Mock item creation
            mock_db.add = Mock()
            mock_db.commit = Mock()
            mock_db.refresh = Mock()

            return mock_db

        def get_test_user():
            return mock_user

        app.dependency_overrides[get_db] = get_test_db
        app.dependency_overrides[get_current_user] = get_test_user

        # Test data
        listing_data = {
            "session_id": "test-session-id",
            "title": "Custom Title",
            "description": "Custom Description",
            "price": 75.0,
            "category": "tools",
            "condition": "like_new",
            "use_ai_suggestion": False,
        }

        response = client.post("/api/items/create-from-ai", json=listing_data)

        # Should create listing successfully
        assert response.status_code == 200

        # Clean up
        app.dependency_overrides.clear()


class TestFrontendComponents:
    """Test frontend component integration"""

    def test_ai_photo_capture_component_props(self):
        """Test AIPhotoCapture component prop validation"""
        # This would typically use a JS testing framework like Jest
        # For now, we'll validate the component structure

        with open("trading-app-frontend/src/components/AIPhotoCapture.js", "r") as f:
            component_code = f.read()

        # Verify key features are implemented
        assert "navigator.mediaDevices.getUserMedia" in component_code
        assert "FormData" in component_code
        assert "analyze-photo" in component_code
        assert "onAnalysisComplete" in component_code

    def test_ai_listing_review_component(self):
        """Test AIListingReview component structure"""
        with open("trading-app-frontend/src/components/AIListingReview.js", "r") as f:
            component_code = f.read()

        # Verify key features
        assert "confidence_score" in component_code
        assert "create-from-ai" in component_code
        assert "use_ai_suggestion" in component_code
        assert "onCreateListing" in component_code


class TestEndToEndWorkflow:
    """Test complete AI Photo Mode workflow"""

    @patch("app_sqlite.grok_service.analyze_item_photo")
    async def test_complete_workflow(self, mock_grok, client, mock_user, test_image):
        """Test complete workflow from photo upload to listing creation"""

        # Mock Grok response
        mock_grok.return_value = {
            "title": "Red Widget",
            "description": "A bright red widget in good condition",
            "category": "tools",
            "condition": "good",
            "estimated_price": 15.99,
            "confidence_score": 0.78,
        }

        # Mock database
        sessions = []
        suggestions = []
        items = []

        def mock_db():
            db = Mock()

            def add_session(session):
                session.id = f"session-{len(sessions)}"
                sessions.append(session)

            def add_suggestion(suggestion):
                suggestion.id = f"suggestion-{len(suggestions)}"
                suggestions.append(suggestion)

            def add_item(item):
                item.id = len(items) + 1
                items.append(item)

            db.add = Mock(
                side_effect=lambda obj: (
                    add_session(obj)
                    if isinstance(obj.__class__.__name__, "AIPhotoSession")
                    else (
                        add_suggestion(obj) if isinstance(obj.__class__.__name__, "AIItemSuggestion") else add_item(obj)
                    )
                )
            )
            db.commit = Mock()
            db.refresh = Mock()

            # Mock queries
            def mock_query(model):
                query = Mock()
                if "AIPhotoSession" in str(model):
                    query.filter.return_value.filter.return_value.first.return_value = sessions[0] if sessions else None
                elif "AIItemSuggestion" in str(model):
                    query.filter.return_value.first.return_value = suggestions[0] if suggestions else None
                return query

            db.query = mock_query
            return db

        app.dependency_overrides[get_db] = mock_db
        app.dependency_overrides[get_current_user] = lambda: mock_user

        # Step 1: Upload photo
        test_image.seek(0)
        files = {"photo": ("test.jpg", test_image, "image/jpeg")}

        with patch("app_sqlite.asyncio.create_task"):
            upload_response = client.post("/api/items/analyze-photo", files=files)

        assert upload_response.status_code == 200
        session_data = upload_response.json()
        session_id = session_data["id"]

        # Step 2: Simulate analysis completion by manually calling background task
        # In real scenario, this would be done by the background task

        # Step 3: Get AI suggestions
        # Mock completed analysis
        mock_session = Mock()
        mock_session.analysis_status = "completed"
        mock_suggestion = Mock()
        mock_suggestion.suggested_title = "Red Widget"
        mock_suggestion.suggested_price = 15.99

        app.dependency_overrides[get_db] = lambda: Mock(
            query=lambda model: Mock(
                filter=lambda x: (
                    Mock(
                        filter=lambda y: (
                            Mock(first=lambda: mock_session)
                            if "AIPhotoSession" in str(model)
                            else Mock(first=lambda: mock_suggestion)
                        )
                    )
                    if hasattr(Mock(), "first")
                    else Mock(first=lambda: mock_suggestion)
                )
            )
        )

        suggestions_response = client.get(f"/api/items/ai-suggestions/{session_id}")
        assert suggestions_response.status_code == 200

        # Step 4: Create listing from AI
        listing_data = {"session_id": session_id, "use_ai_suggestion": True}

        create_response = client.post("/api/items/create-from-ai", json=listing_data)
        assert create_response.status_code == 200

        # Clean up
        app.dependency_overrides.clear()


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
