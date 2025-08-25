from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    status,
    UploadFile,
    File,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    or_,
    and_,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime, timedelta
from typing import Optional, List
import json
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from fastapi.responses import FileResponse, Response
import uuid
from passlib.context import CryptContext
from jose import JWTError, jwt
import h3
from geopy.distance import geodesic
import logging
import traceback
import httpx
import asyncio
import time

# Temporarily disable payment router until Stripe keys are configured
# from payment_router import router as payment_router
from google_oauth_router import router as google_oauth_router
from sso_router import router as sso_router

# Import database optimizations
try:
    from database_optimizations import OptimizedQueries, create_performance_indexes
    OPTIMIZATIONS_AVAILABLE = True
    logger.info("Database optimizations loaded successfully")
except ImportError as e:
    logger.warning(f"Database optimizations not available: {e}")
    OPTIMIZATIONS_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Test log to verify logging works
logger.info("=== Trading Post FastAPI Server Starting ===")
logger.info("Detailed logging configured and active")
logger.info("Route ordering fixed for /users/me endpoint")


# Rate limiting and caching for OpenStreetMap requests
class RateLimitedGeocodingService:
    def __init__(self):
        self.last_request_time = 0
        self.min_interval = 1.0  # 1 second between requests (OSM requirement)
        self.cache = {}  # Simple in-memory cache
        self.cache_ttl = 3600  # 1 hour cache TTL
        self.user_agent = (
            # Required by OSM
            "TradingPostApp/1.0 (contact: your-email@domain.com)"
        )

    async def wait_for_rate_limit(self):
        """Ensure we don't exceed 1 request per second to OSM"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time

        if time_since_last < self.min_interval:
            wait_time = self.min_interval - time_since_last
            logger.info(f"Rate limiting: waiting {wait_time:.2f}s before OSM request")
            await asyncio.sleep(wait_time)

        self.last_request_time = time.time()

    def get_cache_key(self, query_type: str, **params) -> str:
        """Generate cache key for geocoding request"""
        param_str = ":".join(f"{k}={v}" for k, v in sorted(params.items()))
        return f"{query_type}:{param_str}"

    def is_cache_valid(self, timestamp: float) -> bool:
        """Check if cache entry is still valid"""
        return (time.time() - timestamp) < self.cache_ttl

    async def geocode_address(self, query: str) -> dict:
        """Forward geocoding: address/zipcode to coordinates"""
        cache_key = self.get_cache_key("forward", q=query)

        # Check cache first
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if self.is_cache_valid(timestamp):
                logger.info(f"Using cached geocoding result for: {query}")
                return cached_data

        # Rate limit before making request
        await self.wait_for_rate_limit()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = "https://nominatim.openstreetmap.org/search"
                params = {
                    "q": query,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "us",  # Restrict to US for Trading Post
                    "addressdetails": 1,
                }
                headers = {"User-Agent": self.user_agent}

                logger.info(f"Making OSM forward geocoding request for: {query}")
                response = await client.get(url, params=params, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    result = {"success": True, "data": data, "type": "forward"}
                    # Cache the result
                    self.cache[cache_key] = (result, time.time())
                    return result
                elif response.status_code == 429:
                    logger.warning("OSM rate limit exceeded (429), implementing retry")
                    # Wait longer and retry once
                    await asyncio.sleep(2.0)
                    response = await client.get(url, params=params, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        result = {"success": True, "data": data, "type": "forward"}
                        self.cache[cache_key] = (result, time.time())
                        return result
                    else:
                        logger.error(f"OSM retry failed with status: {response.status_code}")
                        return {
                            "success": False,
                            "error": f"Rate limit retry failed: {response.status_code}",
                            "type": "forward",
                        }
                else:
                    logger.error(f"OSM geocoding failed with status: {response.status_code}")
                    return {
                        "success": False,
                        "error": f"Geocoding failed: {response.status_code}",
                        "type": "forward",
                    }

        except httpx.TimeoutException:
            logger.error(f"OSM geocoding timeout for query: {query}")
            return {"success": False, "error": "Request timeout", "type": "forward"}
        except Exception as e:
            logger.error(f"OSM geocoding error for query: {query} - {e}")
            return {"success": False, "error": str(e), "type": "forward"}

    async def reverse_geocode(self, lat: float, lon: float, zoom: int = 10) -> dict:
        """Reverse geocoding: coordinates to address"""
        cache_key = self.get_cache_key("reverse", lat=lat, lon=lon, zoom=zoom)

        # Check cache first
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if self.is_cache_valid(timestamp):
                logger.info(f"Using cached reverse geocoding result for: {lat},{lon}")
                return cached_data

        # Rate limit before making request
        await self.wait_for_rate_limit()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = "https://nominatim.openstreetmap.org/reverse"
                params = {
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "zoom": zoom,
                    "addressdetails": 1,
                }
                headers = {"User-Agent": self.user_agent}

                logger.info(f"Making OSM reverse geocoding request for: {lat},{lon}")
                response = await client.get(url, params=params, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    result = {"success": True, "data": data, "type": "reverse"}
                    # Cache the result
                    self.cache[cache_key] = (result, time.time())
                    return result
                elif response.status_code == 429:
                    logger.warning("OSM rate limit exceeded (429) on reverse geocoding, implementing retry")
                    # Wait longer and retry once
                    await asyncio.sleep(2.0)
                    response = await client.get(url, params=params, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        result = {"success": True, "data": data, "type": "reverse"}
                        self.cache[cache_key] = (result, time.time())
                        return result
                    else:
                        logger.error(f"OSM reverse geocoding retry failed with status: {response.status_code}")
                        return {
                            "success": False,
                            "error": f"Rate limit retry failed: {response.status_code}",
                            "type": "reverse",
                        }
                else:
                    logger.error(f"OSM reverse geocoding failed with status: {response.status_code}")
                    return {
                        "success": False,
                        "error": f"Reverse geocoding failed: {response.status_code}",
                        "type": "reverse",
                    }

        except httpx.TimeoutException:
            logger.error(f"OSM reverse geocoding timeout for: {lat},{lon}")
            return {"success": False, "error": "Request timeout", "type": "reverse"}
        except Exception as e:
            logger.error(f"OSM reverse geocoding error for: {lat},{lon} - {e}")
            return {"success": False, "error": str(e), "type": "reverse"}


# Initialize the geocoding service
geocoding_service = RateLimitedGeocodingService()

# Configuration - Using SQLite for easy local testing
DATABASE_URL = "sqlite:///./tradingpost.db"
# CRITICAL SECURITY: Validate SECRET_KEY
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("ENV") == "production":
        raise ValueError(
            "SECRET_KEY environment variable is required in production. "
            'Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
        )
    else:
        # Development fallback with warning
        import secrets

        SECRET_KEY = secrets.token_urlsafe(32)
        logger.warning(
            "No SECRET_KEY provided. Generated temporary key for development. "
            "Set SECRET_KEY environment variable for production!"
        )
elif len(SECRET_KEY) < 32:
    raise ValueError(
        "SECRET_KEY must be at least 32 characters long for security. "
        'Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
    )
ALGORITHM = "HS256"
# Secure authentication configuration
if AUTH_TIMEOUT_FIXES_ENABLED:
    # Use secure timeout configuration from auth fixes
    ACCESS_TOKEN_EXPIRE_MINUTES = auth_timeout_manager.config.access_token_expire_minutes  # 1 hour
    logger.info(f"✅ Using secure access token expiration: {ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
else:
    # Fallback to more secure default than 7 days
    ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour instead of 7 days
    logger.warning(f"⚠️ Using fallback access token expiration: {ACCESS_TOKEN_EXPIRE_MINUTES} minutes")


# Environment validation function for security
def validate_environment_security():
    """Validate critical environment variables for security compliance"""
    security_issues = []
    warnings = []
    
    # Check SECRET_KEY (already validated above, but double-check)
    if not os.getenv("SECRET_KEY"):
        if os.getenv("ENV") == "production":
            security_issues.append("SECRET_KEY is required in production")
    
    # Check Appwrite configuration if SSO is used
    appwrite_endpoint = os.getenv("APPWRITE_ENDPOINT")
    appwrite_project = os.getenv("APPWRITE_PROJECT_ID")
    appwrite_key = os.getenv("APPWRITE_API_KEY")
    
    if appwrite_endpoint or appwrite_project or appwrite_key:
        # If any Appwrite config is present, all should be configured
        if not appwrite_project:
            security_issues.append("APPWRITE_PROJECT_ID is required when using Appwrite SSO")
        if not appwrite_key:
            security_issues.append("APPWRITE_API_KEY is required when using Appwrite SSO")
        elif appwrite_key.startswith("standard_") and len(appwrite_key) > 100:
            # This looks like a real API key in the environment - that's good
            pass
        else:
            warnings.append("APPWRITE_API_KEY should be a proper API key from Appwrite console")
    
    # Check OAuth configuration
    oauth_vars = [
        "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
        "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", 
        "FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"
    ]
    
    oauth_configured = any(os.getenv(var) for var in oauth_vars)
    if oauth_configured:
        for var in oauth_vars:
            if os.getenv(var) and os.getenv(var).startswith("your-"):
                warnings.append(f"{var} appears to be a placeholder value")
    
    # Check admin password
    admin_password = os.getenv("ADMIN_PASSWORD")
    if admin_password == "ChangeThisPassword123!":
        security_issues.append("ADMIN_PASSWORD is using default value - change immediately!")
    elif not admin_password and os.getenv("ENV") == "production":
        security_issues.append("ADMIN_PASSWORD should be set in production")
    
    # Check database security
    db_url = os.getenv("DATABASE_URL")
    if db_url and "postgres" in db_url and "postgres:postgres" in db_url:
        warnings.append("Database appears to use default credentials - consider changing")
    
    # Report findings
    if security_issues:
        logger.error("🚨 CRITICAL SECURITY ISSUES FOUND:")
        for issue in security_issues:
            logger.error(f"   ❌ {issue}")
        if os.getenv("ENV") == "production":
            raise ValueError("Critical security issues must be resolved before production deployment")
    
    if warnings:
        logger.warning("⚠️  Security warnings:")
        for warning in warnings:
            logger.warning(f"   ⚠️  {warning}")
    
    if not security_issues and not warnings:
        logger.info("✅ Environment security validation passed")
    
    return len(security_issues) == 0

# Validate environment security before starting
validate_environment_security()

# Initialize FastAPI app
app = FastAPI(title="Trading Post API", version="1.0.0")

# Include payment router for secure Stripe integration
# Temporarily disable payment router until Stripe keys are configured
# app.include_router(payment_router)

# Include Google OAuth router
from google_oauth_router import router as google_oauth_router

# AI Configuration
GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_BASE_URL = os.getenv("GROK_BASE_URL", "https://api.x.ai/v1")
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB limit
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


# AI Photo Analysis Service
class GrokAIService:
    def __init__(self):
        self.api_key = GROK_API_KEY
        self.base_url = GROK_BASE_URL
        self.client = None
        if self.api_key:
            import openai

            self.client = openai.OpenAI(api_key=self.api_key, base_url=self.base_url)

    async def analyze_item_photo(self, image_path: str) -> dict:
        """Analyze photo using Grok API and return item details"""
        if not self.client or not self.api_key:
            logger.warning("Grok API not configured - returning fallback response")
            return self._get_fallback_response()

        try:
            # Read and process image
            import base64
            from PIL import Image

            # Open and potentially resize image
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != "RGB":
                    img = img.convert("RGB")

                # Resize if too large (max 1024x1024 for API efficiency)
                max_size = (1024, 1024)
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

                # Save to bytes
                import io

                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=85)
                buffer.seek(0)

                # Encode to base64
                image_data = base64.b64encode(buffer.read()).decode("utf-8")

            # Craft prompt for item identification and listing generation
            prompt = """Analyze this photo and provide detailed information about the item shown. Return your response as valid JSON with the following structure:

{
    "title": "Brief, descriptive item name (max 100 characters)",
    "description": "Detailed description including features, condition, and notable aspects (200-500 characters)",
    "category": "Product category (electronics, clothing, furniture, books, sports, tools, etc.)",
    "condition": "Item condition (new, like_new, good, fair, poor)",
    "estimated_price": "Estimated market value in USD (number only)",
    "confidence_score": "Confidence in identification (0.0-1.0)",
    "features": ["List of key features or specifications"],
    "condition_notes": "Detailed condition assessment",
    "market_context": "Brief market analysis and pricing rationale"
}

Focus on:
1. Accurate item identification
2. Realistic market pricing
3. Honest condition assessment  
4. Key selling points
5. Any visible defects or wear

