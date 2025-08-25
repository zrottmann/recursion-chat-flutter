"""
Password Reset Router - Secure password recovery functionality
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, timedelta
import secrets
import re
from typing import Optional

from database import get_db
from models import User
from auth_router import pwd_context
from email_service import send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str
    
    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[@$!%*?&]", v):
            raise ValueError("Password must contain at least one special character")
        return v

def generate_reset_token() -> str:
    """Generate a secure random reset token"""
    return secrets.token_urlsafe(32)

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request a password reset email
    Always returns success to prevent email enumeration attacks
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if user:
        # Generate reset token
        reset_token = generate_reset_token()
        reset_expiry = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
        
        # Store token in database
        user.password_reset_token = reset_token
        user.password_reset_expires = reset_expiry
        db.commit()
        
        # Send reset email in background
        background_tasks.add_task(
            send_password_reset_email,
            email=user.email,
            username=user.username,
            reset_token=reset_token
        )
    
    # Always return success to prevent email enumeration
    return {
        "message": "If an account exists with this email, a password reset link has been sent.",
        "success": True
    }

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using token from email
    """
    # Find user by reset token
    user = db.query(User).filter(
        User.password_reset_token == request.token,
        User.password_reset_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
    
    # Hash new password
    hashed_password = pwd_context.hash(request.password)
    
    # Update user password and clear reset token
    user.password = hashed_password
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    return {
        "message": "Password successfully reset. You can now login with your new password.",
        "success": True
    }

@router.get("/verify-reset-token/{token}")
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify if a reset token is valid
    """
    user = db.query(User).filter(
        User.password_reset_token == token,
        User.password_reset_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
    
    return {
        "valid": True,
        "email": user.email[:3] + "***" + user.email[-10:]  # Partially masked email
    }