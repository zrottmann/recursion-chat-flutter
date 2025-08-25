"""
SSO Router for Trading Post
Provides OAuth endpoints for Google, GitHub, and other providers
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import logging
from appwrite_sso_auth import appwrite_sso_auth

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic models
class EmailLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr
    reset_url: Optional[str] = None

class PasswordResetConfirm(BaseModel):
    user_id: str
    secret: str
    password: str

class EmailVerification(BaseModel):
    url: str
    secret: str

# OAuth Endpoints
@router.get("/oauth/{provider}")
async def oauth_login(
    provider: str,
    success_url: Optional[str] = Query(None),
    failure_url: Optional[str] = Query(None)
):
    """
    Initiate OAuth login flow
    
    Supported providers: google, github, facebook, discord, apple, microsoft, amazon, spotify, slack, zoom
    """
    supported_providers = [
        "google", "github", "facebook", "discord", "apple", 
        "microsoft", "amazon", "spotify", "slack", "zoom"
    ]
    
    if provider not in supported_providers:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
    
    try:
        result = await appwrite_sso_auth.create_oauth_session(
            provider=provider,
            success_url=success_url,
            failure_url=failure_url
        )
        
        # Redirect to OAuth provider
        return RedirectResponse(url=result["redirect_url"])
        
    except Exception as e:
        logger.error(f"OAuth login failed for {provider}: {e}")
        raise HTTPException(status_code=500, detail="OAuth login failed")

@router.get("/oauth/callback")
async def oauth_callback(
    user_id: str = Query(..., alias="userId"),
    secret: str = Query(...),
    provider: Optional[str] = Query(None)
):
    """
    Handle OAuth callback from provider
    """
    try:
        result = await appwrite_sso_auth.get_oauth_callback(
            user_id=user_id,
            secret=secret
        )
        
        # Return token and user data
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"OAuth callback failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Email Authentication Endpoints
@router.post("/login")
async def email_login(credentials: EmailLogin):
    """
    Login with email and password
    """
    try:
        result = await appwrite_sso_auth.create_email_session(
            email=credentials.email,
            password=credentials.password
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email login failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/signup")
async def signup(user_data: UserSignup):
    """
    Create new user account
    """
    try:
        result = await appwrite_sso_auth.create_account(
            email=user_data.email,
            password=user_data.password,
            name=user_data.name
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup failed: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/logout")
async def logout(
    session_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(appwrite_sso_auth.get_current_user)
):
    """
    Logout current user
    """
    try:
        result = await appwrite_sso_auth.logout(session_id=session_id)
        return result
        
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        return {"message": "Logged out"}

@router.get("/me")
async def get_current_user(
    current_user: Dict[str, Any] = Depends(appwrite_sso_auth.get_current_user)
):
    """
    Get current authenticated user
    """
    return current_user

@router.post("/refresh")
async def refresh_token(
    current_user: Dict[str, Any] = Depends(appwrite_sso_auth.get_current_user)
):
    """
    Refresh authentication token
    """
    try:
        result = await appwrite_sso_auth.refresh_token(current_user)
        return result
        
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")

# Email Verification Endpoints
@router.post("/verify-email")
async def verify_email(verification: EmailVerification):
    """
    Verify email address
    """
    try:
        result = await appwrite_sso_auth.verify_email(
            url=verification.url,
            secret=verification.secret
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification failed: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")

@router.post("/send-verification")
async def send_verification_email(
    verification_url: str,
    current_user: Dict[str, Any] = Depends(appwrite_sso_auth.get_current_user)
):
    """
    Send email verification link
    """
    try:
        result = await appwrite_sso_auth.send_verification_email(url=verification_url)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send verification: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification")

# Password Reset Endpoints
@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset):
    """
    Send password reset email
    """
    try:
        reset_url = reset_data.reset_url or "http://localhost:3000/reset-password"
        result = await appwrite_sso_auth.reset_password(
            email=reset_data.email,
            url=reset_url
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email")

@router.post("/confirm-reset")
async def confirm_password_reset(reset_confirm: PasswordResetConfirm):
    """
    Confirm password reset with new password
    """
    try:
        result = await appwrite_sso_auth.confirm_password_reset(
            user_id=reset_confirm.user_id,
            secret=reset_confirm.secret,
            password=reset_confirm.password
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirmation failed: {e}")
        raise HTTPException(status_code=500, detail="Password reset failed")

# Session Management Endpoints
@router.get("/sessions")
async def list_sessions(
    current_user: Dict[str, Any] = Depends(appwrite_sso_auth.get_current_user)
):
    """
    List all active sessions for current user
    """
    try:
        sessions = await appwrite_sso_auth.list_sessions()
        return {"sessions": sessions}
        
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        return {"sessions": []}

@router.delete("/sessions")
async def delete_all_sessions(
    current_user: Dict[str, Any] = Depends(appwrite_sso_auth.get_current_user)
):
    """
    Delete all sessions (logout from all devices)
    """
    try:
        result = await appwrite_sso_auth.delete_all_sessions()
        return result
        
    except Exception as e:
        logger.error(f"Failed to delete sessions: {e}")
        return {"message": "Sessions deleted"}

# Health check endpoint
@router.get("/health")
async def auth_health_check():
    """
    Check if authentication service is healthy
    """
    return {
        "status": "healthy",
        "service": "appwrite-sso",
        "endpoint": appwrite_sso_auth.endpoint,
        "project": appwrite_sso_auth.project_id
    }