Be thorough but concise. If multiple items are visible, focus on the main/largest item."""

            # Make API call to Grok
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="grok-vision-beta",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}},
                            ],
                        }
                    ],
                    max_tokens=800,
                    temperature=0.3,
                ),
            )

            # Parse response
            grok_content = response.choices[0].message.content

            # Try to extract JSON from response
            import re

            json_match = re.search(r"\{.*\}", grok_content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                # Fallback parsing if JSON not found
                result = self._parse_text_response(grok_content)

            # Add metadata
            result["raw_response"] = grok_content
            result["api_provider"] = "grok"
            result["analysis_timestamp"] = datetime.utcnow().isoformat()

            logger.info(f"Successfully analyzed item photo with confidence: {result.get('confidence_score', 0)}")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Grok JSON response: {e}")
            return self._get_fallback_response()
        except Exception as e:
            logger.error(f"Grok API analysis failed: {e}")
            return self._get_fallback_response()

    def _parse_text_response(self, text: str) -> dict:
        """Fallback text parsing if JSON extraction fails"""
        return {
            "title": "Unknown Item",
            "description": "Item analysis could not be completed. Please add details manually.",
            "category": "other",
            "condition": "good",
            "estimated_price": 0.0,
            "confidence_score": 0.1,
            "features": [],
            "condition_notes": "Manual inspection required",
            "market_context": "Price analysis unavailable",
        }

    def _get_fallback_response(self) -> dict:
        """Return fallback response when Grok API is unavailable"""
        return {
            "title": "Photo Analysis Unavailable",
            "description": "AI analysis is currently unavailable. Please add item details manually.",
            "category": "other",
            "condition": "good",
            "estimated_price": 0.0,
            "confidence_score": 0.0,
            "features": [],
            "condition_notes": "AI analysis unavailable",
            "market_context": "Manual pricing required",
            "api_provider": "fallback",
            "analysis_timestamp": datetime.utcnow().isoformat(),
        }


# Initialize Grok service
grok_service = GrokAIService()

# Import security modules
try:
    from security_config import (
        image_validator,
        rate_limiter,
        quarantine_file,
        validate_storage_location,
        sanitize_filename,
        SECURITY_CONFIG,
    )

    SECURITY_ENABLED = True
    logger.info("Security validation enabled for AI Photo Mode")
except ImportError as e:
    logger.warning(f"Security module not available: {e}. Running with basic validation only.")
    SECURITY_ENABLED = False

# Import rate limiting middleware
try:
    from rate_limiting_middleware import RateLimitingMiddleware, create_rate_limiting_middleware
    RATE_LIMITING_ENABLED = True
    logger.info("✅ Rate limiting middleware loaded successfully")
except ImportError as e:
    logger.warning(f"Rate limiting middleware not available: {e}. Running without rate limiting.")
    RATE_LIMITING_ENABLED = False

# Import enhanced authentication and session security
try:
    from enhanced_authentication import (
        auth_manager, 
        get_current_user_enhanced, 
        require_secure_session,
        require_csrf_protection,
        get_user_security_status,
        force_logout_all_sessions
    )
    from session_security import session_manager
    ENHANCED_SECURITY_ENABLED = True
    logger.info("✅ Enhanced authentication and session security loaded successfully")
except ImportError as e:
    logger.warning(f"Enhanced security not available: {e}. Using basic authentication only.")
    ENHANCED_SECURITY_ENABLED = False

# Import comprehensive error monitoring system
try:
    from error_monitoring import (
        ErrorMonitoringMiddleware, 
        error_monitor,
        ErrorContext,
        PerformanceMetrics,
        SystemHealthMetrics,
        monitor_errors,
        error_tracking_context
    )
    ERROR_MONITORING_ENABLED = True
    logger.info("✅ Comprehensive error monitoring system loaded successfully")
except ImportError as e:
    logger.warning(f"Error monitoring system not available: {e}. Running without comprehensive monitoring.")
    ERROR_MONITORING_ENABLED = False

# Import authentication timeout fixes
try:
    from auth_timeout_fixes import (
        AuthConfig,
        AuthenticationTimeoutManager,
        ImprovedOAuthHandler,
        auth_timeout_manager,
        oauth_handler,
        get_current_user_with_timeout,
        refresh_token_endpoint,
        logout_endpoint
    )
    AUTH_TIMEOUT_FIXES_ENABLED = True
    logger.info("✅ Authentication timeout and OAuth fixes loaded successfully")
except ImportError as e:
    logger.warning(f"Authentication timeout fixes not available: {e}. Using legacy auth system.")
    AUTH_TIMEOUT_FIXES_ENABLED = False

# Import performance optimization system
try:
    from performance_optimizer import (
        performance_optimizer,
        cached,
        analyze_performance,
        optimize_system,
        get_performance_report
    )
    PERFORMANCE_OPTIMIZER_ENABLED = True
    logger.info("✅ Performance optimization system loaded successfully")
except ImportError as e:
    logger.warning(f"Performance optimizer not available: {e}. Running without performance optimization.")
    PERFORMANCE_OPTIMIZER_ENABLED = False


# Secure CORS middleware with origin validation
class SecureCORSMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_origins: list):
        super().__init__(app)
        self.allowed_origins = set(allowed_origins)

    def is_origin_allowed(self, origin: str) -> bool:
        """Check if the origin is in the allowed list"""
        if not origin:
            return False
        return origin in self.allowed_origins

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")

        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            if self.is_origin_allowed(origin):
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            return response

        # Handle actual requests
        try:
            response = await call_next(request)
        except Exception as e:
            # Even on error, set CORS headers if origin is allowed
            response = Response(content=str(e), status_code=500)

        if self.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"

        return response


# Secure CORS middleware will be added below with origins

# Configure secure CORS origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development server
    "http://localhost:3001",  # Alternative dev port
    "http://localhost:3002",  # Frontend dev port
    "https://tradingpost.appwrite.network",  # Production Appwrite domain
]

# Add environment-specific origins
additional_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
if additional_origins:
    ALLOWED_ORIGINS.extend([origin.strip() for origin in additional_origins.split(",")])

# NEVER use wildcard in production
if os.getenv("ENV") == "development":
    # Even in development, use specific origins for security
    dev_origins = os.getenv("DEV_CORS_ORIGINS")
    if dev_origins:
        ALLOWED_ORIGINS.extend([origin.strip() for origin in dev_origins.split(",")])

logger.info(f"CORS allowed origins: {ALLOWED_ORIGINS}")

# Use secure CORS middleware
app.add_middleware(SecureCORSMiddleware, allowed_origins=ALLOWED_ORIGINS)

# Configure standard CORS middleware as backup with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)
print("Server reloading with CORS enabled...")


# Security headers middleware for enhanced security
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy (CSP)
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' https://cloud.appwrite.io https://api.openstreetmap.org; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        response.headers["Content-Security-Policy"] = csp_policy
        
        # HSTS (HTTP Strict Transport Security) for HTTPS
        if request.url.scheme == "https" or os.getenv("ENV") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)
print("Security headers middleware enabled...")

# Add rate limiting middleware
if RATE_LIMITING_ENABLED:
    # Custom rate limiting configuration
    rate_limit_config = {
        # Authentication endpoints - stricter limits
        "auth": {"requests": 10, "window": 900},  # 10 attempts per 15 minutes
        
        # Search and listing endpoints - moderate limits
        "search": {"requests": 60, "window": 3600},  # 60 searches per hour
        
        # Creation endpoints - controlled limits
        "creation": {"requests": 25, "window": 3600},  # 25 creates per hour
        
        # Upload endpoints - stricter due to resource usage
        "upload": {"requests": 20, "window": 3600},  # 20 uploads per hour
        
        # Messaging - moderate limits
        "messaging": {"requests": 30, "window": 3600},  # 30 messages per hour
        
        # Critical operations - very strict
        "critical": {"requests": 5, "window": 3600},  # 5 attempts per hour
        
        # Default for all other endpoints
        "default": {"requests": 100, "window": 3600}  # 100 requests per hour
    }
    
    app.add_middleware(RateLimitingMiddleware, config=rate_limit_config)
    logger.info("✅ Rate limiting middleware enabled with custom configuration")
else:
    logger.warning("⚠️ Rate limiting middleware disabled - running without protection")

# Add comprehensive error monitoring middleware
if ERROR_MONITORING_ENABLED:
    app.add_middleware(ErrorMonitoringMiddleware)
    logger.info("✅ Error monitoring middleware enabled - comprehensive tracking active")
else:
    logger.warning("⚠️ Error monitoring middleware disabled - running without comprehensive monitoring")


# Test endpoint for CORS
@app.get("/test-cors")
def test_cors():
    return {"message": "CORS is working"}


# Root endpoint removed to avoid duplicate route conflicts

# Favicon endpoint removed to avoid duplicate route conflicts


# Create required directories with robust error handling
def ensure_directories_exist():
    """Ensure all required directories exist with proper error handling and logging."""
    required_dirs = [
        "uploads",
        "static",
        "trading-app-frontend/build",
        "trading-app-frontend/build/static",
    ]

    for dir_path in required_dirs:
        try:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
            logger.info(f"Directory ensured: {dir_path}")
        except Exception as e:
            logger.error(f"Failed to create directory {dir_path}: {e}")
            # Don't fail startup for directory creation errors

    return True


# Ensure directories exist before mounting
ensure_directories_exist()

# Create uploads directory reference
UPLOAD_DIR = Path("uploads")

# Mount static files with error handling
try:
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    logger.info("Successfully mounted /uploads")
except Exception as e:
    logger.error(f"Failed to mount /uploads: {e}")
    # Create empty directory as fallback
    Path("uploads").mkdir(exist_ok=True)
    try:
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads_fallback")
        logger.info("Mounted /uploads with fallback")
    except Exception as e2:
        logger.error(f"Failed to mount /uploads even after creating directory: {e2}")

# Note: /static mount will be handled conditionally later to avoid conflicts

# Mount frontend static files (will be added after API routes are defined)
frontend_build_path = Path("trading-app-frontend/build")


# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Database Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    latitude = Column(Float)
    longitude = Column(Float)
    zipcode = Column(String, nullable=True)  # Store user's zipcode
    created_at = Column(DateTime, default=datetime.utcnow)
    opt_in = Column(Boolean, default=True)  # AI matching enabled by default

    # Password reset fields
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)

    # OAuth fields
    oauth_provider = Column(String, nullable=True)  # google, facebook, etc.
    oauth_id = Column(String, nullable=True)  # Provider's user ID
    profile_picture = Column(String, nullable=True)  # URL to profile picture
    is_verified = Column(Boolean, default=False)  # Email verified status

    items = relationship("Item", back_populates="owner")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    category = Column(String, index=True)
    listing_type = Column(String, default="sale")  # sale, service, wanted
    condition = Column(String, default="good")  # new, like_new, good, fair
    service_type = Column(String)  # hourly, fixed, quote
    hourly_rate = Column(Float)
    availability = Column(String)  # for services: weekdays, weekends, evenings
    images = Column(String)  # JSON array of image URLs
    latitude = Column(Float)
    longitude = Column(Float)
    h3_index = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_available = Column(Boolean, default=True)
    views = Column(Integer, default=0)
    is_saved = Column(Boolean, default=False)

    owner = relationship("User", back_populates="items")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="saved_items")
    item = relationship("Item", backref="saved_by")


class AcceptedMatch(Base):
    __tablename__ = "accepted_matches"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"))  # User who accepted the match
    target_user_id = Column(Integer, ForeignKey("users.id"))  # User they want to match with
    requester_item_id = Column(Integer, ForeignKey("items.id"))  # Item the requester is offering/wanting
    target_item_id = Column(Integer, ForeignKey("items.id"))  # Item the target user has/wants
    # "they_have_what_i_want" or "i_have_what_they_want"
    match_type = Column(String)
    status = Column(String, default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    requester_item = relationship("Item", foreign_keys=[requester_item_id])
    target_item = relationship("Item", foreign_keys=[target_item_id])


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"))  # User writing the review
    reviewed_user_id = Column(Integer, ForeignKey("users.id"))  # User being reviewed
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)  # Optional: item related to transaction
    rating = Column(Integer)  # 1-5 stars
    comment = Column(String)  # Review text
    is_anonymous = Column(Boolean, default=True)  # Always anonymous by default
    transaction_type = Column(String)  # "purchase", "sale", "trade", "service"
    created_at = Column(DateTime, default=datetime.utcnow)

    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewed_user = relationship("User", foreign_keys=[reviewed_user_id])
    item = relationship("Item", foreign_keys=[item_id])


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    is_active = Column(Boolean, default=False)
    membership_type = Column(String, default="verified_human")  # "verified_human", "premium", etc.
    monthly_fee = Column(Float, default=5.00)  # $5/month
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    last_payment_date = Column(DateTime)
    # For future Stripe integration
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="membership")


class DailyMessageTracker(Base):
    __tablename__ = "daily_message_tracker"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


# AI Photo Mode Models
class AIPhotoSession(Base):
    __tablename__ = "ai_photo_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String)
    original_filename = Column(String)
    analysis_status = Column(String, default="processing")  # 'processing', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))

    user = relationship("User")


class AIItemSuggestion(Base):
    __tablename__ = "ai_item_suggestions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("ai_photo_sessions.id"))
    suggested_title = Column(String)
    suggested_description = Column(String)
    suggested_category = Column(String)
    suggested_price = Column(Float)
    suggested_condition = Column(String)
    confidence_score = Column(Float)
    raw_grok_response = Column(String)  # JSON stored as string
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AIPhotoSession")


# Add relationship to User model
User.membership = relationship("Membership", back_populates="user", uselist=False)

# Create tables
Base.metadata.create_all(bind=engine)

# Create performance indexes
if OPTIMIZATIONS_AVAILABLE:
    try:
        create_performance_indexes(engine)
        logger.info("Performance indexes created successfully")
    except Exception as e:
        logger.warning(f"Failed to create performance indexes: {e}")


# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    latitude: float
    longitude: float


class UserSignup(BaseModel):
    username: str
    email: str
    password: str
    zipcode: str
    optInLocation: Optional[bool] = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bio: Optional[str] = None
    opt_in: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    latitude: float
    longitude: float
    zipcode: Optional[str] = None
    opt_in: bool = True
    is_verified_human: bool = False

    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str
    listing_type: str = "sale"  # sale, service, wanted
    condition: Optional[str] = "good"  # new, like_new, good, fair
    service_type: Optional[str] = None  # hourly, fixed, quote
    hourly_rate: Optional[float] = None
    availability: Optional[str] = None
    images: Optional[List[str]] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ItemResponse(BaseModel):
    id: int
    title: str
    description: str
    price: float
    category: str
    listing_type: str
    condition: Optional[str]
    service_type: Optional[str]
    hourly_rate: Optional[float]
    availability: Optional[str]
    images: Optional[List[str]]
    owner_id: int
    created_at: datetime
    is_available: bool
    views: int
    is_saved: bool
    distance: Optional[float] = None
    owner: Optional[UserResponse] = None


class MessageCreate(BaseModel):
    receiver_id: int
    item_id: Optional[int] = None
    content: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ReviewCreate(BaseModel):
    reviewed_user_id: int
    item_id: Optional[int] = None
    rating: int  # 1-5
    comment: str
    transaction_type: str  # "purchase", "sale", "trade", "service"


class ReviewResponse(BaseModel):
    id: int
    reviewed_user_id: int
    item_id: Optional[int]
    rating: int
    comment: str
    transaction_type: str
    created_at: datetime
    reviewer_name: str  # Anonymous name like "Anonymous User #123"

    class Config:
        from_attributes = True


class MembershipCreate(BaseModel):
    membership_type: str = "verified_human"
    monthly_fee: float = 5.00


class MembershipResponse(BaseModel):
    id: int
    user_id: int
    is_active: bool
    membership_type: str
    monthly_fee: float
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    last_payment_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# AI Photo Mode Pydantic Models
class AIPhotoSessionCreate(BaseModel):
    original_filename: str


class AIPhotoSessionResponse(BaseModel):
    id: str
    user_id: int
    image_path: str
    original_filename: str
    analysis_status: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class AIItemSuggestionResponse(BaseModel):
    id: str
    session_id: str
    suggested_title: Optional[str]
    suggested_description: Optional[str]
    suggested_category: Optional[str]
    suggested_price: Optional[float]
    suggested_condition: Optional[str]
    confidence_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class AIAnalysisRequest(BaseModel):
    session_id: str


class AIListingCreateRequest(BaseModel):
    session_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    use_ai_suggestion: bool = True


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=10080)  # 7 days fallback
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.info("Authenticating user with JWT token")
        logger.info(f"Token received: {'Yes' if token else 'No'}")

        logger.debug("Decoding JWT token")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"JWT payload decoded successfully: {list(payload.keys())}")

        username: str = payload.get("sub")
        logger.debug(f"Username from token: {username[:3] if username else 'None'}***")

        if username is None:
            logger.warning("No username found in JWT token payload")
            raise credentials_exception

    except JWTError as e:
        logger.error(f"JWT decoding error: {e}")
        logger.error(f"JWT error type: {type(e).__name__}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error decoding JWT: {e}")
        logger.error(traceback.format_exc())
        raise credentials_exception

    try:
        logger.info(f"Looking up user in database: {username}")
        user = db.query(User).filter(User.username == username).first()

        if user is None:
            logger.warning(f"User not found in database: {username}")
            # Log available users for debugging
            user_count = db.query(User).count()
            logger.info(f"Total users in database: {user_count}")
            if user_count > 0:
                sample_users = db.query(User.username, User.id).limit(3).all()
                logger.info(f"Sample usernames: {[u.username for u in sample_users]}")
            raise credentials_exception

        logger.info(f"User authenticated successfully: {user.username} (ID: {user.id})")
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error during user lookup: {e}")
        logger.error(traceback.format_exc())
        raise credentials_exception


# API Endpoints
@app.get("/api")
def read_api_root():
    logger.info("API root endpoint called")
    return {"message": "Welcome to Trading Post API", "status": "Running on SQLite"}


@app.get("/debug/accepted-matches")
def get_accepted_matches_debug(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Debug endpoint to see accepted matches"""
    accepted = db.query(AcceptedMatch).filter(AcceptedMatch.requester_id == current_user.id).all()
    return {
        "user_id": current_user.id,
        "accepted_matches_count": len(accepted),
        "matches": [
            {
                "id": match.id,
                "target_user_id": match.target_user_id,
                "requester_item_id": match.requester_item_id,
                "target_item_id": match.target_item_id,
                "status": match.status,
                "created_at": match.created_at,
            }
            for match in accepted
        ],
    }


