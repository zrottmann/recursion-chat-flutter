"""
Two-Factor Authentication (2FA) System for Trading Post
Provides TOTP-based 2FA, backup codes, and SMS authentication options
"""

import os
import secrets
import base64
import qrcode
import io
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
import logging
import pyotp
import hashlib
from dataclasses import dataclass
from fastapi import HTTPException, Depends, status
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
import json

logger = logging.getLogger(__name__)

# Configuration
APP_NAME = os.getenv("APP_NAME", "Trading Post")
ISSUER_NAME = os.getenv("2FA_ISSUER_NAME", "TradingPost")
BACKUP_CODES_COUNT = 8
CODE_LENGTH = 6

# Database Models
Base = declarative_base()

class UserTwoFactor(Base):
    """Database model for 2FA settings"""
    __tablename__ = "user_two_factor"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    
    # TOTP settings
    totp_secret = Column(String(32), nullable=True)  # Base32 encoded secret
    totp_enabled = Column(Boolean, default=False)
    totp_verified = Column(Boolean, default=False)
    
    # Backup codes
    backup_codes = Column(JSON, nullable=True)  # List of hashed backup codes
    backup_codes_used = Column(JSON, default=list)  # List of used backup code hashes
    
    # SMS settings (for future implementation)
    sms_enabled = Column(Boolean, default=False)
    phone_number = Column(String(20), nullable=True)
    phone_verified = Column(Boolean, default=False)
    
    # Security settings
    last_used_at = Column(DateTime, nullable=True)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TwoFactorAttempt(Base):
    """Log of 2FA attempts for security monitoring"""
    __tablename__ = "two_factor_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    attempt_type = Column(String(20), nullable=False)  # totp, backup_code, sms
    success = Column(Boolean, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    error_reason = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

@dataclass
class TwoFactorSetupResponse:
    """Response for 2FA setup initiation"""
    secret: str
    qr_code_url: str
    backup_codes: List[str]
    manual_entry_key: str

@dataclass
class TwoFactorStatus:
    """Current 2FA status for a user"""
    enabled: bool
    totp_enabled: bool
    sms_enabled: bool
    backup_codes_remaining: int
    last_used: Optional[datetime]
    setup_required: bool

class TwoFactorAuthManager:
    """Manages Two-Factor Authentication operations"""
    
    def __init__(self, db_session_factory):
        self.db_session_factory = db_session_factory
        
        # Import error monitoring if available
        try:
            from error_monitoring import error_monitor
            self.error_monitor = error_monitor
        except ImportError:
            self.error_monitor = None
    
    def generate_secret(self) -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    def generate_qr_code(self, secret: str, user_email: str) -> str:
        """Generate QR code for TOTP setup"""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=ISSUER_NAME
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Convert to base64 image
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    
    def generate_backup_codes(self) -> List[str]:
        """Generate backup codes for account recovery"""
        codes = []
        for _ in range(BACKUP_CODES_COUNT):
            # Generate 8-character alphanumeric code
            code = ''.join(secrets.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for _ in range(8))
            codes.append(code)
        return codes
    
    def hash_backup_code(self, code: str) -> str:
        """Hash a backup code for secure storage"""
        return hashlib.sha256(code.encode()).hexdigest()
    
    async def setup_totp(self, user_id: int, user_email: str) -> TwoFactorSetupResponse:
        """Initialize TOTP setup for a user"""
        try:
            db = self.db_session_factory()
            
            # Check if user already has 2FA setup
            existing_2fa = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id).first()
            
            if existing_2fa and existing_2fa.totp_enabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="2FA is already enabled for this user"
                )
            
            # Generate new secret and backup codes
            secret = self.generate_secret()
            backup_codes = self.generate_backup_codes()
            
            # Generate QR code
            qr_code_url = self.generate_qr_code(secret, user_email)
            
            # Store 2FA settings (not enabled until verified)
            if existing_2fa:
                existing_2fa.totp_secret = secret
                existing_2fa.backup_codes = [self.hash_backup_code(code) for code in backup_codes]
                existing_2fa.totp_verified = False
                existing_2fa.updated_at = datetime.utcnow()
            else:
                two_factor = UserTwoFactor(
                    user_id=user_id,
                    totp_secret=secret,
                    backup_codes=[self.hash_backup_code(code) for code in backup_codes],
                    totp_verified=False
                )
                db.add(two_factor)
            
            db.commit()
            db.close()
            
            logger.info(f"2FA setup initiated for user {user_id}")
            
            return TwoFactorSetupResponse(
                secret=secret,
                qr_code_url=qr_code_url,
                backup_codes=backup_codes,
                manual_entry_key=secret
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"2FA setup failed for user {user_id}: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "2fa_setup"})
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to setup 2FA"
            )
    
    async def verify_totp_setup(self, user_id: int, code: str) -> bool:
        """Verify TOTP code during setup to enable 2FA"""
        try:
            db = self.db_session_factory()
            
            two_factor = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id).first()
            
            if not two_factor or not two_factor.totp_secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No 2FA setup in progress"
                )
            
            # Verify the code
            totp = pyotp.TOTP(two_factor.totp_secret)
            is_valid = totp.verify(code, valid_window=1)  # Allow 1 time step variance
            
            if is_valid:
                # Enable 2FA
                two_factor.totp_enabled = True
                two_factor.totp_verified = True
                two_factor.last_used_at = datetime.utcnow()
                two_factor.failed_attempts = 0
                two_factor.updated_at = datetime.utcnow()
                
                db.commit()
                
                # Log successful setup
                self._log_attempt(db, user_id, "totp", True, None)
                
                logger.info(f"2FA enabled for user {user_id}")
                
                db.close()
                return True
            else:
                # Log failed attempt
                self._log_attempt(db, user_id, "totp", False, "invalid_code")
                two_factor.failed_attempts += 1
                
                # Lock account after too many failed attempts
                if two_factor.failed_attempts >= 5:
                    two_factor.locked_until = datetime.utcnow() + timedelta(minutes=15)
                
                db.commit()
                db.close()
                return False
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"2FA verification failed for user {user_id}: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "2fa_verify_setup"})
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify 2FA setup"
            )
    
    async def verify_totp_code(self, user_id: int, code: str, ip_address: str = None) -> bool:
        """Verify TOTP code for authentication"""
        try:
            db = self.db_session_factory()
            
            two_factor = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id).first()
            
            if not two_factor or not two_factor.totp_enabled:
                db.close()
                return False
            
            # Check if account is locked
            if two_factor.locked_until and datetime.utcnow() < two_factor.locked_until:
                self._log_attempt(db, user_id, "totp", False, "account_locked", ip_address)
                db.close()
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account temporarily locked due to too many failed attempts"
                )
            
            # Check if it's a backup code first
            if len(code) == 8 and code.isupper():
                return await self._verify_backup_code(user_id, code, ip_address)
            
            # Verify TOTP code
            totp = pyotp.TOTP(two_factor.totp_secret)
            is_valid = totp.verify(code, valid_window=1)
            
            if is_valid:
                # Reset failed attempts and update last used
                two_factor.failed_attempts = 0
                two_factor.locked_until = None
                two_factor.last_used_at = datetime.utcnow()
                two_factor.updated_at = datetime.utcnow()
                
                self._log_attempt(db, user_id, "totp", True, None, ip_address)
                
                db.commit()
                db.close()
                return True
            else:
                # Increment failed attempts
                two_factor.failed_attempts += 1
                
                # Lock account after too many failures
                if two_factor.failed_attempts >= 5:
                    two_factor.locked_until = datetime.utcnow() + timedelta(minutes=15)
                
                self._log_attempt(db, user_id, "totp", False, "invalid_code", ip_address)
                
                db.commit()
                db.close()
                return False
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"TOTP verification failed for user {user_id}: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "2fa_verify_totp"})
            return False
    
    async def _verify_backup_code(self, user_id: int, code: str, ip_address: str = None) -> bool:
        """Verify backup code for authentication"""
        try:
            db = self.db_session_factory()
            
            two_factor = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id).first()
            
            if not two_factor or not two_factor.backup_codes:
                db.close()
                return False
            
            code_hash = self.hash_backup_code(code)
            
            # Check if code exists and hasn't been used
            if code_hash in two_factor.backup_codes and code_hash not in two_factor.backup_codes_used:
                # Mark code as used
                used_codes = two_factor.backup_codes_used or []
                used_codes.append(code_hash)
                two_factor.backup_codes_used = used_codes
                
                # Reset failed attempts
                two_factor.failed_attempts = 0
                two_factor.locked_until = None
                two_factor.last_used_at = datetime.utcnow()
                two_factor.updated_at = datetime.utcnow()
                
                self._log_attempt(db, user_id, "backup_code", True, None, ip_address)
                
                db.commit()
                db.close()
                
                logger.info(f"Backup code used for user {user_id}")
                return True
            else:
                self._log_attempt(db, user_id, "backup_code", False, "invalid_or_used_code", ip_address)
                db.close()
                return False
                
        except Exception as e:
            logger.error(f"Backup code verification failed for user {user_id}: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "2fa_verify_backup"})
            return False
    
    async def disable_2fa(self, user_id: int, code: str) -> bool:
        """Disable 2FA after verifying current code"""
        try:
            # First verify the user can authenticate
            if not await self.verify_totp_code(user_id, code):
                return False
            
            db = self.db_session_factory()
            
            two_factor = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id).first()
            
            if two_factor:
                # Disable all 2FA methods
                two_factor.totp_enabled = False
                two_factor.totp_verified = False
                two_factor.sms_enabled = False
                two_factor.totp_secret = None
                two_factor.backup_codes = None
                two_factor.backup_codes_used = None
                two_factor.updated_at = datetime.utcnow()
                
                db.commit()
                
                logger.info(f"2FA disabled for user {user_id}")
            
            db.close()
            return True
            
        except Exception as e:
            logger.error(f"Failed to disable 2FA for user {user_id}: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "2fa_disable"})
            return False
    
    async def get_2fa_status(self, user_id: int) -> TwoFactorStatus:
        """Get current 2FA status for a user"""
        try:
            db = self.db_session_factory()
            
            two_factor = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id).first()
            
            if not two_factor:
                db.close()
                return TwoFactorStatus(
                    enabled=False,
                    totp_enabled=False,
                    sms_enabled=False,
                    backup_codes_remaining=0,
                    last_used=None,
                    setup_required=False
                )
            
            # Count remaining backup codes
            used_codes = two_factor.backup_codes_used or []
            total_codes = len(two_factor.backup_codes or [])
            remaining_codes = total_codes - len(used_codes)
            
            status = TwoFactorStatus(
                enabled=two_factor.totp_enabled or two_factor.sms_enabled,
                totp_enabled=two_factor.totp_enabled,
                sms_enabled=two_factor.sms_enabled,
                backup_codes_remaining=remaining_codes,
                last_used=two_factor.last_used_at,
                setup_required=bool(two_factor.totp_secret and not two_factor.totp_verified)
            )
            
            db.close()
            return status
            
        except Exception as e:
            logger.error(f"Failed to get 2FA status for user {user_id}: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "2fa_status"})
            
            return TwoFactorStatus(
                enabled=False,
                totp_enabled=False,
                sms_enabled=False,
                backup_codes_remaining=0,
                last_used=None,
                setup_required=False
            )
    
    async def regenerate_backup_codes(self, user_id: int, current_code: str) -> List[str]:
        """Regenerate backup codes after verifying current 2FA"""
        try:
            # First verify the user can authenticate
            if not await self.verify_totp_code(user_id, current_code):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid 2FA code"
                )
            
            db = self.db_session_factory()
            
            two_factor = db.query(UserTwoFactor).filter(UserTwoFactor.user_id == user_id).first()
            
            if not two_factor or not two_factor.totp_enabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="2FA is not enabled"
                )
            
            # Generate new backup codes
            new_codes = self.generate_backup_codes()
            two_factor.backup_codes = [self.hash_backup_code(code) for code in new_codes]
            two_factor.backup_codes_used = []  # Reset used codes
            two_factor.updated_at = datetime.utcnow()
            
            db.commit()
            db.close()
            
            logger.info(f"Backup codes regenerated for user {user_id}")
            return new_codes
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to regenerate backup codes for user {user_id}: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "2fa_regenerate_codes"})
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to regenerate backup codes"
            )
    
    def _log_attempt(self, db: Session, user_id: int, attempt_type: str, success: bool, 
                    error_reason: str = None, ip_address: str = None, user_agent: str = None):
        """Log 2FA attempt for security monitoring"""
        try:
            attempt = TwoFactorAttempt(
                user_id=user_id,
                attempt_type=attempt_type,
                success=success,
                ip_address=ip_address,
                user_agent=user_agent,
                error_reason=error_reason
            )
            db.add(attempt)
            db.commit()
            
        except Exception as e:
            logger.warning(f"Failed to log 2FA attempt: {e}")
    
    async def get_recent_attempts(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent 2FA attempts for a user"""
        try:
            db = self.db_session_factory()
            
            attempts = db.query(TwoFactorAttempt)\
                        .filter(TwoFactorAttempt.user_id == user_id)\
                        .order_by(TwoFactorAttempt.created_at.desc())\
                        .limit(limit).all()
            
            result = []
            for attempt in attempts:
                result.append({
                    "type": attempt.attempt_type,
                    "success": attempt.success,
                    "ip_address": attempt.ip_address,
                    "error_reason": attempt.error_reason,
                    "created_at": attempt.created_at.isoformat()
                })
            
            db.close()
            return result
            
        except Exception as e:
            logger.error(f"Failed to get 2FA attempts for user {user_id}: {e}")
            return []

# Global instance placeholder - will be initialized with database session factory
two_factor_auth = None

def init_2fa_system(db_session_factory):
    """Initialize the 2FA system with database session factory"""
    global two_factor_auth
    two_factor_auth = TwoFactorAuthManager(db_session_factory)
    return two_factor_auth

# Export everything
__all__ = [
    'TwoFactorAuthManager',
    'UserTwoFactor',
    'TwoFactorAttempt',
    'TwoFactorSetupResponse',
    'TwoFactorStatus',
    'two_factor_auth',
    'init_2fa_system'
]