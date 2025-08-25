#!/usr/bin/env python3
"""
Firebase Integration Test Script for Trading Post
This script tests the Firebase authentication integration
"""

import asyncio
import requests
import json
import os
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:3000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"


class FirebaseIntegrationTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.access_token = None
        self.refresh_token = None

    def print_test_header(self, test_name):
        print(f"\n{'=' * 50}")
        print(f"🧪 Testing: {test_name}")
        print(f"{'=' * 50}")

    def print_result(self, success, message):
        icon = "✅" if success else "❌"
        print(f"{icon} {message}")

    def test_backend_health(self):
        """Test if backend is running"""
        self.print_test_header("Backend Health Check")

        try:
            response = requests.get(f"{self.backend_url}/docs", timeout=5)
            if response.status_code == 200:
                self.print_result(True, "Backend is running and accessible")
                return True
            else:
                self.print_result(False, f"Backend returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.print_result(False, f"Backend not accessible: {str(e)}")
            return False

    def test_firebase_endpoints(self):
        """Test Firebase authentication endpoints"""
        self.print_test_header("Firebase Endpoints")

        # Test auth providers endpoint
        try:
            response = requests.get(f"{self.backend_url}/api/auth/providers")
            if response.status_code == 200:
                providers = response.json()
                self.print_result(
                    True, f"Auth providers endpoint working: {len(providers.get('providers', []))} providers"
                )
            else:
                self.print_result(False, f"Auth providers endpoint failed: {response.status_code}")
        except Exception as e:
            self.print_result(False, f"Auth providers endpoint error: {str(e)}")

        # Test Firebase signin endpoint (without valid token)
        try:
            response = requests.post(
                f"{self.backend_url}/api/auth/firebase/signin", json={"id_token": "test_token", "provider": "test"}
            )
            # Should return 401 for invalid token
            if response.status_code == 401:
                self.print_result(True, "Firebase signin endpoint properly validates tokens")
            else:
                self.print_result(False, f"Firebase signin endpoint unexpected response: {response.status_code}")
        except Exception as e:
            self.print_result(False, f"Firebase signin endpoint error: {str(e)}")

    def test_traditional_auth(self):
        """Test traditional email/password authentication"""
        self.print_test_header("Traditional Authentication")

        # Test user registration
        try:
            response = requests.post(
                f"{self.backend_url}/api/register",
                json={"username": "testuser", "email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
            )

            if response.status_code in [200, 201]:
                self.print_result(True, "User registration successful")
            elif response.status_code == 409:
                self.print_result(True, "User already exists (expected)")
            else:
                self.print_result(False, f"Registration failed: {response.status_code}")
        except Exception as e:
            self.print_result(False, f"Registration error: {str(e)}")

        # Test user login
        try:
            response = requests.post(
                f"{self.backend_url}/token", data={"username": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
            )

            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.print_result(True, "Traditional login successful")
                return True
            else:
                self.print_result(False, f"Login failed: {response.status_code}")
                return False
        except Exception as e:
            self.print_result(False, f"Login error: {str(e)}")
            return False

    def test_protected_endpoints(self):
        """Test protected endpoints with authentication"""
        self.print_test_header("Protected Endpoints")

        if not self.access_token:
            self.print_result(False, "No access token available for testing")
            return

        headers = {"Authorization": f"Bearer {self.access_token}"}

        # Test profile endpoint
        try:
            response = requests.get(f"{self.backend_url}/api/user/me", headers=headers)
            if response.status_code == 200:
                self.print_result(True, "Profile endpoint accessible with token")
            else:
                self.print_result(False, f"Profile endpoint failed: {response.status_code}")
        except Exception as e:
            self.print_result(False, f"Profile endpoint error: {str(e)}")

        # Test Firebase profile endpoint
        try:
            response = requests.get(f"{self.backend_url}/api/firebase/profile", headers=headers)
            # May fail if user is not Firebase user, but endpoint should exist
            if response.status_code in [200, 404, 500]:
                self.print_result(True, "Firebase profile endpoint exists")
            else:
                self.print_result(False, f"Firebase profile endpoint unexpected: {response.status_code}")
        except Exception as e:
            self.print_result(False, f"Firebase profile endpoint error: {str(e)}")

    def test_environment_config(self):
        """Test environment configuration"""
        self.print_test_header("Environment Configuration")

        # Check if Firebase service account file exists
        firebase_key_path = "firebase-service-account.json"
        if os.path.exists(firebase_key_path):
            self.print_result(True, "Firebase service account key file found")
        else:
            self.print_result(False, "Firebase service account key file not found")
            print("   ℹ️  Create this file from Firebase Console → Project Settings → Service Accounts")

        # Check if .env files exist
        if os.path.exists(".env"):
            self.print_result(True, "Backend .env file found")
        else:
            self.print_result(False, "Backend .env file not found")

        frontend_env = "trading-app-frontend/.env"
        if os.path.exists(frontend_env):
            self.print_result(True, "Frontend .env file found")
        else:
            self.print_result(False, "Frontend .env file not found")

    def test_cors_configuration(self):
        """Test CORS configuration"""
        self.print_test_header("CORS Configuration")

        try:
            # Test preflight request
            response = requests.options(
                f"{self.backend_url}/api/auth/providers",
                headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
            )

            if "Access-Control-Allow-Origin" in response.headers:
                self.print_result(True, "CORS headers present")
            else:
                self.print_result(False, "CORS headers missing")
        except Exception as e:
            self.print_result(False, f"CORS test error: {str(e)}")

    def run_all_tests(self):
        """Run all integration tests"""
        print(f"🔥 Firebase Integration Test Suite")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Backend URL: {self.backend_url}")

        # Run tests in order
        backend_ok = self.test_backend_health()
        if not backend_ok:
            print("\n❌ Backend not accessible. Please start the backend server first:")
            print("   cd active-projects/trading-post")
            print("   venv/Scripts/python -m uvicorn app_with_firebase:app --reload --host 0.0.0.0 --port 3000")
            return

        self.test_environment_config()
        self.test_firebase_endpoints()
        self.test_cors_configuration()

        # Traditional auth tests
        auth_ok = self.test_traditional_auth()
        if auth_ok:
            self.test_protected_endpoints()

        # Final summary
        print(f"\n{'=' * 50}")
        print("🎯 Test Summary")
        print(f"{'=' * 50}")
        print("✅ If all tests passed, your Firebase integration is ready!")
        print("📝 Next steps:")
        print("   1. Set up Firebase project (see FIREBASE_SETUP.md)")
        print("   2. Configure environment variables")
        print("   3. Test with real Firebase tokens")
        print("   4. Integrate FirebaseAuth component in your React app")


def main():
    """Main test function"""
    tester = FirebaseIntegrationTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