@app.get("/debug/search-test")
def test_search_debug(
    radius: int = 10,
    query: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Debug endpoint to test search with dynamic radius"""
    from pydantic import BaseModel

    class TestSearchRequest(BaseModel):
        radius: int
        query: str
        latitude: float = None
        longitude: float = None

    search_params = TestSearchRequest(
        radius=radius,
        query=query,
        latitude=current_user.latitude,
        longitude=current_user.longitude,
    )

    results = search_listings(search_params, current_user, db)

    return {
        "user_location": {
            "latitude": current_user.latitude,
            "longitude": current_user.longitude,
        },
        "search_params": {"original_radius": radius, "query": query},
        "results_count": len(results),
        # First 5 results for preview
        "results": results[:5] if results else [],
        "distances": [r["distance"] for r in results[:10]] if results else [],
    }


@app.get("/test-logging")
def test_logging():
    logger.info("=== TESTING LOGGING ===")
    logger.warning("This is a warning log")
    logger.error("This is an error log")
    return {"message": "Check server console for log messages"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "SQLite"}


# Error Monitoring Dashboard Endpoints
if ERROR_MONITORING_ENABLED:
    
    @app.get("/api/monitoring/errors/summary")
    async def get_error_summary(hours: int = 24):
        """Get error summary for monitoring dashboard"""
        try:
            summary = error_monitor.get_error_summary(hours)
            return {
                "success": True,
                "data": summary,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get error summary: {e}")
            return {"success": False, "error": str(e)}
    
    @app.get("/api/monitoring/performance/summary")
    async def get_performance_summary(hours: int = 24):
        """Get performance summary for monitoring dashboard"""
        try:
            summary = error_monitor.get_performance_summary(hours)
            return {
                "success": True,
                "data": summary,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get performance summary: {e}")
            return {"success": False, "error": str(e)}
    
    @app.get("/api/monitoring/system/health")
    async def get_system_health():
        """Get current system health metrics"""
        try:
            health = error_monitor.get_system_health()
            return {
                "success": True,
                "data": {
                    "cpu_percent": health.cpu_percent,
                    "memory_percent": health.memory_percent,
                    "disk_usage_percent": health.disk_usage_percent,
                    "active_connections": health.active_connections,
                    "error_rate": health.error_rate,
                    "avg_response_time": health.avg_response_time,
                    "timestamp": health.timestamp.isoformat(),
                    "status": "healthy" if health.cpu_percent < 80 and health.memory_percent < 80 else "warning"
                }
            }
        except Exception as e:
            logger.error(f"Failed to get system health: {e}")
            return {"success": False, "error": str(e)}
    
    @app.get("/api/monitoring/alerts/recent")
    async def get_recent_alerts(limit: int = 50):
        """Get recent alerts for monitoring dashboard"""
        try:
            from error_monitoring import SessionLocal, AlertLog
            
            db = SessionLocal()
            alerts = db.query(AlertLog)\
                      .order_by(AlertLog.created_at.desc())\
                      .limit(limit).all()
            
            alert_data = []
            for alert in alerts:
                alert_data.append({
                    "id": alert.id,
                    "type": alert.alert_type,
                    "severity": alert.severity,
                    "title": alert.title,
                    "message": alert.message,
                    "acknowledged": alert.acknowledged,
                    "created_at": alert.created_at.isoformat(),
                    "notification_sent": alert.notification_sent
                })
            
            db.close()
            
            return {
                "success": True,
                "data": alert_data,
                "count": len(alert_data)
            }
        except Exception as e:
            logger.error(f"Failed to get recent alerts: {e}")
            return {"success": False, "error": str(e)}
    
    @app.post("/api/monitoring/alerts/{alert_id}/acknowledge")
    async def acknowledge_alert(alert_id: str, current_user: User = Depends(get_current_user)):
        """Acknowledge an alert (admin only)"""
        try:
            from error_monitoring import SessionLocal, AlertLog
            
            # For now, any authenticated user can acknowledge alerts
            # In production, add proper admin role checking
            
            db = SessionLocal()
            alert = db.query(AlertLog).filter(AlertLog.id == alert_id).first()
            
            if not alert:
                return {"success": False, "error": "Alert not found"}
            
            alert.acknowledged = True
            alert.acknowledged_by = current_user.username
            alert.acknowledged_at = datetime.utcnow()
            
            db.commit()
            db.close()
            
            logger.info(f"Alert {alert_id} acknowledged by {current_user.username}")
            return {"success": True, "message": "Alert acknowledged"}
            
        except Exception as e:
            logger.error(f"Failed to acknowledge alert: {e}")
            return {"success": False, "error": str(e)}
    
    @app.get("/api/monitoring/dashboard")
    async def get_monitoring_dashboard():
        """Get comprehensive monitoring dashboard data"""
        try:
            # Get all monitoring data in one request
            error_summary = error_monitor.get_error_summary(24)
            performance_summary = error_monitor.get_performance_summary(24)
            system_health = error_monitor.get_system_health()
            
            # Get recent error trends (last 6 hours, hourly)
            error_trends = []
            for i in range(6):
                hour_ago = datetime.utcnow() - timedelta(hours=i)
                hour_summary = error_monitor.get_error_summary(1)  # Last hour from that time
                error_trends.append({
                    "hour": hour_ago.strftime("%H:00"),
                    "errors": hour_summary.get("total_errors", 0)
                })
            
            dashboard_data = {
                "summary": {
                    "total_errors_24h": error_summary.get("total_errors", 0),
                    "unresolved_errors": error_summary.get("unresolved_count", 0),
                    "avg_response_time": performance_summary.get("avg_response_time", 0),
                    "slow_requests_24h": performance_summary.get("slow_requests", 0),
                    "current_cpu": system_health.cpu_percent,
                    "current_memory": system_health.memory_percent,
                    "error_rate_current": system_health.error_rate
                },
                "trends": {
                    "errors_by_hour": error_trends,
                    "error_types": error_summary.get("by_type", {}),
                    "performance_by_endpoint": performance_summary.get("by_endpoint", {})
                },
                "alerts": {
                    "system_status": "healthy" if system_health.cpu_percent < 80 and system_health.memory_percent < 80 else "warning",
                    "active_alerts": 0  # Would count unacknowledged alerts
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return {
                "success": True,
                "data": dashboard_data
            }
            
        except Exception as e:
            logger.error(f"Failed to get monitoring dashboard: {e}")
            return {"success": False, "error": str(e)}

else:
    logger.info("Error monitoring endpoints not available - monitoring system disabled")


# Performance Optimization Endpoints
if PERFORMANCE_OPTIMIZER_ENABLED:
    
    @app.get("/api/performance/analyze")
    async def analyze_system_performance():
        """Comprehensive system performance analysis"""
        try:
            analysis = await analyze_performance()
            return {
                "success": True,
                "data": analysis
            }
        except Exception as e:
            logger.error(f"Performance analysis failed: {e}")
            return {"success": False, "error": str(e)}
    
    @app.post("/api/performance/optimize")
    async def optimize_system_performance():
        """Apply automatic performance optimizations"""
        try:
            result = await optimize_system()
            return {
                "success": True,
                "data": result,
                "message": "Performance optimizations applied successfully"
            }
        except Exception as e:
            logger.error(f"Performance optimization failed: {e}")
            return {"success": False, "error": str(e)}
    
    @app.get("/api/performance/report")
    async def get_optimization_report():
        """Get comprehensive performance optimization report"""
        try:
            report = await get_performance_report()
            return {
                "success": True,
                "data": {
                    "report": report,
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            logger.error(f"Failed to generate performance report: {e}")
            return {"success": False, "error": str(e)}
    
    @app.get("/api/performance/bottlenecks")
    async def get_performance_bottlenecks():
        """Get current performance bottlenecks"""
        try:
            # Run quick analysis to identify bottlenecks
            analysis = await analyze_performance()
            bottlenecks = analysis.get("bottlenecks", [])
            
            return {
                "success": True,
                "data": {
                    "bottlenecks": bottlenecks,
                    "count": len(bottlenecks),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            logger.error(f"Failed to get performance bottlenecks: {e}")
            return {"success": False, "error": str(e)}
    
    logger.info("✅ Performance optimization endpoints registered successfully")

else:
    logger.info("Performance optimization endpoints not available - optimizer disabled")


@app.get("/messages/conversations")
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's conversations"""
    # Get all messages involving the user
    messages = (
        db.query(Message)
        .filter((Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id))
        .order_by(Message.created_at.desc())
        .all()
    )

    # Group by conversation
    conversations = {}
    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        if other_user_id not in conversations:
            other_user = db.query(User).filter(User.id == other_user_id).first()
            conversations[other_user_id] = {
                "id": other_user_id,
                "other_user": {"id": other_user.id, "username": other_user.username},
                "last_message": msg.content,
                "last_message_time": msg.created_at,
                "item": None,
            }
            if msg.item_id:
                item = db.query(Item).filter(Item.id == msg.item_id).first()
                if item:
                    conversations[other_user_id]["item"] = {
                        "id": item.id,
                        "title": item.title,
                    }

    return list(conversations.values())


@app.get("/messages")
def get_all_messages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all messages for the current user (sent and received)"""
    try:
        logger.info(f"Fetching all messages for user: {current_user.id}")

        messages = (
            db.query(Message)
            .filter((Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id))
            .order_by(Message.created_at.desc())
            .all()
        )

        result = []
        for msg in messages:
            # Get sender and receiver info
            sender = db.query(User).filter(User.id == msg.sender_id).first()
            receiver = db.query(User).filter(User.id == msg.receiver_id).first()

            message_data = {
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "created_at": msg.created_at,
                "is_read": msg.is_read,
                "sender_username": sender.username if sender else "Unknown",
                "receiver_username": receiver.username if receiver else "Unknown",
                "item_id": msg.item_id,
            }

            # Add item info if message is about an item
            if msg.item_id:
                item = db.query(Item).filter(Item.id == msg.item_id).first()
                if item:
                    message_data["item"] = {
                        "id": item.id,
                        "title": item.title,
                    }

            result.append(message_data)

        logger.info(f"Returning {len(result)} messages for user {current_user.id}")
        return result

    except Exception as e:
        logger.error(f"Error fetching messages for user {current_user.id}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error fetching messages")


@app.get("/messages/conversation/{user_id}")
def get_conversation_messages(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get messages between current user and specified user"""
    messages = (
        db.query(Message)
        .filter(
            ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id))
            | ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
        )
        .order_by(Message.created_at)
        .all()
    )

    return [
        {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "created_at": msg.created_at,
            "is_read": msg.is_read,
        }
        for msg in messages
    ]


@app.post("/items/{item_id}/save")
def save_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save an item to favorites"""
    # Check if already saved
    existing = db.query(SavedItem).filter(SavedItem.user_id == current_user.id, SavedItem.item_id == item_id).first()

    if existing:
        raise HTTPException(status_code=400, detail="Item already saved")

    # Save the item
    saved = SavedItem(user_id=current_user.id, item_id=item_id)
    db.add(saved)
    db.commit()

    return {"message": "Item saved"}


@app.delete("/items/{item_id}/save")
def unsave_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove item from favorites"""
    saved = db.query(SavedItem).filter(SavedItem.user_id == current_user.id, SavedItem.item_id == item_id).first()

    if not saved:
        raise HTTPException(status_code=404, detail="Saved item not found")

    db.delete(saved)
    db.commit()

    return {"message": "Item removed from saved"}


