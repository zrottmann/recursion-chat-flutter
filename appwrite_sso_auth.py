"""
Appwrite SSO Authentication Module for Trading Post
Provides OAuth SSO integration with Google, GitHub, and other providers
"""

import os
import logging
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.exception import AppwriteException
from jose import JWTError, jwt
import json

# Import auth timeout manager for secure token settings
try:
    from auth_timeout_fixes import auth_timeout_manager
    AUTH_TIMEOUT_MANAGER_AVAILABLE = True
    logger.info("✅ Auth timeout manager integration enabled for Appwrite SSO")
except ImportError:
    AUTH_TIMEOUT_MANAGER_AVAILABLE = False
    logger.warning("⚠️ Auth timeout manager not available, using fallback settings")

# Configure logging
logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

def validate_jwt_secret():
    """Validate JWT secret key configuration for security"""
    secret = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY")
    
    if not secret:
        logger.warning("No JWT secret key found in environment variables!")
        logger.warning("Generating temporary key for development. Set SECRET_KEY for production!")
        return secrets.token_urlsafe(32)
    
    if secret == "your-secret-key-change-in-production":
        logger.error("SECURITY RISK: Default JWT secret detected!")
        logger.error("Set a secure SECRET_KEY environment variable immediately!")
        raise ValueError("Default JWT secret is not allowed for security reasons")
    
    if len(secret) < 32:
        logger.error(f"SECURITY RISK: JWT secret too short ({len(secret)} chars)!")
        logger.error("JWT secret must be at least 32 characters for security")
        raise ValueError("JWT secret must be at least 32 characters long")
    
    return secret

