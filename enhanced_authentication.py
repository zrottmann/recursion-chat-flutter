"""
Enhanced Authentication System with Session Security
Integrates with existing JWT system while adding session security features
"""

import os
import logging
from typing import Optional
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from session_security import session_manager, SessionSecurityManager

logger = logging.getLogger(__name__)

# Authentication configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
# SECURITY FIX: Changed from 1440 minutes (24 hours) to 60 minutes (1 hour)
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour for security

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class EnhancedAuthenticationManager:
    """Enhanced authentication with session security"""
    
    def __init__(self):
        self.session_manager = session_manager
        
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    async def authenticate_user_with_session(self, user, request: Request) -> dict:
        """Authenticate user and create secure session"""
        try:
            # Create JWT token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = self.create_access_token(
                data={"sub": user.username}, 
                expires_delta=access_token_expires
            )
            
            # Create secure session
            session_data = self.session_manager.create_secure_session(user.id, request)
            
            logger.info(f"✅ Created authenticated session for user {user.username}")
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "session_id": session_data["session_id"],
                "csrf_token": session_data["csrf_token"],
                "expires_at": session_data["expires_at"],
                "security_enabled": True
            }
            
        except Exception as e:
            logger.error(f"❌ Authentication with session creation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication failed"
            )
    
    async def validate_token_and_session(self, token: str, request: Request, db: Session):
        """Validate both JWT token and session security"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            
            if username is None:
                logger.warning("JWT token missing username")
                raise credentials_exception
            
            # Get user from database
            from app_sqlite import User  # Import here to avoid circular imports
            user = db.query(User).filter(User.username == username).first()
            
            if user is None:
                logger.warning(f"User not found: {username}")
                raise credentials_exception
            
            # Check for session ID in headers (optional for enhanced security)
            session_id = request.headers.get('X-Session-ID')
            
            if session_id:
                # Validate session security if session ID provided
                try:
                    session_data = self.session_manager.validate_session(session_id, request)
                    
                    # Ensure session belongs to the authenticated user
                    if session_data.get('user_id') != user.id:
                        logger.warning(f"Session user mismatch: {session_data.get('user_id')} != {user.id}")
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session user mismatch"
                        )
                    
                    # Add session info to user object for use in endpoints
                    user.session_data = session_data
                    user.session_secure = True
                    
                    logger.info(f"✅ Enhanced authentication successful for {username} with session {session_id}")
                    
                except HTTPException as session_error:
                    # Log session validation failure but allow JWT-only auth to continue
                    logger.warning(f"Session validation failed for {username}: {session_error.detail}")
                    user.session_secure = False
            else:
                # JWT-only authentication (legacy compatibility)
                user.session_secure = False
                logger.info(f"✅ JWT-only authentication for {username}")
            
            return user
            
        except JWTError as e:
            logger.error(f"JWT validation failed: {e}")
            raise credentials_exception
        except Exception as e:
            logger.error(f"Authentication validation failed: {e}")
            raise credentials_exception
    
    def logout_user(self, session_id: Optional[str] = None, user_id: Optional[int] = None):
        """Secure logout with session cleanup"""
        try:
            if session_id:
                self.session_manager.invalidate_session(session_id, "user_logout")
                logger.info(f"✅ User logout - session {session_id} invalidated")
            elif user_id:
                # Invalidate all sessions for user
                self.session_manager.invalidate_all_user_sessions(user_id)
                logger.info(f"✅ All sessions invalidated for user {user_id}")
                
        except Exception as e:
            logger.error(f"❌ Logout failed: {e}")
    
    def require_csrf_token(self, session_id: str, csrf_token: str) -> bool:
        """Validate CSRF token for state-changing operations"""
        return self.session_manager.validate_csrf_token(session_id, csrf_token)
    
    def check_session_security(self, user) -> dict:
        """Check session security status"""
        if hasattr(user, 'session_secure') and user.session_secure:
            session_data = getattr(user, 'session_data', {})
            return {
                "session_secure": True,
                "session_id": session_data.get('session_id'),
                "security_flags": session_data.get('security_flags', {}),
                "last_activity": session_data.get('last_activity')
            }
        else:
            return {
                "session_secure": False,
                "warning": "Using legacy JWT-only authentication"
            }


# Global authentication manager
auth_manager = EnhancedAuthenticationManager()


# Enhanced FastAPI dependencies
async def get_current_user_enhanced(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(lambda: None)  # Will be provided by the actual endpoint
):
    """Enhanced user authentication dependency with session security"""
    # This will be used to replace the existing get_current_user function
    return await auth_manager.validate_token_and_session(token, request, db)


async def require_secure_session(
    request: Request,
    current_user = Depends(get_current_user_enhanced)
):
    """Dependency that requires secure session (not just JWT)"""
    if not getattr(current_user, 'session_secure', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Secure session required for this operation"
        )
    return current_user


async def require_csrf_protection(
    request: Request,
    current_user = Depends(require_secure_session)
):
    """Dependency that requires CSRF token validation"""
    if not hasattr(current_user, 'session_data'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session data required for CSRF protection"
        )
    
    # Get CSRF token from header
    csrf_token = request.headers.get('X-CSRF-Token')
    if not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token required"
        )
    
    # Validate CSRF token
    session_id = current_user.session_data.get('session_id')
    if not auth_manager.require_csrf_token(session_id, csrf_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token"
        )
    
    return current_user


# Security monitoring functions
def get_user_security_status(user_id: int) -> dict:
    """Get comprehensive security status for user"""
    try:
        active_sessions = session_manager.get_active_sessions_count(user_id)
        
        return {
            "user_id": user_id,
            "active_sessions": active_sessions,
            "session_limit": session_manager.config.max_concurrent_sessions,
            "security_features": {
                "session_fixation_protection": session_manager.config.session_fixation_protection,
                "ip_validation": session_manager.config.ip_validation,
                "csrf_protection": session_manager.config.csrf_protection
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get security status: {e}")
        return {"error": str(e)}


def force_logout_all_sessions(user_id: int, reason: str = "admin_action"):
    """Force logout all sessions for user (admin function)"""
    try:
        session_manager.invalidate_all_user_sessions(user_id)
        logger.info(f"🔒 Admin forced logout for user {user_id}: {reason}")
        return {"success": True, "message": f"All sessions invalidated for user {user_id}"}
        
    except Exception as e:
        logger.error(f"❌ Failed to force logout: {e}")
        return {"success": False, "error": str(e)}


# Export enhanced authentication components
__all__ = [
    'EnhancedAuthenticationManager',
    'auth_manager',
    'get_current_user_enhanced',
    'require_secure_session',
    'require_csrf_protection',
    'get_user_security_status',
    'force_logout_all_sessions'
]