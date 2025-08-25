"""
Two-Factor Authentication API Router for Trading Post
Provides REST endpoints for 2FA setup, verification, and management
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/2fa", tags=["Two-Factor Authentication"])

# Pydantic models for request/response
class TwoFactorSetupRequest(BaseModel):
    """Request to initiate 2FA setup"""
    email: str = Field(..., description="User email for QR code generation")

class TwoFactorVerifyRequest(BaseModel):
    """Request to verify 2FA code"""
    code: str = Field(..., min_length=6, max_length=8, description="6-digit TOTP code or 8-character backup code")

class TwoFactorSetupVerifyRequest(BaseModel):
    """Request to verify 2FA setup"""
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")

class TwoFactorDisableRequest(BaseModel):
    """Request to disable 2FA"""
    code: str = Field(..., min_length=6, max_length=8, description="Current 2FA code to confirm disable")

class TwoFactorSetupResponse(BaseModel):
    """Response for 2FA setup initiation"""
    qr_code_url: str
    manual_entry_key: str
    backup_codes: List[str]
    instructions: str

class TwoFactorStatusResponse(BaseModel):
    """Response for 2FA status"""
    enabled: bool
    totp_enabled: bool
    sms_enabled: bool
    backup_codes_remaining: int
    last_used: Optional[datetime]
    setup_required: bool

class TwoFactorAttemptResponse(BaseModel):
    """Response for 2FA attempt history"""
    type: str
    success: bool
    ip_address: Optional[str]
    error_reason: Optional[str]
    created_at: datetime

# Import dependencies - these will be set when the router is initialized
get_current_user = None
get_db = None
two_factor_auth = None

def init_2fa_router(current_user_dependency, db_dependency, tfa_manager):
    """Initialize 2FA router with dependencies"""
    global get_current_user, get_db, two_factor_auth
    get_current_user = current_user_dependency
    get_db = db_dependency
    two_factor_auth = tfa_manager

# 2FA Setup Endpoints
@router.post("/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    request: TwoFactorSetupRequest,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Initiate 2FA setup for the current user
    
    Returns QR code and backup codes for TOTP setup
    """
    if not two_factor_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="2FA service not available"
        )
    
    try:
        setup_result = await two_factor_auth.setup_totp(current_user.id, request.email)
        
        return TwoFactorSetupResponse(
            qr_code_url=setup_result.qr_code_url,
            manual_entry_key=setup_result.manual_entry_key,
            backup_codes=setup_result.backup_codes,
            instructions=(
                "1. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)\n"
                "2. Enter the 6-digit code from your app to verify setup\n"
                "3. Save your backup codes in a secure location\n"
                "4. Each backup code can only be used once"
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA setup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to setup 2FA"
        )

@router.post("/verify-setup")
async def verify_2fa_setup(
    request: TwoFactorSetupVerifyRequest,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Verify 2FA setup by confirming TOTP code
    
    This enables 2FA for the user account
    """
    if not two_factor_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="2FA service not available"
        )
    
    try:
        is_valid = await two_factor_auth.verify_totp_setup(current_user.id, request.code)
        
        if is_valid:
            return {
                "success": True,
                "message": "2FA has been successfully enabled for your account",
                "enabled": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please try again."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA setup verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify 2FA setup"
        )

# 2FA Authentication Endpoints
@router.post("/verify")
async def verify_2fa_code(
    request: TwoFactorVerifyRequest,
    request_obj: Request,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Verify 2FA code for authentication
    
    Accepts both TOTP codes and backup codes
    """
    if not two_factor_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="2FA service not available"
        )
    
    try:
        # Get client IP for logging
        client_ip = request_obj.client.host if request_obj.client else None
        
        is_valid = await two_factor_auth.verify_totp_code(
            current_user.id, 
            request.code.strip().upper(),
            client_ip
        )
        
        if is_valid:
            return {
                "success": True,
                "message": "2FA verification successful",
                "verified": True
            }
        else:
            return {
                "success": False,
                "message": "Invalid 2FA code",
                "verified": False
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify 2FA code"
        )

# 2FA Management Endpoints
@router.get("/status", response_model=TwoFactorStatusResponse)
async def get_2fa_status(
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Get current 2FA status for the user
    """
    if not two_factor_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="2FA service not available"
        )
    
    try:
        status = await two_factor_auth.get_2fa_status(current_user.id)
        
        return TwoFactorStatusResponse(
            enabled=status.enabled,
            totp_enabled=status.totp_enabled,
            sms_enabled=status.sms_enabled,
            backup_codes_remaining=status.backup_codes_remaining,
            last_used=status.last_used,
            setup_required=status.setup_required
        )
        
    except Exception as e:
        logger.error(f"Failed to get 2FA status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get 2FA status"
        )

@router.post("/disable")
async def disable_2fa(
    request: TwoFactorDisableRequest,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Disable 2FA for the current user
    
    Requires valid 2FA code for confirmation
    """
    if not two_factor_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="2FA service not available"
        )
    
    try:
        success = await two_factor_auth.disable_2fa(current_user.id, request.code)
        
        if success:
            return {
                "success": True,
                "message": "2FA has been disabled for your account",
                "enabled": False
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA code. Cannot disable 2FA."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to disable 2FA: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable 2FA"
        )

@router.post("/backup-codes/regenerate")
async def regenerate_backup_codes(
    request: TwoFactorVerifyRequest,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Regenerate backup codes
    
    Requires valid 2FA code for confirmation
    """
    if not two_factor_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="2FA service not available"
        )
    
    try:
        new_codes = await two_factor_auth.regenerate_backup_codes(current_user.id, request.code)
        
        return {
            "success": True,
            "message": "New backup codes generated. Save them securely!",
            "backup_codes": new_codes,
            "instructions": (
                "These new backup codes replace your previous ones. "
                "Save them in a secure location. Each code can only be used once."
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to regenerate backup codes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to regenerate backup codes"
        )

# 2FA Security and Monitoring Endpoints
@router.get("/attempts", response_model=List[TwoFactorAttemptResponse])
async def get_2fa_attempts(
    limit: int = 10,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Get recent 2FA attempts for security monitoring
    """
    if not two_factor_auth:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="2FA service not available"
        )
    
    try:
        attempts = await two_factor_auth.get_recent_attempts(current_user.id, limit)
        
        return [
            TwoFactorAttemptResponse(
                type=attempt["type"],
                success=attempt["success"],
                ip_address=attempt.get("ip_address"),
                error_reason=attempt.get("error_reason"),
                created_at=datetime.fromisoformat(attempt["created_at"])
            )
            for attempt in attempts
        ]
        
    except Exception as e:
        logger.error(f"Failed to get 2FA attempts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get 2FA attempts"
        )

# Health check endpoint
@router.get("/health")
async def check_2fa_health():
    """
    Check if 2FA service is available and functioning
    """
    try:
        # Check if required dependencies are available
        dependencies_available = True
        missing_deps = []
        
        try:
            import pyotp
        except ImportError:
            dependencies_available = False
            missing_deps.append("pyotp")
        
        try:
            import qrcode
        except ImportError:
            dependencies_available = False
            missing_deps.append("qrcode")
        
        return {
            "status": "healthy" if dependencies_available and two_factor_auth else "unavailable",
            "service": "2fa",
            "dependencies_available": dependencies_available,
            "missing_dependencies": missing_deps,
            "manager_initialized": two_factor_auth is not None
        }
        
    except Exception as e:
        logger.error(f"2FA health check failed: {e}")
        return {
            "status": "error",
            "service": "2fa",
            "error": str(e)
        }