class AppwriteSSOAuth:
    """Appwrite SSO Authentication handler"""
    
    def __init__(self):
        self.endpoint = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
        self.project_id = os.getenv("APPWRITE_PROJECT_ID")
        self.api_key = os.getenv("APPWRITE_API_KEY")
        self.jwt_secret = validate_jwt_secret()
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        # Use secure token expiration from auth timeout manager if available
        if AUTH_TIMEOUT_MANAGER_AVAILABLE:
            self.access_token_expire_minutes = auth_timeout_manager.config.access_token_expire_minutes
            logger.info(f"✅ Using secure token expiration: {self.access_token_expire_minutes} minutes")
        else:
            # Fallback to secure default - 60 minutes instead of 24 hours
            self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
            logger.warning(f"⚠️ Using fallback token expiration: {self.access_token_expire_minutes} minutes")
        
        # Validate required Appwrite configuration
        if not self.project_id:
            raise ValueError("APPWRITE_PROJECT_ID environment variable is required")
        if not self.api_key:
            raise ValueError("APPWRITE_API_KEY environment variable is required")
        
        # Initialize Appwrite client
        self.client = Client()
        self.client.set_endpoint(self.endpoint)
        
        if self.project_id:
            self.client.set_project(self.project_id)
        
        if self.api_key:
            self.client.set_key(self.api_key)
        
        self.account = Account(self.client)
        
        # Initialize OAuth handler with timeout support if available
        if AUTH_TIMEOUT_MANAGER_AVAILABLE:
            from auth_timeout_fixes import oauth_handler
            self.oauth_handler = oauth_handler
            logger.info("✅ Enhanced OAuth timeout handling enabled")
        else:
            self.oauth_handler = None
            logger.warning("⚠️ Basic OAuth handling (no timeout protection)")
        
        logger.info(f"Appwrite SSO Auth initialized for project: {self.project_id}")
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
        return encoded_jwt
    
    async def create_oauth_session(self, provider: str, success_url: str = None, failure_url: str = None) -> Dict[str, Any]:
        """
        Create OAuth2 session for SSO
        
        Args:
            provider: OAuth provider (google, github, facebook, etc.)
            success_url: URL to redirect on successful authentication
            failure_url: URL to redirect on failed authentication
        
        Returns:
            Dictionary with redirect URL for OAuth flow
        """
        try:
            # Default URLs if not provided
            if not success_url:
                success_url = os.getenv("FRONTEND_URL", "http://localhost:3000") + "/auth/callback"
            if not failure_url:
                failure_url = os.getenv("FRONTEND_URL", "http://localhost:3000") + "/auth/error"
            
            # Create OAuth2 session
            result = self.account.create_o_auth2_session(
                provider=provider,
                success=success_url,
                failure=failure_url
            )
            
            logger.info(f"OAuth session created for provider: {provider}")
            return {"redirect_url": result}
            
        except AppwriteException as e:
            logger.error(f"Failed to create OAuth session: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create OAuth session: {str(e)}")
    
    async def get_oauth_callback(self, user_id: str, secret: str) -> Dict[str, Any]:
        """
        Handle OAuth callback and create user session
        
        Args:
            user_id: User ID from OAuth provider
            secret: Secret from OAuth provider
        
        Returns:
            User data and session token
        """
        try:
            # Create session using OAuth credentials
            session = self.account.update_session(
                session_id=user_id,
                secret=secret
            )
            
            # Get user details
            user = self.account.get()
            
            # Create JWT token for our app
            access_token = self.create_access_token(
                data={
                    "sub": user["$id"],
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "provider": "appwrite"
                }
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user["$id"],
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "emailVerification": user.get("emailVerification"),
                    "status": user.get("status")
                }
            }
            
        except AppwriteException as e:
            logger.error(f"OAuth callback failed: {e}")
            raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    
    async def create_email_session(self, email: str, password: str) -> Dict[str, Any]:
        """
        Create session with email and password
        
        Args:
            email: User email
            password: User password
        
        Returns:
            User data and session token
        """
        try:
            # Create email session
            session = self.account.create_email_session(
                email=email,
                password=password
            )
            
            # Get user details
            user = self.account.get()
            
            # Create JWT token
            access_token = self.create_access_token(
                data={
                    "sub": user["$id"],
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "provider": "email"
                }
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user["$id"],
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "emailVerification": user.get("emailVerification"),
                    "status": user.get("status")
                },
                "session_id": session["$id"]
            }
            
        except AppwriteException as e:
            logger.error(f"Email login failed: {e}")
            if e.code == 401:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")
    
    async def create_account(self, email: str, password: str, name: str = None) -> Dict[str, Any]:
        """
        Create new user account
        
        Args:
            email: User email
            password: User password
            name: User's display name
        
        Returns:
            User data
        """
        try:
            # Create account
            user = self.account.create(
                user_id="unique()",
                email=email,
                password=password,
                name=name
            )
            
            # Auto-login after registration
            session_data = await self.create_email_session(email, password)
            
            return session_data
            
        except AppwriteException as e:
            logger.error(f"Account creation failed: {e}")
            if e.code == 409:
                raise HTTPException(status_code=409, detail="Email already registered")
            raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")
    
    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """
        Get current authenticated user from JWT token
        
        Args:
            credentials: Bearer token from request header
        
        Returns:
            User data from token
        """
        token = credentials.credentials
        
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            user_id: str = payload.get("sub")
            
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid authentication token")
            
            return {
                "id": user_id,
                "email": payload.get("email"),
                "name": payload.get("name"),
                "provider": payload.get("provider")
            }
            
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    async def logout(self, session_id: str = None) -> Dict[str, str]:
        """
        Logout user and delete session
        
        Args:
            session_id: Session ID to delete (optional)
        
        Returns:
            Success message
        """
        try:
            if session_id:
                # Delete specific session
                self.account.delete_session(session_id=session_id)
            else:
                # Delete current session
                self.account.delete_session(session_id="current")
            
            return {"message": "Logged out successfully"}
            
        except AppwriteException as e:
            logger.error(f"Logout failed: {e}")
            # Return success even if session doesn't exist
            return {"message": "Logged out successfully"}
    
    async def refresh_token(self, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Refresh JWT token for authenticated user
        
        Args:
            current_user: Current user data
        
        Returns:
            New access token
        """
        access_token = self.create_access_token(
            data={
                "sub": current_user["id"],
                "email": current_user.get("email"),
                "name": current_user.get("name"),
                "provider": current_user.get("provider", "appwrite")
            }
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    async def verify_email(self, url: str, secret: str) -> Dict[str, str]:
        """
        Verify user email address
        
        Args:
            url: Verification URL
            secret: Verification secret
        
        Returns:
            Success message
        """
        try:
            self.account.update_verification(
                url=url,
                secret=secret
            )
            
            return {"message": "Email verified successfully"}
            
        except AppwriteException as e:
            logger.error(f"Email verification failed: {e}")
            raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
    
    async def send_verification_email(self, url: str) -> Dict[str, str]:
        """
        Send email verification link
        
        Args:
            url: URL to redirect after verification
        
        Returns:
            Success message
        """
        try:
            self.account.create_verification(url=url)
            
            return {"message": "Verification email sent"}
            
        except AppwriteException as e:
            logger.error(f"Failed to send verification email: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to send verification: {str(e)}")
    
    async def reset_password(self, email: str, url: str) -> Dict[str, str]:
        """
        Send password reset email
        
        Args:
            email: User email
            url: URL to redirect for password reset
        
        Returns:
            Success message
        """
        try:
            self.account.create_recovery(
                email=email,
                url=url
            )
            
            return {"message": "Password reset email sent"}
            
        except AppwriteException as e:
            logger.error(f"Failed to send password reset: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to send reset email: {str(e)}")
    
    async def confirm_password_reset(self, user_id: str, secret: str, password: str) -> Dict[str, str]:
        """
        Confirm password reset with new password
        
        Args:
            user_id: User ID
            secret: Reset secret
            password: New password
        
        Returns:
            Success message
        """
        try:
            self.account.update_recovery(
                user_id=user_id,
                secret=secret,
                password=password
            )
            
            return {"message": "Password reset successfully"}
            
        except AppwriteException as e:
            logger.error(f"Password reset confirmation failed: {e}")
            raise HTTPException(status_code=400, detail=f"Password reset failed: {str(e)}")
    
    async def list_sessions(self) -> list:
        """
        List all active sessions for current user
        
        Returns:
            List of active sessions
        """
        try:
            sessions = self.account.list_sessions()
            return sessions["sessions"]
            
        except AppwriteException as e:
            logger.error(f"Failed to list sessions: {e}")
            return []
    
    async def delete_all_sessions(self) -> Dict[str, str]:
        """
        Delete all sessions for current user (logout from all devices)
        
        Returns:
            Success message
        """
        try:
            self.account.delete_sessions()
            return {"message": "All sessions deleted successfully"}
            
        except AppwriteException as e:
            logger.error(f"Failed to delete all sessions: {e}")
            return {"message": "Sessions deleted"}

# Global instance
appwrite_sso_auth = AppwriteSSOAuth()