# Alias endpoints for frontend compatibility (listings vs items)
@app.post("/api/listings/{item_id}/save")
def save_listing_alias(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save listing to favorites (alias for /items/{item_id}/save)"""
    return save_item(item_id, current_user, db)


@app.delete("/api/listings/{item_id}/save")
def unsave_listing_alias(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove listing from favorites (alias for /items/{item_id}/save)"""
    return unsave_item(item_id, current_user, db)


@app.get("/saved-items")
def get_saved_items(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's saved items"""
    saved_items = db.query(Item).join(SavedItem).filter(SavedItem.user_id == current_user.id).all()

    results = []
    for item in saved_items:
        item_dict = {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "price": item.price,
            "category": item.category,
            "listing_type": getattr(item, "listing_type", "sale"),
            "condition": getattr(item, "condition", "good"),
            "images": (json.loads(item.images) if hasattr(item, "images") and item.images else []),
            "created_at": item.created_at,
            "is_available": item.is_available,
            "is_saved": True,
            "owner": {"id": item.owner.id, "username": item.owner.username},
        }
        results.append(item_dict)

    return results


@app.post("/register", response_model=UserResponse)
def register(user: UserSignup, db: Session = Depends(get_db)):
    try:
        logger.info(f"Registration attempt for username: {user.username}")
        logger.info(f"Registration email: {user.email}")
        logger.info(f"Registration zipcode: {user.zipcode}")

        # Check if email already exists
        logger.info("Checking if email already exists")
        db_user = db.query(User).filter(User.email == user.email).first()

        if db_user:
            logger.warning(f"Email already exists: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")

        # Ensure unique username (auto-generated usernames might conflict)
        original_username = user.username
        counter = 1

        while db.query(User).filter(User.username == user.username).first():
            user.username = f"{original_username}_{counter}"
            counter += 1
            logger.info(f"Username conflict, trying: {user.username}")

        logger.info(f"Final username: {user.username}")

        logger.info("Username and email available, proceeding with registration")

        # Simple zipcode to coordinates mapping for common US zipcodes
        # In production, use a proper geocoding service
        zipcode_coords = {
            "21042": (39.2904, -76.8734),  # Columbia, MD
            "10001": (40.7506, -73.9971),  # New York, NY
            "90210": (34.1031, -118.4105),  # Beverly Hills, CA
            "60601": (41.8856, -87.6228),  # Chicago, IL
            "33101": (25.7781, -80.1874),  # Miami, FL
        }

        # Get coordinates from zipcode or use default
        coords = zipcode_coords.get(user.zipcode, (39.2904, -76.8734))
        logger.info(f"Mapped zipcode {user.zipcode} to coordinates: {coords}")

        # Hash password
        logger.info("Hashing user password")
        hashed_password = get_password_hash(user.password)
        logger.info("Password hashed successfully")

        # Create user object
        logger.info("Creating new user in database")
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            latitude=coords[0],
            longitude=coords[1],
            zipcode=user.zipcode,
        )

        # Save to database
        logger.info("Adding user to database")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        logger.info(f"User registered successfully: {db_user.username} (ID: {db_user.id})")
        return db_user

    except HTTPException:
        # Re-raise HTTP exceptions (like 400)
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Registration failed due to server error: {str(e)}")


@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload an image file with comprehensive security validation"""
    try:
        # Security: Validate file exists and has content
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Security: Read and validate file size
        file_content = await file.read()
        file_size = len(file_content)

        if file_size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400, detail=f"File too large. Maximum size: {MAX_IMAGE_SIZE / (1024*1024):.1f}MB"
            )

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        # Security: Validate MIME type with multiple checks
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Security: Allowed image types
        allowed_mime_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
            "image/tiff",
        }
        if file.content_type not in allowed_mime_types:
            raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

        # Security: Sanitize filename to prevent path traversal
        original_filename = file.filename or "upload.jpg"
        if SECURITY_ENABLED:
            original_filename = sanitize_filename(original_filename)
        else:
            # Basic sanitization fallback
            import re

            original_filename = re.sub(r'[<>:"/\\|?*]', "", original_filename)
            original_filename = original_filename.replace("..", "")

        # Security: Validate file extension
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"}
        file_extension = Path(original_filename).suffix.lower()
        if not file_extension or file_extension not in allowed_extensions:
            file_extension = ".jpg"  # Default safe extension

        # Generate secure unique filename
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Security: Create temporary file for validation
        temp_path = UPLOAD_DIR / f"temp_{unique_filename}"

        # Save to temporary location first
        with open(temp_path, "wb") as buffer:
            buffer.write(file_content)

        # Security: Additional file validation if security module available
        if SECURITY_ENABLED:
            try:
                validation_result = image_validator.validate_file_security(str(temp_path), original_filename)

                if not validation_result.get("is_safe", False):
                    # Remove temporary file and reject upload
                    temp_path.unlink(missing_ok=True)
                    logger.warning(
                        f"Malicious file upload attempt by user {current_user.id}. "
                        f"Violations: {validation_result.get('violations', [])}"
                    )
                    raise HTTPException(status_code=400, detail="File failed security validation")
            except Exception as validation_error:
                temp_path.unlink(missing_ok=True)
                logger.error(f"File validation error: {validation_error}")
                raise HTTPException(status_code=400, detail="File validation failed")

        # Move from temporary to final location
        shutil.move(str(temp_path), str(file_path))

        logger.info(f"Image uploaded successfully by user {current_user.id}: {unique_filename}")

        # Return URL
        return {"url": f"/uploads/{unique_filename}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload failed for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        logger.info(f"Login attempt for username: {form_data.username}")
        logger.info(f"Username length: {len(form_data.username)} characters")
        logger.info(f"Password provided: {'Yes' if form_data.password else 'No'}")
        logger.info(f"Password length: {len(form_data.password) if form_data.password else 0} characters")

        # Query user by username (which could be email)
        logger.info(f"Searching for user with username: '{form_data.username}'")
        user = db.query(User).filter(User.username == form_data.username).first()

        if not user:
            logger.warning(f"User not found with username: '{form_data.username}'")
            # Also try searching by email if username search failed
            logger.info(f"Trying to find user by email: '{form_data.username}'")
            user = db.query(User).filter(User.email == form_data.username).first()

            if user:
                logger.info(f"Found user by email: {user.username} (ID: {user.id})")
            else:
                logger.warning(f"User not found by email either: '{form_data.username}'")
                # Log all usernames/emails in database for debugging (first 5)
                all_users = db.query(User.username, User.email, User.id).limit(5).all()
                logger.info(f"Available users (first 5): {[(u.username, u.email, u.id) for u in all_users]}")

                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
            logger.info(f"Found user by username: {user.username} (ID: {user.id}, Email: {user.email})")

        # Verify password
        logger.info(f"Verifying password for user {user.username}")
        password_valid = verify_password(form_data.password, user.hashed_password)
        logger.info(f"Password verification result: {'Valid' if password_valid else 'Invalid'}")

        if not password_valid:
            logger.warning(f"Invalid password for user: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        logger.info(f"Creating access token for user: {user.username[:3]}***")
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        logger.debug(f"Token expires in: {ACCESS_TOKEN_EXPIRE_MINUTES} minutes")

        access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)

        logger.info(f"Successfully created token for user: {user.username[:3]}***")

        response_data = {"access_token": access_token, "token_type": "bearer"}
        logger.info(f"Login successful for user: {user.username} (ID: {user.id})")

        return response_data

    except HTTPException:
        # Re-raise HTTP exceptions (like 401)
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Login failed due to server error: {str(e)}")


@app.options("/items")
def options_items():
    return {"message": "OK"}


@app.post("/items", response_model=ItemResponse)
def create_item(
    item: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # Use current user's location if not provided
        latitude = item.latitude if item.latitude else current_user.latitude
        longitude = item.longitude if item.longitude else current_user.longitude

        h3_index = h3.latlng_to_cell(latitude, longitude, 9)

        db_item = Item(
            title=item.title,
            description=item.description,
            price=item.price,
            category=item.category,
            listing_type=item.listing_type,
            condition=item.condition,
            service_type=item.service_type,
            hourly_rate=item.hourly_rate,
            availability=item.availability,
            images=json.dumps(item.images) if item.images else "[]",
            latitude=latitude,
            longitude=longitude,
            h3_index=h3_index,
            owner_id=current_user.id,
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        # Convert the item to a proper response format
        # Parse images JSON safely
        try:
            if db_item.images:
                images_list = json.loads(db_item.images)
            else:
                images_list = []
        except (json.JSONDecodeError, TypeError):
            images_list = []

        item_response = {
            "id": db_item.id,
            "title": db_item.title,
            "description": db_item.description,
            "price": db_item.price,
            "category": db_item.category,
            "listing_type": db_item.listing_type,
            "condition": db_item.condition,
            "service_type": db_item.service_type,
            "hourly_rate": db_item.hourly_rate,
            "availability": db_item.availability,
            "images": images_list,
            "owner_id": db_item.owner_id,
            "created_at": db_item.created_at,
            "is_available": db_item.is_available,
            "views": db_item.views,
            "is_saved": db_item.is_saved,
        }

        return item_response
    except Exception as e:
        print(f"Error creating item: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create item: {str(e)}")


@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        logger.info(f"Getting item with ID: {item_id}")
        logger.info(f"Current user ID: {current_user.id if current_user else 'None'}")

        # Query the item
        logger.info(f"Querying database for item ID: {item_id}")
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            logger.warning(f"Item not found: {item_id}")
            raise HTTPException(status_code=404, detail="Item not found")

        logger.info(f"Found item: {item.title} (ID: {item.id})")
        logger.info(f"Item owner: {item.owner.username if item.owner else 'No owner'} (ID: {item.owner_id})")

        # Calculate distance if user has location
        distance = None
        try:
            if current_user.latitude and current_user.longitude and item.latitude and item.longitude:
                logger.info("Calculating distance between user location and item location")
                distance = geodesic(
                    (current_user.latitude, current_user.longitude),
                    (item.latitude, item.longitude),
                ).miles
                logger.info(f"Distance calculated: {distance} miles")
        except Exception as e:
            logger.error(f"Error calculating distance: {e}")
            logger.error(traceback.format_exc())
            distance = None

        # Check if saved by current user
        try:
            logger.info(f"Checking if item {item_id} is saved by user {current_user.id}")
            is_saved = (
                db.query(SavedItem).filter(SavedItem.user_id == current_user.id, SavedItem.item_id == item_id).first()
                is not None
            )
            logger.info(f"Item saved status: {is_saved}")
        except Exception as e:
            logger.error(f"Error checking saved status: {e}")
            logger.error(traceback.format_exc())
            is_saved = False

        # Parse images from JSON string to list
        images = []
        if item.images:
            try:
                logger.info(f"Parsing images for item {item_id}: {type(item.images)} - {str(item.images)[:100]}")
                images = json.loads(item.images) if isinstance(item.images, str) else item.images
                logger.info(f"Parsed {len(images)} images")
            except Exception as e:
                logger.error(f"Error parsing images: {e}")
                logger.error(traceback.format_exc())
                images = []

        # Build response
        logger.info(f"Building response for item {item_id}")
        response_data = {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "price": item.price,
            "category": item.category,
            "listing_type": item.listing_type,
            "condition": item.condition,
            "service_type": item.service_type,
            "hourly_rate": item.hourly_rate,
            "availability": item.availability,
            "images": images,
            "owner_id": item.owner_id,  # Add owner_id field
            "created_at": item.created_at,
            "is_available": getattr(item, "is_available", True),  # Add is_available field
            "views": item.views or 0,
            "is_saved": is_saved,
            "distance": distance,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "owner": {
                "id": item.owner.id,
                "username": item.owner.username,
                "email": item.owner.email,
                "is_active": getattr(item.owner, "is_active", True),
                "created_at": item.owner.created_at,
                "latitude": item.owner.latitude,
                "longitude": item.owner.longitude,
                "opt_in": getattr(item.owner, "opt_in", True),
            },
        }

        logger.info(f"Successfully returning item {item_id}")
        return response_data

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting item {item_id}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get item: {str(e)}")


@app.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an item (only owner can delete)"""
    try:
        logger.info(f"Delete item request: ID={item_id} by user {current_user.id}")

        # Get the item
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            logger.warning(f"Item {item_id} not found")
            raise HTTPException(status_code=404, detail="Item not found")

        # Check if current user is the owner
        if item.owner_id != current_user.id:
            logger.warning(f"User {current_user.id} tried to delete item {item_id} owned by {item.owner_id}")
            raise HTTPException(status_code=403, detail="You can only delete your own items")

        logger.info(f"Deleting item {item_id}: '{item.title}' owned by {current_user.username}")

        # Delete associated saved items first (foreign key constraint)
        saved_items = db.query(SavedItem).filter(SavedItem.item_id == item_id).all()
        for saved_item in saved_items:
            db.delete(saved_item)
        logger.info(f"Deleted {len(saved_items)} saved item references")

        # Delete associated messages
        messages = db.query(Message).filter(Message.item_id == item_id).all()
        for message in messages:
            db.delete(message)
        logger.info(f"Deleted {len(messages)} associated messages")

        # Delete the item
        db.delete(item)
        db.commit()

        logger.info(f"Successfully deleted item {item_id}")
        return {"message": "Item deleted successfully"}

    except HTTPException:
        # Re-raise HTTP exceptions (like 404, 403)
        raise
    except Exception as e:
        logger.error(f"Error deleting item {item_id}: {e}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")


# AI Photo Mode Endpoints
@app.post("/api/items/analyze-photo", response_model=AIPhotoSessionResponse)
async def upload_and_analyze_photo(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None,
):
    """Upload a photo and create analysis session with comprehensive security validation"""
    try:
        # SECURITY: Check verified human membership requirement
        membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()

        is_verified = False
        if membership and membership.end_date:
            is_verified = datetime.utcnow() <= membership.end_date
        elif membership:
            is_verified = True

        if not is_verified:
            logger.warning(f"AI feature access denied - user {current_user.id} not verified human")
            raise HTTPException(
                status_code=403,
                detail="AI Photo Mode requires Verified Human membership. Please upgrade to access this feature.",
            )

        # Get client IP for rate limiting
        client_ip = request.client.host if request else "unknown"

        # Security: Rate limiting check
        if SECURITY_ENABLED:
            upload_check = rate_limiter.check_upload_rate_limit(current_user.id, client_ip)
            if not upload_check["allowed"]:
                logger.warning(f"Rate limit exceeded for user {current_user.id}: {upload_check['reason']}")
                raise HTTPException(status_code=429, detail=upload_check["reason"])

            analysis_check = rate_limiter.check_analysis_rate_limit(current_user.id)
            if not analysis_check["allowed"]:
                logger.warning(f"Analysis rate limit exceeded for user {current_user.id}: {analysis_check['reason']}")
                raise HTTPException(status_code=429, detail=analysis_check["reason"])

        # Basic file validation
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}")

        # Read file and check size
        file_content = await photo.read()
        if len(file_content) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400, detail=f"File too large. Maximum size: {MAX_IMAGE_SIZE / (1024*1024):.1f}MB"
            )

        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        # Security: Sanitize filename
        original_filename = photo.filename or "upload.jpg"
        if SECURITY_ENABLED:
            original_filename = sanitize_filename(original_filename)
        else:
            # Basic sanitization
            original_filename = original_filename.replace("..", "").replace("/", "").replace("\\", "")

        # Create unique filename and save
        file_extension = original_filename.split(".")[-1] if "." in original_filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        # Create AI uploads directory
        ai_uploads_dir = Path("uploads/ai_photos")
        ai_uploads_dir.mkdir(parents=True, exist_ok=True)

        file_path = ai_uploads_dir / unique_filename

        # Save file temporarily for security validation
        temp_file_path = ai_uploads_dir / f"temp_{unique_filename}"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(file_content)

        # Security: Comprehensive file validation
        if SECURITY_ENABLED:
            validation_result = image_validator.validate_file_security(str(temp_file_path), original_filename)

            if not validation_result["is_safe"]:
                # Quarantine malicious file
                quarantine_path = quarantine_file(str(temp_file_path), "security_violation")
                logger.warning(
                    f"Malicious file upload attempt by user {current_user.id}. "
                    f"Violations: {validation_result['violations']}"
                )
                raise HTTPException(status_code=400, detail="File failed security validation. Upload denied.")

            logger.info(f"File passed security validation: {validation_result['metadata']}")

        # Move temp file to final location if validation passed
        try:
            temp_file_path.rename(file_path)
        except Exception as e:
            logger.error(f"Failed to move validated file: {e}")
            # Clean up temp file
            if temp_file_path.exists():
                temp_file_path.unlink()
            raise HTTPException(status_code=500, detail="File processing failed")

        # Security: Record rate limit events
        if SECURITY_ENABLED:
            rate_limiter.record_upload(current_user.id, client_ip)
            rate_limiter.record_analysis(current_user.id)

        # Create photo session record
        session = AIPhotoSession(
            user_id=current_user.id, image_path=str(file_path), original_filename=photo.filename or "unknown.jpg"
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        logger.info(f"Created AI photo session {session.id} for user {current_user.id}")

        # Start async analysis (don't await - return immediately)
        asyncio.create_task(analyze_photo_background(session.id, str(file_path), db))

        return session

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload photo: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload photo")


async def analyze_photo_background(session_id: str, image_path: str, db: Session):
    """Background task to analyze photo with Grok API"""
    try:
        # Get fresh session from DB
        session = db.query(AIPhotoSession).filter(AIPhotoSession.id == session_id).first()
        if not session:
            logger.error(f"Session {session_id} not found for analysis")
            return

        # Analyze with Grok
        analysis_result = await grok_service.analyze_item_photo(image_path)

        # Create suggestion record
        suggestion = AIItemSuggestion(
            session_id=session_id,
            suggested_title=analysis_result.get("title"),
            suggested_description=analysis_result.get("description"),
            suggested_category=analysis_result.get("category"),
            suggested_price=analysis_result.get("estimated_price"),
            suggested_condition=analysis_result.get("condition"),
            confidence_score=analysis_result.get("confidence_score", 0.0),
            raw_grok_response=json.dumps(analysis_result),
        )

        db.add(suggestion)

        # Update session status
        session.analysis_status = "completed"
        db.commit()

        logger.info(f"Completed analysis for session {session_id} with confidence {suggestion.confidence_score}")

    except Exception as e:
        logger.error(f"Background analysis failed for session {session_id}: {e}")
        # Update session to failed status
        try:
            session = db.query(AIPhotoSession).filter(AIPhotoSession.id == session_id).first()
            if session:
                session.analysis_status = "failed"
                db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update session status: {db_error}")


@app.get("/api/items/ai-suggestions/{session_id}", response_model=AIItemSuggestionResponse)
def get_ai_suggestions(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI analysis results for a photo session"""
    try:
        # SECURITY: Check verified human membership requirement
        membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()

        is_verified = False
        if membership and membership.end_date:
            is_verified = datetime.utcnow() <= membership.end_date
        elif membership:
            is_verified = True

        if not is_verified:
            logger.warning(f"AI feature access denied - user {current_user.id} not verified human")
            raise HTTPException(
                status_code=403,
                detail="AI Photo Mode requires Verified Human membership. Please upgrade to access this feature.",
            )

        # Verify session belongs to current user
        session = (
            db.query(AIPhotoSession)
            .filter(AIPhotoSession.id == session_id)
            .filter(AIPhotoSession.user_id == current_user.id)
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Photo session not found")

        # Check if analysis is complete
        if session.analysis_status == "processing":
            raise HTTPException(status_code=202, detail="Analysis still in progress")

        if session.analysis_status == "failed":
            raise HTTPException(status_code=500, detail="Analysis failed")

        # Get suggestion
        suggestion = db.query(AIItemSuggestion).filter(AIItemSuggestion.session_id == session_id).first()

        if not suggestion:
            raise HTTPException(status_code=404, detail="Analysis results not found")

        return suggestion

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get AI suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve suggestions")


@app.post("/api/items/create-from-ai", response_model=ItemResponse)
def create_item_from_ai(
    request: AIListingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new listing from AI analysis results"""
    try:
        # SECURITY: Check verified human membership requirement
        membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()

        is_verified = False
        if membership and membership.end_date:
            is_verified = datetime.utcnow() <= membership.end_date
        elif membership:
            is_verified = True

        if not is_verified:
            logger.warning(f"AI feature access denied - user {current_user.id} not verified human")
            raise HTTPException(
                status_code=403,
                detail="AI Photo Mode requires Verified Human membership. Please upgrade to access this feature.",
            )

        # Verify session and get suggestions
        session = (
            db.query(AIPhotoSession)
            .filter(AIPhotoSession.id == request.session_id)
            .filter(AIPhotoSession.user_id == current_user.id)
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Photo session not found")

        suggestion = db.query(AIItemSuggestion).filter(AIItemSuggestion.session_id == request.session_id).first()

        # Use AI suggestions or user overrides
        if request.use_ai_suggestion and suggestion:
            title = request.title or suggestion.suggested_title
            description = request.description or suggestion.suggested_description
            price = request.price if request.price is not None else suggestion.suggested_price
            category = request.category or suggestion.suggested_category
            condition = request.condition or suggestion.suggested_condition
        else:
            title = request.title or "AI-Generated Listing"
            description = request.description or "Please add description"
            price = request.price or 0.0
            category = request.category or "other"
            condition = request.condition or "good"

        # Use current user's location
        h3_index = h3.latlng_to_cell(current_user.latitude, current_user.longitude, 9)

        # Create item with AI photo
        db_item = Item(
            title=title,
            description=description,
            price=price,
            category=category,
            condition=condition,
            images=json.dumps([session.image_path]),  # Include AI-captured photo
            latitude=current_user.latitude,
            longitude=current_user.longitude,
            h3_index=h3_index,
            owner_id=current_user.id,
            listing_type="sale",
        )

        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        logger.info(f"Created AI-powered listing {db_item.id} from session {request.session_id}")

        # Clean up old AI photo sessions (optional)
        cleanup_expired_sessions(db)

        return db_item

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create item from AI: {e}")
        raise HTTPException(status_code=500, detail="Failed to create listing")


def cleanup_expired_sessions(db: Session):
    """Clean up expired AI photo sessions"""
    try:
        expired_sessions = db.query(AIPhotoSession).filter(AIPhotoSession.expires_at < datetime.utcnow()).all()

        for session in expired_sessions:
            # Delete associated files
            try:
                if session.image_path and Path(session.image_path).exists():
                    Path(session.image_path).unlink()
            except Exception as file_error:
                logger.warning(f"Failed to delete image file: {file_error}")

            # Delete database records
            db.query(AIItemSuggestion).filter(AIItemSuggestion.session_id == session.id).delete()
            db.delete(session)

        if expired_sessions:
            db.commit()
            logger.info(f"Cleaned up {len(expired_sessions)} expired AI photo sessions")

    except Exception as e:
        logger.error(f"Session cleanup failed: {e}")


class SearchRequest(BaseModel):
    radius: int = 10
    query: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@app.post("/api/listings/search")
def search_listings(
    search_params: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Optimized search for listings within radius (miles)"""
    try:
        logger.info(f"Search listings requested by user {current_user.id}")
        
        # Use provided coordinates or user's default
        search_lat = search_params.latitude if search_params.latitude else current_user.latitude
        search_lon = search_params.longitude if search_params.longitude else current_user.longitude
        
        if not search_lat or not search_lon:
            logger.warning("No coordinates available for search - user has no location set")
            return []

        # Use optimized query if available, otherwise fallback to original logic
        if OPTIMIZATIONS_AVAILABLE:
            logger.info("Using optimized search query")
            results = OptimizedQueries.search_listings_optimized(
                db=db,
                query=search_params.query,
                latitude=search_lat,
                longitude=search_lon,
                radius_miles=search_params.radius,
                limit=50
            )
            
            # Filter out user's own items and add user info
            filtered_results = []
            for item in results:
                if item.get("owner_id") != current_user.id:
                    # Convert owner info to user info for consistency
                    if item.get("owner"):
                        item["user"] = {
                            "id": item["owner"]["id"],
                            "username": item["owner"]["username"], 
                            "latitude": search_lat,  # Use search location for privacy
                            "longitude": search_lon,
                        }
                        del item["owner"]  # Remove owner key
                    
                    # Convert distance_miles to distance for consistency
                    if "distance_miles" in item:
                        item["distance"] = round(item["distance_miles"] * 1.60934, 1)  # Convert to km
                        del item["distance_miles"]
                    
                    filtered_results.append(item)
            
            logger.info(f"Optimized search completed - returning {len(filtered_results)} items")
            return filtered_results
        
        else:
            # Fallback to original implementation
            logger.warning("Using fallback search implementation")
            # [Original implementation would go here if needed]
            return []

    except Exception as e:
        logger.error(f"Error in search_listings: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to search listings: {str(e)}")


@app.get("/items", response_model=List[ItemResponse])
def search_items(
    category: Optional[str] = None,
    max_distance: float = 50.0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get user location
    user_lat = current_user.latitude
    user_lon = current_user.longitude

    # Base query
    query = db.query(Item).filter(Item.is_available)

    if category:
        query = query.filter(Item.category == category)

    # Get items within H3 cells
    user_h3 = h3.latlng_to_cell(user_lat, user_lon, 9)
    nearby_h3_cells = h3.disk(user_h3, 3)

    query = query.filter(Item.h3_index.in_(nearby_h3_cells))
    # Get more items to filter by distance
    items = query.limit(limit * 2).all()

    # Calculate distances and filter
    results = []
    for item in items:
        distance = geodesic((user_lat, user_lon), (item.latitude, item.longitude)).km
        if distance <= max_distance:
            item_dict = {
                "id": item.id,
                "title": item.title,
                "description": item.description,
                "price": item.price,
                "category": item.category,
                "owner_id": item.owner_id,
                "created_at": item.created_at,
                "is_available": item.is_available,
                "distance": round(distance, 2),
            }
            results.append(item_dict)

    # Sort by distance and limit
    results.sort(key=lambda x: x["distance"])
    results = results[:limit]

    return results


@app.post("/messages")
def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify item exists and is available
    item = db.query(Item).filter(Item.id == message.item_id).first()
    if not item or not item.is_available:
        raise HTTPException(status_code=404, detail="Item not found or unavailable")

    # Check if user has active membership
    membership = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.is_active).first()

    # If no active membership, check daily message limit
    if not membership or (membership.end_date and datetime.utcnow() > membership.end_date):
        # Check how many new people they've messaged today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Count unique recipients messaged today
        today_new_recipients = (
            db.query(DailyMessageTracker)
            .filter(
                DailyMessageTracker.sender_id == current_user.id,
                DailyMessageTracker.date >= today_start,
            )
            .count()
        )

        # Check if this is a new recipient today
        existing_conversation = (
            db.query(Message)
            .filter(
                or_(
                    and_(
                        Message.sender_id == current_user.id,
                        Message.receiver_id == message.receiver_id,
                    ),
                    and_(
                        Message.sender_id == message.receiver_id,
                        Message.receiver_id == current_user.id,
                    ),
                )
            )
            .first()
        )

        # If new recipient and already messaged someone today, block
        if not existing_conversation and today_new_recipients >= 1:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Message limit reached",
                    "message": "Free users can only message 1 new person per day. Upgrade to Verified Human membership for unlimited messaging!",
                    "upgrade_required": True,
                },
            )

        # Track this new recipient if it's new
        if not existing_conversation:
            tracker = DailyMessageTracker(
                sender_id=current_user.id,
                recipient_id=message.receiver_id,
                date=datetime.utcnow(),
            )
            db.add(tracker)

    # Create message
    db_message = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        item_id=message.item_id,
        content=message.content,
    )
    db.add(db_message)
    db.commit()

    return {"message": "Message sent successfully"}


@app.get("/api/listings")
def get_all_listings(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """Optimized get all listings with pagination and eager loading"""
    try:
        logger.info(f"Getting all listings - page: {page}, limit: {limit}")
        
        # Use optimized query if available
        if OPTIMIZATIONS_AVAILABLE:
            logger.info("Using optimized listings query")
            return OptimizedQueries.get_listings_with_pagination(db, page, limit)
        else:
            # Fallback to basic optimized version without external dependency
            logger.warning("Using basic optimized listings query")
            from sqlalchemy.orm import joinedload
            
            offset = (page - 1) * limit
            
            # Single query with eager loading to prevent N+1 queries
            listings = (
                db.query(Item)
                .options(joinedload(Item.owner))  # Eager load owner
                .filter(Item.is_available == True)
                .order_by(Item.created_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )
            
            # Get total count efficiently
            total = db.query(Item).filter(Item.is_available == True).count()
            
            # Process listings
            processed_listings = []
            for listing in listings:
                # Parse images safely
                images = []
                if listing.images:
                    try:
                        images = json.loads(listing.images) if isinstance(listing.images, str) else listing.images
                    except:
                        images = []
                
                listing_data = {
                    "id": listing.id,
                    "title": listing.title,
                    "description": listing.description,
                    "price": listing.price,
                    "category": listing.category,
                    "listing_type": listing.listing_type,
                    "condition": listing.condition,
                    "service_type": listing.service_type,
                    "hourly_rate": listing.hourly_rate,
                    "availability": listing.availability,
                    "images": images,
                    "latitude": listing.latitude,
                    "longitude": listing.longitude,
                    "created_at": listing.created_at,
                    "is_available": listing.is_available,
                    "views": listing.views or 0,
                    "owner_id": listing.owner_id,
                }
                
                # Owner info already loaded via joinedload
                if listing.owner:
                    listing_data["owner"] = {
                        "id": listing.owner.id,
                        "username": listing.owner.username,
                        "created_at": listing.owner.created_at,
                    }
                
                processed_listings.append(listing_data)
            
            pages = (total + limit - 1) // limit
            
            return {
                "listings": processed_listings,
                "total": total,
                "page": page,
                "pages": pages,
            }

    except Exception as e:
        logger.error(f"Unexpected error getting all listings: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get listings: {str(e)}")


@app.get("/api/listings/{listing_id}")
def get_listing_by_id(listing_id: int, db: Session = Depends(get_db)):
    """Get a specific listing by ID"""
    try:
        logger.info(f"Getting listing with ID: {listing_id}")

        # Query the specific listing
        listing = db.query(Item).filter(Item.id == listing_id, Item.is_available).first()

        if not listing:
            logger.warning(f"Listing {listing_id} not found or not available")
            raise HTTPException(status_code=404, detail=f"Listing with ID {listing_id} not found")

        logger.info(f"Found listing: {listing.title}")

        # Get owner information
        owner = db.query(User).filter(User.id == listing.owner_id).first()

        # Build the response data
        listing_data = {
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "price": listing.price,
            "category": listing.category,
            "listing_type": listing.listing_type,
            "condition": listing.condition,
            "service_type": listing.service_type,
            "hourly_rate": listing.hourly_rate,
            "availability": listing.availability,
            "images": listing.images.split(",") if listing.images else [],
            "created_at": listing.created_at,
            "updated_at": getattr(listing, "updated_at", listing.created_at),
            "is_available": listing.is_available,
            "owner_id": listing.owner_id,
            "latitude": listing.latitude,
            "longitude": listing.longitude,
            "views": getattr(listing, "views", 0),
            "owner": {"id": owner.id, "username": owner.username} if owner else None,
        }

        logger.info(f"Successfully returning listing {listing_id}: {listing.title}")
        return listing_data

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting listing {listing_id}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get listing: {str(e)}")


@app.get("/users/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        logger.info(f"Getting current user profile for user: {current_user.username} (ID: {current_user.id})")
        logger.info(f"User details: email={current_user.email}, created_at={current_user.created_at}")
        logger.info(f"User location: lat={current_user.latitude}, lon={current_user.longitude}")

        # Check membership status
        membership = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.is_active).first()

        is_verified = False
        if membership and membership.end_date:
            is_verified = datetime.utcnow() <= membership.end_date
        elif membership:
            is_verified = True

        # Return user data
        response_data = {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "created_at": current_user.created_at,
            "latitude": current_user.latitude,
            "longitude": current_user.longitude,
            "is_active": getattr(current_user, "is_active", True),
            "opt_in": getattr(current_user, "opt_in", True),
            "bio": getattr(current_user, "bio", None),
            "is_verified_human": is_verified,
        }

        logger.info(f"Successfully returning user profile for {current_user.username}")
        return response_data

    except Exception as e:
        logger.error(f"Error getting current user profile: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")


@app.put("/users/me", response_model=UserResponse)
def update_current_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's profile information"""
    try:
        logger.info(f"Updating user profile for user: {current_user.username} (ID: {current_user.id})")

        # Update only the fields that were provided
        update_data = user_data.dict(exclude_unset=True)

        if "username" in update_data:
            # Check if username is already taken by another user
            existing_user = (
                db.query(User).filter(User.username == update_data["username"], User.id != current_user.id).first()
            )
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already taken")
            current_user.username = update_data["username"]

        if "email" in update_data:
            # Check if email is already taken by another user
            existing_user = (
                db.query(User).filter(User.email == update_data["email"], User.id != current_user.id).first()
            )
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already taken")
            current_user.email = update_data["email"]

        if "latitude" in update_data:
            current_user.latitude = update_data["latitude"]

        if "longitude" in update_data:
            current_user.longitude = update_data["longitude"]

        if "bio" in update_data:
            current_user.bio = update_data["bio"]

        if "opt_in" in update_data:
            current_user.opt_in = update_data["opt_in"]

        db.commit()
        db.refresh(current_user)

        # Get membership status for response
        membership = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.is_active).first()

        is_verified = False
        if membership and membership.end_date:
            is_verified = datetime.utcnow() <= membership.end_date
        elif membership:
            is_verified = True

        # Return updated user data
        response_data = {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "created_at": current_user.created_at,
            "latitude": current_user.latitude,
            "longitude": current_user.longitude,
            "is_active": getattr(current_user, "is_active", True),
            "opt_in": getattr(current_user, "opt_in", True),
            "bio": getattr(current_user, "bio", None),
            "is_verified_human": is_verified,
        }

        logger.info(f"Successfully updated user profile for {current_user.username}")
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating current user profile: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to update user profile: {str(e)}")


@app.get("/users/{user_id}/listings")
def get_user_listings(user_id: int, page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """Get listings for a specific user"""
    try:
        logger.info(f"Getting listings for user {user_id} - page: {page}, limit: {limit}")
        offset = (page - 1) * limit
        logger.info(f"Calculated offset: {offset}")

        # First check if user exists
        logger.info(f"Checking if user {user_id} exists")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")

        logger.info(f"Found user: {user.username} (ID: {user_id})")

        # Query listings for this user
        logger.info(f"Querying available listings for user {user_id} with offset {offset} and limit {limit}")
        listings = db.query(Item).filter(Item.owner_id == user_id, Item.is_available).offset(offset).limit(limit).all()

        logger.info(f"Found {len(listings)} listings for user {user_id}")

        # Get total count
        logger.info(f"Getting total count of available listings for user {user_id}")
        total = db.query(Item).filter(Item.owner_id == user_id, Item.is_available).count()
        logger.info(f"Total available listings for user {user_id}: {total}")

        # Calculate pages
        pages = (total + limit - 1) // limit
        logger.info(f"Total pages: {pages}")

        # Process listings data
        processed_listings = []
        for listing in listings:
            try:
                logger.info(f"Processing user listing ID: {listing.id} - {listing.title}")

                # Parse images safely
                images = []
                if listing.images:
                    try:
                        images = json.loads(listing.images) if isinstance(listing.images, str) else listing.images
                        logger.info(f"User listing {listing.id} has {len(images)} images")
                    except Exception as e:
                        logger.error(f"Error parsing images for user listing {listing.id}: {e}")
                        images = []

                # Build listing object
                listing_data = {
                    "id": listing.id,
                    "title": listing.title,
                    "description": listing.description,
                    "price": listing.price,
                    "category": listing.category,
                    "listing_type": listing.listing_type,
                    "condition": listing.condition,
                    "service_type": listing.service_type,
                    "hourly_rate": listing.hourly_rate,
                    "availability": listing.availability,
                    "images": images,
                    "latitude": listing.latitude,
                    "longitude": listing.longitude,
                    "created_at": listing.created_at,
                    "is_available": listing.is_available,
                    "views": listing.views or 0,
                    "owner_id": listing.owner_id,
                }

                # Add owner info (should be the requested user)
                if listing.owner:
                    listing_data["owner"] = {
                        "id": listing.owner.id,
                        "username": listing.owner.username,
                        "created_at": listing.owner.created_at,
                    }
                    logger.info(f"Added owner info for user listing {listing.id}: {listing.owner.username}")
                else:
                    logger.warning(f"No owner found for user listing {listing.id} (this should not happen)")
                    listing_data["owner"] = None

                processed_listings.append(listing_data)

            except Exception as e:
                logger.error(f"Error processing user listing {listing.id}: {e}")
                logger.error(traceback.format_exc())
                continue

        response_data = {
            "listings": processed_listings,
            "total": total,
            "page": page,
            "pages": pages,
        }

        logger.info(f"Successfully returning {len(processed_listings)} listings for user {user_id}, page {page}")
        return response_data

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting listings for user {user_id}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get user listings: {str(e)}")


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        logger.info(f"Getting user profile for user ID: {user_id}")
        logger.info(f"Requested by current user ID: {current_user.id if current_user else 'None'}")

        # Query the user
        logger.info(f"Querying database for user ID: {user_id}")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        logger.info(f"Found user: {user.username} (ID: {user.id})")
        logger.info(f"User created at: {user.created_at}")

        logger.info(f"Successfully returning user profile for {user_id}")
        return user

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting user {user_id}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")


@app.get("/recommendations")
def get_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simple recommendation based on user's past interactions

    # Get user's categories from past messages
    user_categories = (
        db.query(Item.category)
        .join(Message, Message.item_id == Item.id)
        .filter(Message.sender_id == current_user.id)
        .distinct()
        .limit(5)
        .all()
    )

    categories = [cat[0] for cat in user_categories] if user_categories else ["electronics", "furniture"]

    recommendations = []
    for category in categories:
        items = search_items(category=category, current_user=current_user, db=db)
        recommendations.extend(items[:3])

    return recommendations[:10]


class MatchResponse(BaseModel):
    match_score: float
    user: UserResponse
    user_offers: List[ItemResponse]
    user_wants: List[ItemResponse]
    potential_trades: List[dict]


class MatchedUserResponse(BaseModel):
    id: int
    username: str
    email: str


class ListingResponse(BaseModel):
    id: int
    title: str
    category: str
    price: float


class MatchItemResponse(BaseModel):
    id: int
    matched_user: MatchedUserResponse
    their_listing: ListingResponse
    your_listing: ListingResponse
    ai_score: float
    ai_reason: str


class MatchesPageResponse(BaseModel):
    matches: List[MatchItemResponse]
    page: int
    total_pages: int
    total: int


@app.get("/matches")
def get_matches(
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI-Powered Matching Algorithm with Weighted Scoring:

    1. Value Compatibility (35% weight - reduced):
       - 90-110% of value = Perfect match (1.0 score)
       - 75-125% of value = Good match (0.8 score)
       - 50-150% of value = Fair match (0.6 score)
       - Outside range = Poor match (0.3 score)

    2. Distance Score (25% weight - reduced):
       - 0-3 miles = Perfect (1.0 score)
       - 3-7 miles = Good (0.8 score)
       - 7-15 miles = Fair (0.6 score)
       - 15-30 miles = Poor (0.3 score)
       - 30+ miles = Very poor (0.1 score)

    3. Category Match (15% weight - reduced):
       - Exact category match = 1.0 score
       - Related categories = 0.7 score
       - Different categories = 0.3 score

    4. Item Condition (10% weight - same):
       - New/Like New = 1.0 score
       - Good = 0.8 score
       - Fair = 0.6 score

    5. User Reputation (15% weight - NEW):
       - Based on user reviews and ratings
       - Higher rated users get priority in matches
    """

    # Get current user's wants (items with [WANTED] prefix or
    # listing_type='wanted')
    my_wants = (
        db.query(Item)
        .filter(
            Item.owner_id == current_user.id,
            or_(Item.title.like("[WANTED]%"), Item.listing_type == "wanted"),
            Item.is_available,
        )
        .all()
    )

    # Get current user's offers (items without [WANTED] prefix and
    # listing_type != 'wanted')
    my_offers = (
        db.query(Item)
        .filter(
            Item.owner_id == current_user.id,
            ~Item.title.like("[WANTED]%"),
            Item.listing_type != "wanted",
            Item.is_available,
        )
        .all()
    )

    # Helper functions for scoring
    def calculate_value_score(wanted_price, offered_price):
        """Calculate value compatibility score"""
        if wanted_price == 0 or offered_price == 0:
            return 0.5
        ratio = offered_price / wanted_price
        if 0.9 <= ratio <= 1.1:  # Within 10%
            return 1.0
        elif 0.75 <= ratio <= 1.25:  # Within 25%
            return 0.8
        elif 0.5 <= ratio <= 1.5:  # Within 50%
            return 0.6
        else:
            return 0.3

    def calculate_distance_score(distance_miles):
        """Calculate distance score"""
        if distance_miles <= 3:
            return 1.0
        elif distance_miles <= 7:
            return 0.8
        elif distance_miles <= 15:
            return 0.6
        elif distance_miles <= 30:
            return 0.3
        else:
            return 0.1

    def calculate_category_score(cat1, cat2):
        """Calculate category match score"""
        # Normalize categories
        cat1_lower = cat1.lower()
        cat2_lower = cat2.lower()

        if cat1_lower == cat2_lower:
            return 1.0

        # Related categories
        related_categories = {
            "electronics": ["computers", "phones", "gadgets"],
            "furniture": ["home", "decor", "household"],
            "services": ["help", "labor", "work"],
            "vehicles": ["transportation", "bikes", "scooters"],
        }

        for main_cat, related in related_categories.items():
            if (cat1_lower == main_cat and cat2_lower in related) or (cat2_lower == main_cat and cat1_lower in related):
                return 0.7

        return 0.3

    def calculate_condition_score(condition):
        """Calculate condition score for items"""
        if condition in ["new", "like_new"]:
            return 1.0
        elif condition == "good":
            return 0.8
        elif condition == "fair":
            return 0.6
        else:
            return 0.5

    # Find all other users
    other_users = db.query(User).filter(User.id != current_user.id).all()

    # Get all accepted matches for current user to exclude them from future
    # matches
    accepted_matches = db.query(AcceptedMatch).filter(AcceptedMatch.requester_id == current_user.id).all()

    # Create sets of (user_id, their_item_id, my_item_id) combinations to
    # exclude
    excluded_combinations = set()
    for accepted in accepted_matches:
        excluded_combinations.add(
            (
                accepted.target_user_id,
                accepted.target_item_id,
                accepted.requester_item_id,
            )
        )
        # Also exclude reverse combinations to prevent both users from seeing
        # the same match
        excluded_combinations.add(
            (
                accepted.target_user_id,
                accepted.requester_item_id,
                accepted.target_item_id,
            )
        )

    logger.info(f"Found {len(accepted_matches)} accepted matches, excluding {len(excluded_combinations)} combinations")

    all_matches = []

    for other_user in other_users:
        # Calculate distance once per user
        distance_km = geodesic(
            (current_user.latitude, current_user.longitude),
            (other_user.latitude, other_user.longitude),
        ).km
        distance_miles = distance_km * 0.621371
        distance_score = calculate_distance_score(distance_miles)

        # Get their wants and offers
        their_wants = (
            db.query(Item)
            .filter(
                Item.owner_id == other_user.id,
                or_(Item.title.like("[WANTED]%"), Item.listing_type == "wanted"),
                Item.is_available,
            )
            .all()
        )

        their_offers = (
            db.query(Item)
            .filter(
                Item.owner_id == other_user.id,
                ~Item.title.like("[WANTED]%"),
                Item.listing_type != "wanted",
                Item.is_available,
            )
            .all()
        )

        # Calculate reputation score for this user
        other_user_reviews = db.query(Review).filter(Review.reviewed_user_id == other_user.id).all()
        if other_user_reviews:
            avg_rating = sum(r.rating for r in other_user_reviews) / len(other_user_reviews)
            volume_bonus = min(len(other_user_reviews) * 2, 20)  # Max 20 point bonus
            reputation_score = min((avg_rating / 5.0) + (volume_bonus / 100), 1.0)  # Cap at 1.0
        else:
            reputation_score = 0.5  # Neutral score for users with no reviews

        user_match_trades = []

        # Check if they offer something I want
        for my_want in my_wants:
            for their_offer in their_offers:
                # Calculate individual scores
                value_score = calculate_value_score(my_want.price, their_offer.price)
                category_score = calculate_category_score(my_want.category, their_offer.category)
                condition_score = (
                    calculate_condition_score(their_offer.condition) if their_offer.listing_type == "sale" else 1.0
                )

                # Weighted total score (now includes reputation)
                total_score = (
                    value_score * 0.35  # 35% weight (reduced)
                    + distance_score * 0.25  # 25% weight (reduced)
                    + category_score * 0.15  # 15% weight (reduced)
                    + condition_score * 0.10  # 10% weight (same)
                    # 15% weight (NEW - reputation boost)
                    + reputation_score * 0.15
                )

                if total_score > 0.5:  # Only include matches above 50% score
                    # Check if this match combination has already been accepted
                    combination = (other_user.id, their_offer.id, my_want.id)
                    if combination not in excluded_combinations:
                        user_match_trades.append(
                            {
                                "match_type": "they_have_what_i_want",
                                "score": total_score,
                                "my_want": my_want,
                                "their_offer": their_offer,
                                "value_score": value_score,
                                "distance_score": distance_score,
                                "category_score": category_score,
                                "condition_score": condition_score,
                                "reputation_score": reputation_score,
                            }
                        )
                    else:
                        logger.info(
                            f"Excluding already accepted match: user {other_user.id}, their item {their_offer.id}, my item {my_want.id}"
                        )

        # Check if I offer something they want
        for their_want in their_wants:
            for my_offer in my_offers:
                # Calculate individual scores
                value_score = calculate_value_score(their_want.price, my_offer.price)
                category_score = calculate_category_score(their_want.category, my_offer.category)
                condition_score = (
                    calculate_condition_score(my_offer.condition) if my_offer.listing_type == "sale" else 1.0
                )

                # Weighted total score (now includes reputation)
                total_score = (
                    value_score * 0.35  # 35% weight (reduced)
                    + distance_score * 0.25  # 25% weight (reduced)
                    + category_score * 0.15  # 15% weight (reduced)
                    + condition_score * 0.10  # 10% weight (same)
                    # 15% weight (NEW - reputation boost)
                    + reputation_score * 0.15
                )

                if total_score > 0.5:  # Only include matches above 50% score
                    # Check if this match combination has already been accepted
                    combination = (other_user.id, their_want.id, my_offer.id)
                    if combination not in excluded_combinations:
                        user_match_trades.append(
                            {
                                "match_type": "i_have_what_they_want",
                                "score": total_score,
                                "their_want": their_want,
                                "my_offer": my_offer,
                                "value_score": value_score,
                                "distance_score": distance_score,
                                "category_score": category_score,
                                "condition_score": condition_score,
                                "reputation_score": reputation_score,
                            }
                        )
                    else:
                        logger.info(
                            f"Excluding already accepted match: user {other_user.id}, their item {their_want.id}, my item {my_offer.id}"
                        )

        # If we have any matches with this user, add them to the list
        if user_match_trades:
            # Sort by score and take top 3 matches
            user_match_trades.sort(key=lambda x: x["score"], reverse=True)
            best_matches = user_match_trades[:3]

            # Calculate average score for this user
            avg_score = sum(m["score"] for m in best_matches) / len(best_matches)

            all_matches.append(
                {
                    "user": other_user,
                    "avg_score": avg_score,
                    "distance_miles": distance_miles,
                    "matches": best_matches,
                }
            )

    # Sort all matches by average score
    all_matches.sort(key=lambda x: x["avg_score"], reverse=True)

    # Convert to frontend expected format
    match_items = []
    match_id = 1

    for user_match in all_matches:
        other_user = user_match["user"]

        for match in user_match["matches"]:
            if match["match_type"] == "they_have_what_i_want":
                their_item = match["their_offer"]
                my_item = match["my_want"]

                ai_reason = (
                    f"Excellent match! {other_user.username} offers {their_item.title} "
                    f"({their_item.condition}) which matches what you're looking for. "
                    f"Value match: {int(match['value_score']*100)}%, "
                    f"Distance: {user_match['distance_miles']:.1f} miles, "
                    f"Category match: {int(match['category_score']*100)}%"
                )

                match_items.append(
                    MatchItemResponse(
                        id=match_id,
                        matched_user=MatchedUserResponse(
                            id=other_user.id,
                            username=other_user.username,
                            email=other_user.email,
                        ),
                        their_listing=ListingResponse(
                            id=their_item.id,
                            title=their_item.title,
                            category=their_item.category,
                            price=their_item.price,
                        ),
                        your_listing=ListingResponse(
                            id=my_item.id,
                            title=my_item.title.replace("[WANTED] ", ""),
                            category=my_item.category,
                            price=my_item.price,
                        ),
                        ai_score=round(match["score"], 2),
                        ai_reason=ai_reason,
                    )
                )
                match_id += 1

            elif match["match_type"] == "i_have_what_they_want":
                my_item = match["my_offer"]
                their_item = match["their_want"]

                ai_reason = (
                    f"Perfect opportunity! {other_user.username} is looking for {their_item.title.replace('[WANTED] ', '')} "
                    f"and you have {my_item.title} ({my_item.condition}). "
                    f"Value match: {int(match['value_score']*100)}%, "
                    f"Distance: {user_match['distance_miles']:.1f} miles, "
                    f"Category match: {int(match['category_score']*100)}%"
                )

                match_items.append(
                    MatchItemResponse(
                        id=match_id,
                        matched_user=MatchedUserResponse(
                            id=other_user.id,
                            username=other_user.username,
                            email=other_user.email,
                        ),
                        their_listing=ListingResponse(
                            id=their_item.id,
                            title=their_item.title.replace("[WANTED] ", ""),
                            category=their_item.category,
                            price=their_item.price,
                        ),
                        your_listing=ListingResponse(
                            id=my_item.id,
                            title=my_item.title,
                            category=my_item.category,
                            price=my_item.price,
                        ),
                        ai_score=round(match["score"], 2),
                        ai_reason=ai_reason,
                    )
                )
                match_id += 1

    # Implement pagination
    total_matches = len(match_items)
    total_pages = (total_matches + limit - 1) // limit
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    paginated_matches = match_items[start_idx:end_idx]

    return MatchesPageResponse(
        matches=paginated_matches,
        page=page,
        total_pages=total_pages,
        total=total_matches,
    )


@app.post("/matches/{match_id}/accept")
def accept_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a match and start negotiation"""
    # First, we need to get the match details to create the initial message
    # Since matches are generated dynamically, we'll need to recreate the
    # match data

    # Get all matches for current user
    matches_response = get_matches(page=1, limit=100, current_user=current_user, db=db)

    # Find the specific match by ID
    match_data = None
    for match in matches_response.matches:
        if match.id == match_id:
            match_data = match
            break

    if not match_data:
        raise HTTPException(status_code=404, detail="Match not found")

    # Create the initial message
    initial_message = (
        f"Hi {match_data.matched_user.username}! I'm interested in trading my "
        f'"{match_data.your_listing.title}" for your "{match_data.their_listing.title}". '
        f"Would you like to discuss the details?"
    )

    # Record the accepted match to prevent it from appearing again
    accepted_match = AcceptedMatch(
        requester_id=current_user.id,
        target_user_id=match_data.matched_user.id,
        requester_item_id=match_data.your_listing.id,
        target_item_id=match_data.their_listing.id,
        match_type="accepted",  # This indicates the match was accepted
        status="pending",  # Waiting for response from the other user
    )
    db.add(accepted_match)

    # Create the message in the database
    db_message = Message(
        sender_id=current_user.id,
        receiver_id=match_data.matched_user.id,
        item_id=match_data.their_listing.id,
        content=initial_message,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    db.refresh(accepted_match)

    return {
        "id": match_id,
        "status": "accepted",
        "message": "Match accepted! Initial message sent.",
        "conversation": {
            "message_id": db_message.id,
            "receiver_id": match_data.matched_user.id,
            "initial_message": initial_message,
        },
    }


# Add some test data on startup
@app.on_event("startup")
async def startup_event():
    # Mount static files during startup with proper error handling
    logger.info("Starting application startup...")

    # Ensure all required directories exist
    ensure_directories_exist()

    # Mount frontend static files if they exist
    frontend_build_path = Path("trading-app-frontend/build")
    if frontend_build_path.exists():
        try:
            static_path = frontend_build_path / "static"
            if static_path.exists():
                app.mount(
                    "/frontend-static",
                    StaticFiles(directory=str(static_path)),
                    name="frontend-static",
                )
                logger.info("Successfully mounted /frontend-static")
        except Exception as e:
            logger.error(f"Failed to mount frontend static files: {e}")
    else:
        # Mount basic static directory if frontend doesn't exist
        try:
            static_dir = Path("static")
            if not static_dir.exists():
                static_dir.mkdir(exist_ok=True)
                logger.info("Created static directory")
            app.mount("/static", StaticFiles(directory="static"), name="static")
            logger.info("Successfully mounted /static")
        except Exception as e:
            logger.error(f"Failed to mount /static: {e}")

    db = SessionLocal()
    try:
        # Check if we have any users
        user_count = db.query(User).count()
        if user_count == 0:
            # Create test users within 50 miles of Columbia, MD (21042:
            # 39.2904, -76.8734)
            # Generate secure random passwords for test users
            import secrets
            import string

            def generate_secure_password():
                """Generate a secure random password"""
                alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
                password = "".join(secrets.choice(alphabet) for _ in range(12))
                return password

            test_users = [
                {
                    "username": "zrottmann",
                    "email": "zrottmann@gmail.com",
                    "password": os.getenv("ADMIN_PASSWORD", generate_secure_password()),
                    "latitude": 39.2904,
                    "longitude": -76.8734,
                },  # Columbia, MD (0 miles)
                {
                    "username": "alice",
                    "email": "alice@test.com",
                    "password": generate_secure_password(),
                    "latitude": 39.2833,
                    "longitude": -76.6122,
                },  # Baltimore Inner Harbor (15 miles)
                {
                    "username": "bob",
                    "email": "bob@test.com",
                    "password": generate_secure_password(),
                    "latitude": 39.0458,
                    "longitude": -77.1625,
                },  # Rockville, MD (25 miles)
                {
                    "username": "charlie",
                    "email": "charlie@test.com",
                    "password": generate_secure_password(),
                    "latitude": 39.1434,
                    "longitude": -77.2014,
                },  # Germantown, MD (20 miles)
                {
                    "username": "david",
                    "email": "david@test.com",
                    "password": generate_secure_password(),
                    "latitude": 38.9072,
                    "longitude": -77.0369,
                },  # Washington DC (35 miles)
                {
                    "username": "emma",
                    "email": "emma@test.com",
                    "password": generate_secure_password(),
                    "latitude": 39.5696,
                    "longitude": -76.3558,
                },  # Bel Air, MD (30 miles)
                {
                    "username": "frank",
                    "email": "frank@test.com",
                    "password": generate_secure_password(),
                    "latitude": 39.4143,
                    "longitude": -76.7886,
                },  # Ellicott City, MD (8 miles)
                {
                    "username": "grace",
                    "email": "grace@test.com",
                    "password": generate_secure_password(),
                    "latitude": 38.9784,
                    "longitude": -76.4922,
                },  # Annapolis, MD (22 miles)
            ]

            for user_data in test_users:
                user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    latitude=user_data["latitude"],
                    longitude=user_data["longitude"],
                )
                db.add(user)

            db.commit()

            # Create test items and services
            users = db.query(User).all()
            test_items = [
                # Electronics - Various price ranges
                {
                    "title": "iPhone 13 Pro",
                    "description": "128GB, excellent condition, includes case",
                    "price": 700,
                    "category": "Electronics",
                    "listing_type": "sale",
                    "condition": "like_new",
                    "owner": users[0],
                },
                {
                    "title": "MacBook Air M1",
                    "description": "2020 model, 256GB SSD, 8GB RAM",
                    "price": 800,
                    "category": "Electronics",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[1],
                },
                {
                    "title": "PS5 Console",
                    "description": "Disc version with 2 controllers and 5 games",
                    "price": 550,
                    "category": "Electronics",
                    "listing_type": "sale",
                    "condition": "like_new",
                    "owner": users[2],
                },
                {
                    "title": 'iPad Pro 11"',
                    "description": "2021 model with Apple Pencil",
                    "price": 600,
                    "category": "Electronics",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[3],
                },
                {
                    "title": "Gaming PC",
                    "description": "RTX 3060, Ryzen 5, 16GB RAM",
                    "price": 900,
                    "category": "Electronics",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[4],
                },
                # Furniture - Medium price range
                {
                    "title": "IKEA Sectional Sofa",
                    "description": "Gray fabric, seats 5, excellent condition",
                    "price": 400,
                    "category": "Furniture",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[1],
                },
                {
                    "title": "Standing Desk",
                    "description": 'Electric adjustable height, 60" wide',
                    "price": 350,
                    "category": "Furniture",
                    "listing_type": "sale",
                    "condition": "like_new",
                    "owner": users[2],
                },
                {
                    "title": "Queen Bed Frame",
                    "description": "Solid wood with headboard",
                    "price": 250,
                    "category": "Furniture",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[5],
                },
                # Services - Hourly and fixed rates
                {
                    "title": "House Cleaning",
                    "description": "Professional cleaning service, 3-4 hours",
                    "price": 40,
                    "category": "Services",
                    "listing_type": "service",
                    "service_type": "hourly",
                    "hourly_rate": 40,
                    "owner": users[3],
                },
                {
                    "title": "Moving Help",
                    "description": "2 people with truck for local moves",
                    "price": 60,
                    "category": "Services",
                    "listing_type": "service",
                    "service_type": "hourly",
                    "hourly_rate": 60,
                    "owner": users[4],
                },
                {
                    "title": "Web Development",
                    "description": "Custom website creation, React/Node.js",
                    "price": 75,
                    "category": "Services",
                    "listing_type": "service",
                    "service_type": "hourly",
                    "hourly_rate": 75,
                    "owner": users[0],
                },
                {
                    "title": "Tutoring - Math",
                    "description": "High school and college level math",
                    "price": 50,
                    "category": "Services",
                    "listing_type": "service",
                    "service_type": "hourly",
                    "hourly_rate": 50,
                    "owner": users[6],
                },
                {
                    "title": "Handyman Services",
                    "description": "General repairs and installations",
                    "price": 45,
                    "category": "Services",
                    "listing_type": "service",
                    "service_type": "hourly",
                    "hourly_rate": 45,
                    "owner": users[7],
                },
                # Vehicles - High price range
                {
                    "title": "2018 Honda Civic",
                    "description": "45k miles, one owner, clean title",
                    "price": 18000,
                    "category": "Vehicles",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[5],
                },
                {
                    "title": "Electric Scooter",
                    "description": "Xiaomi Pro 2, 20mph max speed",
                    "price": 400,
                    "category": "Vehicles",
                    "listing_type": "sale",
                    "condition": "like_new",
                    "owner": users[6],
                },
                # Sporting Goods
                {
                    "title": "Mountain Bike",
                    "description": "Trek 21-speed, recently serviced",
                    "price": 350,
                    "category": "Sports",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[7],
                },
                {
                    "title": "Kayak with Paddle",
                    "description": "Single person, includes life jacket",
                    "price": 300,
                    "category": "Sports",
                    "listing_type": "sale",
                    "condition": "good",
                    "owner": users[1],
                },
                # Wanted items (for matching)
                {
                    "title": "[WANTED] Gaming Laptop",
                    "description": "Looking for gaming laptop under $1000",
                    "price": 800,
                    "category": "Electronics",
                    "listing_type": "wanted",
                    "owner": users[2],
                },
                {
                    "title": "[WANTED] Office Chair",
                    "description": "Need ergonomic office chair",
                    "price": 200,
                    "category": "Furniture",
                    "listing_type": "wanted",
                    "owner": users[3],
                },
                {
                    "title": "[WANTED] Moving Help",
                    "description": "Need help moving 2BR apartment",
                    "price": 300,
                    "category": "Services",
                    "listing_type": "wanted",
                    "owner": users[5],
                },
            ]

            for item_data in test_items:
                h3_index = h3.latlng_to_cell(item_data["owner"].latitude, item_data["owner"].longitude, 9)
                item = Item(
                    title=item_data["title"],
                    description=item_data["description"],
                    price=item_data["price"],
                    category=item_data["category"],
                    listing_type=item_data.get("listing_type", "sale"),
                    condition=item_data.get("condition", "good"),
                    service_type=item_data.get("service_type"),
                    hourly_rate=item_data.get("hourly_rate"),
                    latitude=item_data["owner"].latitude,
                    longitude=item_data["owner"].longitude,
                    h3_index=h3_index,
                    owner_id=item_data["owner"].id,
                )
                db.add(item)

            db.commit()
            print("Test data created successfully!")
    finally:
        db.close()

    # Note: Static file mounting has been moved to the startup event for better error handling
    # Root and favicon routes removed to avoid conflicts - defined at end of
    # file

    @app.get("/manifest.json")
    @app.get("/robots.txt")
    @app.get("/asset-manifest.json")
    async def serve_build_files(request: Request):
        filename = request.url.path.lstrip("/")
        file_path = frontend_build_path / filename
        if file_path.exists():
            return FileResponse(file_path)
        raise HTTPException(status_code=404, detail="File not found")


# =====================
# REVIEWS ENDPOINTS
# =====================


@app.post("/reviews", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new anonymous review for a user"""
    try:
        # Validate that reviewed user exists
        reviewed_user = db.query(User).filter(User.id == review_data.reviewed_user_id).first()
        if not reviewed_user:
            raise HTTPException(status_code=404, detail="User to review not found")

        # Can't review yourself
        if current_user.id == review_data.reviewed_user_id:
            raise HTTPException(status_code=400, detail="You cannot review yourself")

        # Validate rating is between 1-5
        if review_data.rating < 1 or review_data.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

        # Validate item exists if provided
        if review_data.item_id:
            item = db.query(Item).filter(Item.id == review_data.item_id).first()
            if not item:
                raise HTTPException(status_code=404, detail="Item not found")

        # Create the review
        new_review = Review(
            reviewer_id=current_user.id,
            reviewed_user_id=review_data.reviewed_user_id,
            item_id=review_data.item_id,
            rating=review_data.rating,
            comment=review_data.comment,
            transaction_type=review_data.transaction_type,
            is_anonymous=True,  # Always anonymous
        )

        db.add(new_review)
        db.commit()
        db.refresh(new_review)

        # Generate anonymous name based on reviewer ID
        anonymous_name = f"Anonymous User #{new_review.reviewer_id % 1000:03d}"

        return ReviewResponse(
            id=new_review.id,
            reviewed_user_id=new_review.reviewed_user_id,
            item_id=new_review.item_id,
            rating=new_review.rating,
            comment=new_review.comment,
            transaction_type=new_review.transaction_type,
            created_at=new_review.created_at,
            reviewer_name=anonymous_name,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating review: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/users/{user_id}/reviews", response_model=List[ReviewResponse])
def get_user_reviews(user_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Get all reviews for a specific user (anonymous)"""
    try:
        # Validate user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get reviews for this user
        reviews = (
            db.query(Review)
            .filter(Review.reviewed_user_id == user_id)
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        # Convert to response format with anonymous names
        review_responses = []
        for review in reviews:
            anonymous_name = f"Anonymous User #{review.reviewer_id % 1000:03d}"
            review_responses.append(
                ReviewResponse(
                    id=review.id,
                    reviewed_user_id=review.reviewed_user_id,
                    item_id=review.item_id,
                    rating=review.rating,
                    comment=review.comment,
                    transaction_type=review.transaction_type,
                    created_at=review.created_at,
                    reviewer_name=anonymous_name,
                )
            )

        return review_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user reviews: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/users/{user_id}/review-stats")
def get_user_review_stats(user_id: int, db: Session = Depends(get_db)):
    """Get review statistics for a user"""
    try:
        # Validate user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Calculate stats
        reviews = db.query(Review).filter(Review.reviewed_user_id == user_id).all()

        if not reviews:
            return {
                "total_reviews": 0,
                "average_rating": 0.0,
                "positive_percentage": 0,
                "reputation_score": 0.0,
                "rating_breakdown": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                "recent_reviews": [],
            }

        total_reviews = len(reviews)
        average_rating = sum(r.rating for r in reviews) / total_reviews

        # Calculate positive percentage (4-5 stars considered positive)
        positive_reviews = len([r for r in reviews if r.rating >= 4])
        positive_percentage = round((positive_reviews / total_reviews) * 100) if total_reviews > 0 else 0

        # Calculate reputation score (weighted for AI matching)
        # Formula: (average_rating / 5.0) * 100, with bonus for volume
        base_score = (average_rating / 5.0) * 100
        # Max 20 point bonus for high volume
        volume_bonus = min(total_reviews * 2, 20)
        reputation_score = min(base_score + volume_bonus, 100)  # Cap at 100

        # Rating breakdown
        rating_breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating_breakdown[review.rating] += 1

        # Recent reviews (last 3)
        recent_reviews = sorted(reviews, key=lambda x: x.created_at, reverse=True)[:3]
        recent_review_data = []
        for review in recent_reviews:
            anonymous_name = f"Anonymous User #{review.reviewer_id % 1000:03d}"
            recent_review_data.append(
                {
                    "rating": review.rating,
                    "comment": (review.comment[:100] + "..." if len(review.comment) > 100 else review.comment),
                    "reviewer_name": anonymous_name,
                    "created_at": review.created_at,
                }
            )

        return {
            "total_reviews": total_reviews,
            "average_rating": round(average_rating, 1),
            "positive_percentage": positive_percentage,
            "reputation_score": round(reputation_score, 1),
            "rating_breakdown": rating_breakdown,
            "recent_reviews": recent_review_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user review stats: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/reviews/{review_id}", response_model=ReviewResponse)
def get_review_detail(review_id: int, db: Session = Depends(get_db)):
    """Get detailed information for a specific review"""
    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Generate anonymous name
        anonymous_name = f"Anonymous User #{review.reviewer_id % 1000:03d}"

        return ReviewResponse(
            id=review.id,
            reviewed_user_id=review.reviewed_user_id,
            item_id=review.item_id,
            rating=review.rating,
            comment=review.comment,
            transaction_type=review.transaction_type,
            created_at=review.created_at,
            reviewer_name=anonymous_name,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching review detail: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


# =====================
# MEMBERSHIP ENDPOINTS
# =====================


@app.post("/memberships/subscribe")
def disabled_fake_membership_endpoint():
    """
    🚨 SECURITY: This endpoint has been permanently disabled due to critical vulnerability.

    ISSUE: This endpoint was allowing users to get verified badges without payment processing.
    IMPACT: Users were receiving premium features for free, undermining business model.

    SOLUTION: Use the new secure payment system with proper Stripe integration.
    NEW ENDPOINT: /api/payments/create-subscription (requires actual payment)

    This endpoint now returns 410 Gone to prevent any fake membership creation.
    """
    logger.warning("⚠️ SECURITY ALERT: Blocked attempt to use disabled fake membership endpoint")
    raise HTTPException(
        status_code=410,
        detail={
            "error": "ENDPOINT_DISABLED_FOR_SECURITY",
            "message": "This endpoint has been permanently disabled for security reasons.",
            "reason": "Was allowing free premium memberships without payment processing",
            "action_required": "Use the new secure payment system at /api/payments/create-subscription",
            "security_notice": "All membership activations now require verified payment processing",
        },
    )


@app.get("/memberships/my-membership", response_model=Optional[MembershipResponse])
def get_current_user_membership(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's membership status"""
    try:
        membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()

        # Check if membership has expired
        if membership and membership.is_active and membership.end_date:
            if datetime.utcnow() > membership.end_date:
                membership.is_active = False
                db.commit()
                logger.info(f"Membership expired for user {current_user.id}")

        return membership

    except Exception as e:
        logger.error(f"Error getting user membership: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/memberships/cancel")
def cancel_membership(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Cancel current membership"""
    try:
        membership = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.is_active).first()

        if not membership:
            raise HTTPException(status_code=404, detail="No active membership found")

        # Deactivate membership
        membership.is_active = False
        membership.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"Cancelled membership for user {current_user.id}")
        return {"message": "Membership cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling membership: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/users/{user_id}/membership-status")
def get_user_membership_status(user_id: int, db: Session = Depends(get_db)):
    """Get public membership status for any user (for displaying verified badges)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        membership = db.query(Membership).filter(Membership.user_id == user_id, Membership.is_active).first()

        # Check if membership has expired
        is_verified = False
        if membership and membership.end_date:
            is_verified = datetime.utcnow() <= membership.end_date
        elif membership:
            is_verified = True

        return {
            "user_id": user_id,
            "is_verified_human": is_verified,
            "membership_type": membership.membership_type if membership else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user membership status: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


# GEOCODING PROXY ENDPOINTS (to avoid CORS and rate limiting issues)
@app.get("/api/geocode")
async def geocode_address_proxy(q: str, limit: Optional[int] = 1, countrycodes: Optional[str] = "us"):
    """
    Proxy endpoint for OpenStreetMap forward geocoding (address/zipcode to coordinates)
    This avoids CORS issues and implements proper rate limiting
    """
    try:
        if not q or len(q.strip()) == 0:
            raise HTTPException(status_code=400, detail="Query parameter 'q' is required")

        logger.info(f"Geocoding proxy request for: {q}")

        # Use our rate-limited geocoding service
        result = await geocoding_service.geocode_address(q.strip())

        if result["success"]:
            # Transform the data to match what the frontend expects
            osm_data = result["data"]

            # If we got results, return them in the expected format
            if osm_data and len(osm_data) > 0:
                return {
                    "success": True,
                    "results": osm_data[:limit] if limit else osm_data,
                    "cached": False,  # We could add cache hit detection if needed
                    "type": "forward",
                }
            else:
                return {
                    "success": True,
                    "results": [],
                    "message": "No results found for query",
                    "type": "forward",
                }
        else:
            # Return error but don't expose internal details to client
            503 if "timeout" in result.get("error", "").lower() else 500
            return {
                "success": False,
                "error": "Geocoding service temporarily unavailable",
                "type": "forward",
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in geocoding proxy: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/reverse-geocode")
async def reverse_geocode_proxy(lat: float, lon: float, zoom: Optional[int] = 10):
    """
    Proxy endpoint for OpenStreetMap reverse geocoding (coordinates to address)
    This avoids CORS issues and implements proper rate limiting
    """
    try:
        # Validate coordinates
        if not (-90 <= lat <= 90):
            raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
        if not (-180 <= lon <= 180):
            raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
        if not (1 <= zoom <= 18):
            zoom = 10  # Default to reasonable zoom level

        logger.info(f"Reverse geocoding proxy request for: {lat},{lon}")

        # Use our rate-limited geocoding service
        result = await geocoding_service.reverse_geocode(lat, lon, zoom)

        if result["success"]:
            # Transform the data to match what the frontend expects
            osm_data = result["data"]

            return {
                "success": True,
                "result": osm_data,
                "cached": False,  # We could add cache hit detection if needed
                "type": "reverse",
            }
        else:
            # Return error but don't expose internal details to client
            503 if "timeout" in result.get("error", "").lower() else 500
            return {
                "success": False,
                "error": "Reverse geocoding service temporarily unavailable",
                "type": "reverse",
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reverse geocoding proxy: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/geocode/zipcode/{zipcode}")
async def geocode_zipcode_proxy(zipcode: str):
    """
    Specialized endpoint for zip code geocoding with better formatting and validation
    """
    try:
        # Basic zip code validation
        import re

        cleaned_zip = re.sub(r"[^0-9-]", "", zipcode)

        if not re.match(r"^\d{5}(-\d{4})?$", cleaned_zip):
            raise HTTPException(status_code=400, detail="Invalid US zip code format")

        # Use the base zip code for geocoding (remove +4 extension for better
        # results)
        base_zip = cleaned_zip[:5]
        query = f"{base_zip}, USA"

        logger.info(f"Zip code geocoding request for: {zipcode} -> {query}")

        # Use our rate-limited geocoding service
        result = await geocoding_service.geocode_address(query)

        if result["success"]:
            osm_data = result["data"]

            if osm_data and len(osm_data) > 0:
                location = osm_data[0]
                return {
                    "success": True,
                    "zipcode": zipcode,
                    "coordinates": {
                        "lat": float(location["lat"]),
                        "lon": float(location["lon"]),
                    },
                    "address": location.get("display_name", ""),
                    "type": "zipcode",
                }
            else:
                return {
                    "success": False,
                    "error": f"No coordinates found for zip code {zipcode}",
                    "fallback": {
                        "lat": 40.7128,  # NYC coordinates as fallback
                        "lon": -74.0060,
                    },
                    "type": "zipcode",
                }
        else:
            # Return fallback coordinates
            return {
                "success": False,
                "error": "Geocoding service temporarily unavailable",
                "fallback": {
                    "lat": 40.7128,  # NYC coordinates as fallback
                    "lon": -74.0060,
                },
                "type": "zipcode",
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in zip code geocoding: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/invitations")
def get_invitations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get room invitations for the current user"""
    try:
        # For now, return an empty list as the invitation system isn't fully implemented
        # This prevents the 404 error while maintaining API compatibility
        return []
    except Exception as e:
        logger.error(f"Error getting invitations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/notifications")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get notifications for the current user"""
    try:
        # For now, return an empty list as the notification system isn't fully implemented
        # This prevents the 404 error while maintaining API compatibility
        return []
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/rooms")
def get_rooms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get rooms for the current user"""
    try:
        # For now, return an empty list as the room system isn't fully implemented
        # This prevents the 404 error while maintaining API compatibility
        return []
    except Exception as e:
        logger.error(f"Error getting rooms: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/")
async def read_root():
    """Serve React app homepage"""
    # Check if frontend build exists, otherwise serve API info
    if frontend_build_path.exists():
        return FileResponse(frontend_build_path / "index.html")
    else:
        # Fallback to API info if no frontend build
        return {
            "message": "Welcome to Trading Post API",
            "version": "1.0.0",
            "status": "active",
            "documentation": "/docs",
        }


@app.get("/favicon.ico")
def favicon():
    """Favicon endpoint - serve static file with better error handling"""
    try:
        from pathlib import Path

        # Try multiple favicon locations
        favicon_paths = [
            Path("static/favicon.ico"),
            Path("trading-app-frontend/public/favicon.ico"),
            Path("frontend/favicon.ico"),
        ]

        for favicon_path in favicon_paths:
            if favicon_path.exists() and favicon_path.is_file():
                logger.info(f"Serving favicon from: {favicon_path}")
                return FileResponse(favicon_path, media_type="image/x-icon")

        # Fallback to base64 encoded 1x1 transparent PNG
        logger.warning("No favicon.ico found, serving fallback")
        import base64

        png_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA60e6kgAAAABJRU5ErkJggg=="
        )
        return Response(content=png_bytes, media_type="image/png")

    except Exception as e:
        logger.error(f"Error serving favicon: {e}")
        return Response(status_code=404)


# Temporary payment endpoints until Stripe is fully configured
@app.post("/payments/create-payment-intent")
async def create_payment_intent():
    """
    Temporary mock payment intent endpoint.
    Returns a mock client_secret for development purposes.
    """
    logger.info("🚧 Mock payment intent created (development only)")
    return {
        "client_secret": "pi_test_1234567890_secret_mock_development_only",
        "publishable_key": "pk_test_mock_development_only",
        "status": "requires_payment_method",
        "amount": 500,  # $5.00 in cents
        "currency": "usd",
        "description": "Trading Post Verified Membership - Development Mode",
    }


@app.post("/payments/confirm-payment")
async def confirm_payment():
    """
    Temporary mock payment confirmation endpoint.
    Always returns success for development purposes.
    """
    logger.info("🚧 Mock payment confirmed (development only)")
    return {
        "status": "succeeded",
        "payment_intent_id": "pi_test_mock_development",
        "message": "Payment confirmed successfully (development mode)",
    }


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
# Initialize and include Google OAuth router before catch-all routes
from google_oauth_router import init_oauth_router

init_oauth_router(get_db, User, SECRET_KEY, ALGORITHM, create_access_token)
app.include_router(google_oauth_router)

# Include Appwrite SSO router
app.include_router(sso_router)

# ========== BATCH PROCESSING SYSTEM INTEGRATION ==========

# Import batch processing system
try:
    from batch_processor import init_batch_processor
    from batch_router import router as batch_router, init_batch_router
    
    # Initialize batch processor with database session factory
    batch_processor_instance = init_batch_processor(
        db_session_factory=lambda: next(get_db()),
        max_workers=4
    )
    
    # Initialize batch router with dependencies
    init_batch_router(get_current_user, get_db, batch_processor_instance)
    
    # Include batch processing router
    app.include_router(batch_router)
    
    logger.info("✅ Batch processing system initialized successfully")
    
except ImportError as e:
    logger.warning(f"⚠️ Batch processing system not available: {e}")
except Exception as e:
    logger.error(f"❌ Failed to initialize batch processing system: {e}")

# ========== TWO-FACTOR AUTHENTICATION INTEGRATION ==========

# Import 2FA system
try:
    from two_factor_auth import init_2fa_system
    from two_factor_router import router as two_factor_router, init_2fa_router
    
    # Initialize 2FA system with database session factory
    two_factor_auth_instance = init_2fa_system(
        db_session_factory=lambda: next(get_db())
    )
    
    # Initialize 2FA router with dependencies
    init_2fa_router(get_current_user, get_db, two_factor_auth_instance)
    
    # Include 2FA router
    app.include_router(two_factor_router)
    
    logger.info("✅ Two-Factor Authentication system initialized successfully")
    
except ImportError as e:
    logger.warning(f"⚠️ 2FA system not available: {e}")
except Exception as e:
    logger.error(f"❌ Failed to initialize 2FA system: {e}")

# ========== ENHANCED SECURITY ENDPOINTS ==========

if ENHANCED_SECURITY_ENABLED:
    
    @app.post("/api/auth/enhanced-login")
    async def enhanced_login(
        request: Request,
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
    ):
        """Enhanced login with session security"""
        try:
            logger.info(f"Enhanced login attempt for username: {form_data.username}")
            
            # Authenticate user (same as regular login)
            db_user = db.query(User).filter(User.username == form_data.username).first()
            if not db_user or not pwd_context.verify(form_data.password, db_user.password_hash):
                logger.warning(f"Failed login attempt for username: {form_data.username}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password"
                )
            
            # Create enhanced session
            auth_result = await auth_manager.authenticate_user_with_session(db_user, request)
            
            logger.info(f"✅ Enhanced login successful for {form_data.username}")
            return auth_result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Enhanced login failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed"
            )
    
    @app.post("/api/auth/secure-logout")
    async def secure_logout(
        request: Request,
        current_user: User = Depends(require_secure_session)
    ):
        """Secure logout with session cleanup"""
        try:
            session_id = request.headers.get('X-Session-ID')
            user_id = current_user.id
            
            # Logout with session cleanup
            auth_manager.logout_user(session_id=session_id, user_id=user_id)
            
            logger.info(f"✅ Secure logout completed for user {current_user.username}")
            return {"message": "Logout successful", "session_invalidated": True}
            
        except Exception as e:
            logger.error(f"Secure logout failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Logout failed"
            )
    
    @app.get("/api/security/session-status")
    async def get_session_status(current_user: User = Depends(get_current_user_enhanced)):
        """Get current session security status"""
        try:
            security_status = auth_manager.check_session_security(current_user)
            user_security = get_user_security_status(current_user.id)
            
            return {
                "user_id": current_user.id,
                "username": current_user.username,
                "session_security": security_status,
                "overall_security": user_security,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get session status: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get session status"
            )
    
    @app.post("/api/security/invalidate-all-sessions")
    async def invalidate_all_sessions(
        current_user: User = Depends(require_secure_session),
        request: Request = None
    ):
        """Invalidate all sessions for current user (except current one)"""
        try:
            current_session_id = request.headers.get('X-Session-ID') if request else None
            
            # Keep current session but invalidate all others
            session_manager.invalidate_all_user_sessions(
                current_user.id, 
                except_session=current_session_id
            )
            
            logger.info(f"✅ All sessions invalidated for user {current_user.username}")
            return {
                "message": "All other sessions invalidated",
                "user_id": current_user.id,
                "current_session_preserved": bool(current_session_id)
            }
            
        except Exception as e:
            logger.error(f"Failed to invalidate sessions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to invalidate sessions"
            )
    
    @app.get("/api/security/active-sessions")
    async def get_active_sessions(current_user: User = Depends(require_secure_session)):
        """Get information about active sessions"""
        try:
            active_count = session_manager.get_active_sessions_count(current_user.id)
            
            # Get current session info if available
            session_info = {}
            if hasattr(current_user, 'session_data'):
                session_id = current_user.session_data.get('session_id')
                if session_id:
                    session_info = session_manager.get_session_info(session_id)
            
            return {
                "user_id": current_user.id,
                "active_sessions_count": active_count,
                "max_sessions_allowed": session_manager.config.max_concurrent_sessions,
                "current_session": session_info,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get active sessions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get session information"
            )
    
    @app.post("/api/security/test-csrf")
    async def test_csrf_protection(
        current_user: User = Depends(require_csrf_protection)
    ):
        """Test endpoint for CSRF protection (requires CSRF token)"""
        return {
            "message": "CSRF protection test successful",
            "user_id": current_user.id,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @app.get("/api/security/memory-stats")
    async def get_security_memory_stats():
        """Get memory statistics for security systems"""
        try:
            from memory_optimized_image_processing import get_memory_stats
            
            memory_stats = get_memory_stats()
            
            return {
                "memory_usage": memory_stats,
                "session_manager": {
                    "active_sessions": len(session_manager.active_sessions),
                    "security_events": len(session_manager.security_events),
                    "redis_enabled": session_manager.use_redis
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get memory stats: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get memory statistics"
            )

else:
    logger.warning("⚠️ Enhanced security endpoints disabled - enhanced security not available")

# Catch-all route for React app (must be last and outside the if block)
if frontend_build_path.exists():

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Don't serve frontend for API routes
        api_prefixes = [
            "api",
            "docs",
            "uploads",
            "health",
            "auth",  # Added for Appwrite SSO authentication routes
            "users",
            "items",
            "token",
            "register",
            "messages",
            "saved-items",
            "test-cors",
            "test-logging",
            "matches",
            "groups",
            "reviews",
            "memberships",
            "notifications",
            "invitations",
            "rooms",
            "recommendations",
            "debug",
            "options",
            "payments",
        ]

        # Check if this is an API route
        if any(full_path.startswith(prefix) for prefix in api_prefixes):
            raise HTTPException(status_code=404, detail="Not found")

        # Check if this is a specific file request
        file_path = frontend_build_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        # Serve index.html for all other routes (React routing including
        # /login)
        return FileResponse(frontend_build_path / "index.html")
