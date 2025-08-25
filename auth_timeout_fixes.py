"""
Authentication Timeout and OAuth Issue Fixes for Trading Post
Addresses token expiration, OAuth timeouts, and session management issues
"""

import os
import logging
import asyncio
import time
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
from fastapi import HTTPException, status, Request, Response, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import redis
from sqlalchemy.orm import Session
from dataclasses import dataclass
import secrets

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

@dataclass
class AuthConfig:
    """Authentication configuration with secure defaults"""
    access_token_expire_minutes: int = 60  # 1 hour (much more secure than 7 days)
    refresh_token_expire_days: int = 30  # 30 days for refresh tokens
    session_expire_minutes: int = 480  # 8 hours for sessions
    oauth_timeout_seconds: int = 30  # OAuth request timeout
    jwt_secret_min_length: int = 32
    token_refresh_threshold_minutes: int = 10  # Refresh if token expires in 10 min
    max_concurrent_sessions: int = 5
    session_cleanup_interval_hours: int = 1


class AuthenticationTimeoutManager:
    """Manages authentication timeouts and token lifecycle"""
    
    def __init__(self, config: AuthConfig = None):
        self.config = config or AuthConfig()
        self.jwt_secret = self._validate_jwt_secret()
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        
        # Redis for session management (with fallback)
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=1,  # Use different DB for auth
                decode_responses=True,
                socket_timeout=5
            )
            self.redis_client.ping()
            self.use_redis = True
            logger.info("✅ Redis connected for authentication session management")
        except Exception as e:
            logger.warning(f"Redis not available for auth sessions: {e}")
            self.use_redis = False
            self.session_store = {}  # In-memory fallback
        
        # Start background cleanup
        asyncio.create_task(self._background_cleanup())
    
    def _validate_jwt_secret(self) -> str:
        """Validate and return secure JWT secret"""
        secret = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY")
        
        if not secret:
            logger.error("❌ No JWT secret key found in environment variables!")
            raise ValueError("JWT secret key is required for authentication")
        
        if secret in ["your-secret-key-change-in-production", "changeme", "secret"]:
            logger.error("❌ SECURITY RISK: Default/weak JWT secret detected!")
            raise ValueError("Default JWT secret is not allowed for security reasons")
        
        if len(secret) < self.config.jwt_secret_min_length:
            logger.error(f"❌ SECURITY RISK: JWT secret too short ({len(secret)} chars)!")
            raise ValueError(f"JWT secret must be at least {self.config.jwt_secret_min_length} characters long")
        
        return secret
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token with secure expiration"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.config.access_token_expire_minutes)
        
        # Add security claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access",
            "jti": secrets.token_urlsafe(16)  # Unique token ID
        })
        
        return jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def create_refresh_token(self, data: dict) -> str:
        """Create refresh token with longer expiration"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.config.refresh_token_expire_days)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh",
            "jti": secrets.token_urlsafe(16)
        })
        
        return jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode JWT token with timeout handling"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            
            # Check token type
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}"
                )
            
            # Check if token is about to expire
            exp = payload.get("exp")
            if exp:
                expires_at = datetime.fromtimestamp(exp)
                time_until_expiry = (expires_at - datetime.utcnow()).total_seconds() / 60
                
                if time_until_expiry <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired"
                    )
                
                # Mark for refresh if expiring soon
                payload["needs_refresh"] = time_until_expiry <= self.config.token_refresh_threshold_minutes
            
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    def refresh_access_token(self, refresh_token: str) -> Tuple[str, str]:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = self.verify_token(refresh_token, "refresh")
            
            # Create new tokens
            user_data = {
                "sub": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name")
            }
            
            new_access_token = self.create_access_token(user_data)
            new_refresh_token = self.create_refresh_token(user_data)
            
            # Optionally blacklist old refresh token
            self._blacklist_token(payload.get("jti"))
            
            logger.info(f"Tokens refreshed for user: {payload.get('sub')}")
            return new_access_token, new_refresh_token
            
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh token"
            )
    
    def _blacklist_token(self, token_id: str):
        """Blacklist a token by its JTI"""
        if not token_id:
            return
            
        try:
            if self.use_redis:
                # Store blacklisted token for its remaining lifetime
                self.redis_client.setex(
                    f"blacklist:{token_id}",
                    self.config.refresh_token_expire_days * 24 * 3600,  # Seconds
                    "1"
                )
            else:
                # In-memory store (not persistent)
                self.session_store[f"blacklist:{token_id}"] = True
                
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
    
    def is_token_blacklisted(self, token_id: str) -> bool:
        """Check if token is blacklisted"""
        if not token_id:
            return False
            
        try:
            if self.use_redis:
                return self.redis_client.exists(f"blacklist:{token_id}")
            else:
                return f"blacklist:{token_id}" in self.session_store
        except Exception:
            return False
    
    def create_user_session(self, user_id: str, token_data: Dict) -> str:
        """Create user session with expiration"""
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "token_jti": token_data.get("jti"),
            "expires_at": (datetime.utcnow() + timedelta(minutes=self.config.session_expire_minutes)).isoformat()
        }
        
        try:
            if self.use_redis:
                self.redis_client.setex(
                    f"session:{session_id}",
                    self.config.session_expire_minutes * 60,
                    json.dumps(session_data)
                )
                
                # Track user sessions for limit enforcement
                user_sessions_key = f"user_sessions:{user_id}"
                self.redis_client.sadd(user_sessions_key, session_id)
                self.redis_client.expire(user_sessions_key, self.config.session_expire_minutes * 60)
                
                # Enforce session limit
                session_count = self.redis_client.scard(user_sessions_key)
                if session_count > self.config.max_concurrent_sessions:
                    # Remove oldest sessions
                    all_sessions = self.redis_client.smembers(user_sessions_key)
                    excess_count = session_count - self.config.max_concurrent_sessions
                    
                    for i, old_session in enumerate(all_sessions):
                        if i >= excess_count:
                            break
                        self._invalidate_session(old_session)
                        self.redis_client.srem(user_sessions_key, old_session)
            else:
                self.session_store[f"session:{session_id}"] = session_data
            
            logger.info(f"Created session {session_id} for user {user_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise
    
    def validate_session(self, session_id: str) -> Optional[Dict]:
        """Validate and update session activity"""
        try:
            if self.use_redis:
                session_data = self.redis_client.get(f"session:{session_id}")
                if not session_data:
                    return None
                
                session_data = json.loads(session_data)
            else:
                session_data = self.session_store.get(f"session:{session_id}")
                if not session_data:
                    return None
            
            # Check expiration
            expires_at = datetime.fromisoformat(session_data["expires_at"])
            if datetime.utcnow() > expires_at:
                self._invalidate_session(session_id)
                return None
            
            # Update last activity
            session_data["last_activity"] = datetime.utcnow().isoformat()
            
            if self.use_redis:
                self.redis_client.setex(
                    f"session:{session_id}",
                    self.config.session_expire_minutes * 60,
                    json.dumps(session_data)
                )
            else:
                self.session_store[f"session:{session_id}"] = session_data
            
            return session_data
            
        except Exception as e:
            logger.error(f"Session validation failed: {e}")
            return None
    
    def _invalidate_session(self, session_id: str):
        """Invalidate a session"""
        try:
            if self.use_redis:
                self.redis_client.delete(f"session:{session_id}")
            else:
                self.session_store.pop(f"session:{session_id}", None)
        except Exception as e:
            logger.error(f"Failed to invalidate session: {e}")
    
    def invalidate_all_user_sessions(self, user_id: str):
        """Invalidate all sessions for a user"""
        try:
            if self.use_redis:
                user_sessions_key = f"user_sessions:{user_id}"
                session_ids = self.redis_client.smembers(user_sessions_key)
                
                for session_id in session_ids:
                    self._invalidate_session(session_id)
                
                self.redis_client.delete(user_sessions_key)
                logger.info(f"Invalidated {len(session_ids)} sessions for user {user_id}")
            else:
                # For in-memory, we'd need to scan all sessions
                sessions_to_remove = []
                for key, session_data in self.session_store.items():
                    if key.startswith("session:") and session_data.get("user_id") == user_id:
                        sessions_to_remove.append(key)
                
                for key in sessions_to_remove:
                    del self.session_store[key]
                
                logger.info(f"Invalidated {len(sessions_to_remove)} sessions for user {user_id}")
                
        except Exception as e:
            logger.error(f"Failed to invalidate user sessions: {e}")
    
    async def _background_cleanup(self):
        """Background task to clean up expired sessions and tokens"""
        while True:
            try:
                await asyncio.sleep(self.config.session_cleanup_interval_hours * 3600)
                
                if not self.use_redis:
                    # Clean up in-memory store
                    now = datetime.utcnow()
                    expired_keys = []
                    
                    for key, data in self.session_store.items():
                        if key.startswith("session:") and isinstance(data, dict):
                            expires_at = datetime.fromisoformat(data.get("expires_at", now.isoformat()))
                            if now > expires_at:
                                expired_keys.append(key)
                    
                    for key in expired_keys:
                        del self.session_store[key]
                    
                    if expired_keys:
                        logger.info(f"Cleaned up {len(expired_keys)} expired sessions")
                
            except Exception as e:
                logger.error(f"Background cleanup failed: {e}")


class ImprovedOAuthHandler:
    """Improved OAuth handler with proper timeout and error handling"""
    
    def __init__(self, auth_manager: AuthenticationTimeoutManager):
        self.auth_manager = auth_manager
        self.oauth_timeout = auth_manager.config.oauth_timeout_seconds
    
    async def exchange_oauth_code(self, 
                                provider: str,
                                code: str, 
                                client_id: str, 
                                client_secret: str,
                                redirect_uri: str,
                                token_url: str) -> Dict[str, Any]:
        """Exchange OAuth code for tokens with timeout handling"""
        
        try:
            async with httpx.AsyncClient(timeout=self.oauth_timeout) as client:
                logger.info(f"Exchanging OAuth code for {provider}")
                
                response = await client.post(
                    token_url,
                    data={
                        "code": code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code",
                    },
                    headers={"Accept": "application/json"}
                )
                
                if response.status_code != 200:
                    logger.error(f"OAuth token exchange failed: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to authenticate with {provider}"
                    )
                
                return response.json()
                
        except asyncio.TimeoutError:
            logger.error(f"OAuth token exchange timeout for {provider}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Authentication with {provider} timed out. Please try again."
            )
        except httpx.RequestError as e:
            logger.error(f"OAuth network error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Unable to communicate with {provider}"
            )
    
    async def get_user_info(self, provider: str, access_token: str, user_info_url: str) -> Dict[str, Any]:
        """Get user info from OAuth provider with timeout handling"""
        
        try:
            async with httpx.AsyncClient(timeout=self.oauth_timeout) as client:
                response = await client.get(
                    user_info_url,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to get user info from {provider}: {response.status_code}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to get user information from {provider}"
                    )
                
                return response.json()
                
        except asyncio.TimeoutError:
            logger.error(f"User info request timeout for {provider}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Request to {provider} timed out. Please try again."
            )
        except httpx.RequestError as e:
            logger.error(f"User info network error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Unable to communicate with {provider}"
            )
    
    async def verify_google_token(self, id_token: str, client_id: str) -> Dict[str, Any]:
        """Verify Google ID token with timeout handling"""
        
        try:
            async with httpx.AsyncClient(timeout=self.oauth_timeout) as client:
                response = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google token"
                    )
                
                token_info = response.json()
                
                # Verify the token is for our app
                if token_info.get("aud") != client_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token not intended for this application"
                    )
                
                # Check expiration
                exp = token_info.get("exp")
                if exp and int(exp) < time.time():
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Google token has expired"
                    )
                
                return token_info
                
        except asyncio.TimeoutError:
            logger.error("Google token verification timeout")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google verification timed out. Please try again."
            )
        except httpx.RequestError as e:
            logger.error(f"Google token verification network error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to verify with Google"
            )


# FastAPI Dependencies
async def get_current_user_with_timeout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_manager: AuthenticationTimeoutManager = Depends(lambda: auth_timeout_manager)
):
    """Enhanced user authentication with timeout handling"""
    
    try:
        # Verify token
        payload = auth_manager.verify_token(credentials.credentials)
        
        # Check if token is blacklisted
        token_id = payload.get("jti")
        if token_id and auth_manager.is_token_blacklisted(token_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked"
            )
        
        # Add refresh recommendation if needed
        user_data = {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "needs_refresh": payload.get("needs_refresh", False)
        }
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


# Global instances
auth_config = AuthConfig()
auth_timeout_manager = AuthenticationTimeoutManager(auth_config)
oauth_handler = ImprovedOAuthHandler(auth_timeout_manager)


# API Endpoints for token management
async def refresh_token_endpoint(refresh_token: str):
    """Endpoint to refresh access token"""
    try:
        new_access_token, new_refresh_token = auth_timeout_manager.refresh_access_token(refresh_token)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": auth_config.access_token_expire_minutes * 60
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh endpoint failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


async def logout_endpoint(
    current_user=Depends(get_current_user_with_timeout),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Enhanced logout endpoint"""
    try:
        # Decode token to get JTI
        payload = auth_timeout_manager.verify_token(credentials.credentials)
        token_id = payload.get("jti")
        
        # Blacklist the token
        if token_id:
            auth_timeout_manager._blacklist_token(token_id)
        
        # Invalidate all user sessions
        user_id = current_user.get("id")
        if user_id:
            auth_timeout_manager.invalidate_all_user_sessions(user_id)
        
        logger.info(f"User {user_id} logged out successfully")
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        return {"message": "Logout completed"}  # Don't expose errors


# Export the fixes
__all__ = [
    'AuthConfig',
    'AuthenticationTimeoutManager',
    'ImprovedOAuthHandler',
    'auth_timeout_manager',
    'oauth_handler',
    'get_current_user_with_timeout',
    'refresh_token_endpoint',
    'logout_endpoint'
]