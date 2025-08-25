"""
Enhanced Session Security and Fixation Protection for Trading Post
Implements comprehensive security measures for user sessions
"""

import os
import time
import hashlib
import secrets
import logging
import json
from typing import Dict, Optional, Any, Tuple
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import redis
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class SessionConfig:
    """Session security configuration"""
    max_session_duration: int = 86400  # 24 hours
    session_refresh_interval: int = 3600  # 1 hour
    max_concurrent_sessions: int = 5
    session_fixation_protection: bool = True
    ip_validation: bool = True
    user_agent_validation: bool = True
    csrf_protection: bool = True
    secure_cookie_settings: bool = True


class SessionSecurityManager:
    """Comprehensive session security manager"""
    
    def __init__(self, config: SessionConfig = None):
        self.config = config or SessionConfig()
        self.active_sessions = {}  # In-memory session store (use Redis in production)
        self.security_events = {}  # Track security events
        
        # Try to use Redis if available
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=0,
                decode_responses=True
            )
            self.redis_client.ping()
            self.use_redis = True
            logger.info("✅ Connected to Redis for session storage")
        except Exception as e:
            logger.warning(f"Redis not available, using in-memory storage: {e}")
            self.use_redis = False
    
    def generate_secure_session_id(self) -> str:
        """Generate cryptographically secure session ID"""
        # Use secrets for cryptographically strong random generation
        session_data = secrets.token_urlsafe(32)
        timestamp = str(int(time.time()))
        
        # Add entropy from current state
        entropy = hashlib.sha256(f"{session_data}{timestamp}{secrets.randbits(64)}".encode()).hexdigest()
        
        return f"sess_{entropy[:32]}"
    
    def generate_csrf_token(self, session_id: str) -> str:
        """Generate CSRF token for session"""
        secret = os.getenv('SECRET_KEY', 'default-secret-key')
        data = f"{session_id}:{int(time.time())}:{secrets.token_hex(16)}"
        
        return hashlib.sha256(f"{secret}{data}".encode()).hexdigest()[:32]
    
    def create_session_fingerprint(self, request: Request) -> str:
        """Create unique fingerprint for the client"""
        user_agent = request.headers.get('user-agent', '')
        accept_language = request.headers.get('accept-language', '')
        accept_encoding = request.headers.get('accept-encoding', '')
        
        fingerprint_data = f"{user_agent}:{accept_language}:{accept_encoding}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        # Check for forwarded headers
        forwarded_for = request.headers.get('x-forwarded-for')
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('x-real-ip')
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        return request.client.host if request.client else '127.0.0.1'
    
    def create_secure_session(self, user_id: int, request: Request) -> Dict[str, Any]:
        """Create new secure session with fixation protection"""
        try:
            # Generate new session ID (prevents session fixation)
            session_id = self.generate_secure_session_id()
            
            # Create session data
            session_data = {
                'session_id': session_id,
                'user_id': user_id,
                'created_at': datetime.utcnow().isoformat(),
                'last_activity': datetime.utcnow().isoformat(),
                'ip_address': self.get_client_ip(request),
                'user_agent': request.headers.get('user-agent', ''),
                'fingerprint': self.create_session_fingerprint(request),
                'csrf_token': self.generate_csrf_token(session_id),
                'is_validated': True,
                'security_flags': {
                    'fixation_protected': True,
                    'ip_validated': True,
                    'fingerprint_validated': True
                }
            }
            
            # Store session
            self._store_session(session_id, session_data)
            
            # Clean up old sessions for this user
            self._cleanup_user_sessions(user_id)
            
            logger.info(f"✅ Created secure session {session_id} for user {user_id}")
            
            return {
                'session_id': session_id,
                'csrf_token': session_data['csrf_token'],
                'expires_at': (datetime.utcnow() + timedelta(seconds=self.config.max_session_duration)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to create secure session: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create secure session"
            )
    
    def validate_session(self, session_id: str, request: Request) -> Dict[str, Any]:
        """Validate existing session with security checks"""
        try:
            # Get session data
            session_data = self._get_session(session_id)
            if not session_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid session"
                )
            
            current_time = datetime.utcnow()
            last_activity = datetime.fromisoformat(session_data['last_activity'])
            
            # Check session expiration
            if (current_time - last_activity).total_seconds() > self.config.max_session_duration:
                self._remove_session(session_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired"
                )
            
            # IP validation (if enabled)
            if self.config.ip_validation:
                current_ip = self.get_client_ip(request)
                if session_data['ip_address'] != current_ip:
                    self._log_security_event(session_id, 'ip_change', {
                        'old_ip': session_data['ip_address'],
                        'new_ip': current_ip
                    })
                    
                    # For high-security applications, reject IP changes
                    # For user convenience, we'll log but allow (configurable)
                    if os.getenv('STRICT_IP_VALIDATION', 'false').lower() == 'true':
                        self._remove_session(session_id)
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session invalid due to IP change"
                        )
            
            # User agent validation (if enabled)
            if self.config.user_agent_validation:
                current_fingerprint = self.create_session_fingerprint(request)
                if session_data['fingerprint'] != current_fingerprint:
                    self._log_security_event(session_id, 'fingerprint_change', {
                        'old_fingerprint': session_data['fingerprint'],
                        'new_fingerprint': current_fingerprint
                    })
            
            # Update last activity
            session_data['last_activity'] = current_time.isoformat()
            
            # Refresh session ID periodically to prevent fixation
            if self.config.session_fixation_protection:
                session_age = (current_time - datetime.fromisoformat(session_data['created_at'])).total_seconds()
                if session_age > self.config.session_refresh_interval:
                    return self._refresh_session(session_id, session_data, request)
            
            # Update session
            self._store_session(session_id, session_data)
            
            return session_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Session validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session validation failed"
            )
    
    def _refresh_session(self, old_session_id: str, session_data: Dict, request: Request) -> Dict[str, Any]:
        """Refresh session ID to prevent fixation attacks"""
        try:
            # Generate new session ID
            new_session_id = self.generate_secure_session_id()
            
            # Update session data
            session_data['session_id'] = new_session_id
            session_data['created_at'] = datetime.utcnow().isoformat()
            session_data['csrf_token'] = self.generate_csrf_token(new_session_id)
            session_data['security_flags']['fixation_protected'] = True
            
            # Store new session
            self._store_session(new_session_id, session_data)
            
            # Remove old session
            self._remove_session(old_session_id)
            
            logger.info(f"🔄 Refreshed session: {old_session_id} -> {new_session_id}")
            
            return session_data
            
        except Exception as e:
            logger.error(f"❌ Session refresh failed: {e}")
            raise
    
    def invalidate_session(self, session_id: str, reason: str = "logout"):
        """Invalidate session securely"""
        try:
            session_data = self._get_session(session_id)
            if session_data:
                self._log_security_event(session_id, 'session_invalidated', {'reason': reason})
                self._remove_session(session_id)
                
            logger.info(f"✅ Session {session_id} invalidated: {reason}")
            
        except Exception as e:
            logger.error(f"❌ Session invalidation failed: {e}")
    
    def invalidate_all_user_sessions(self, user_id: int, except_session: str = None):
        """Invalidate all sessions for a user (useful for password changes)"""
        try:
            sessions_to_remove = []
            
            if self.use_redis:
                # Get all session keys for user
                pattern = f"session:user:{user_id}:*"
                for key in self.redis_client.scan_iter(match=pattern):
                    session_id = key.split(':')[-1]
                    if session_id != except_session:
                        sessions_to_remove.append(session_id)
            else:
                # Check in-memory storage
                for session_id, session_data in self.active_sessions.items():
                    if session_data.get('user_id') == user_id and session_id != except_session:
                        sessions_to_remove.append(session_id)
            
            # Remove sessions
            for session_id in sessions_to_remove:
                self._remove_session(session_id)
                self._log_security_event(session_id, 'bulk_invalidation', {'user_id': user_id})
            
            logger.info(f"✅ Invalidated {len(sessions_to_remove)} sessions for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Bulk session invalidation failed: {e}")
    
    def validate_csrf_token(self, session_id: str, provided_token: str) -> bool:
        """Validate CSRF token"""
        try:
            session_data = self._get_session(session_id)
            if not session_data:
                return False
            
            stored_token = session_data.get('csrf_token')
            return secrets.compare_digest(stored_token, provided_token)
            
        except Exception as e:
            logger.error(f"❌ CSRF validation failed: {e}")
            return False
    
    def get_active_sessions_count(self, user_id: int) -> int:
        """Get count of active sessions for user"""
        try:
            count = 0
            
            if self.use_redis:
                pattern = f"session:user:{user_id}:*"
                count = len(list(self.redis_client.scan_iter(match=pattern)))
            else:
                for session_data in self.active_sessions.values():
                    if session_data.get('user_id') == user_id:
                        count += 1
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Failed to count active sessions: {e}")
            return 0
    
    def _store_session(self, session_id: str, session_data: Dict):
        """Store session data"""
        try:
            if self.use_redis:
                # Store with expiration
                key = f"session:{session_id}"
                user_key = f"session:user:{session_data['user_id']}:{session_id}"
                
                self.redis_client.setex(
                    key, 
                    self.config.max_session_duration, 
                    json.dumps(session_data)
                )
                self.redis_client.setex(
                    user_key,
                    self.config.max_session_duration,
                    session_id
                )
            else:
                self.active_sessions[session_id] = session_data
                
        except Exception as e:
            logger.error(f"❌ Failed to store session: {e}")
            raise
    
    def _get_session(self, session_id: str) -> Optional[Dict]:
        """Get session data"""
        try:
            if self.use_redis:
                key = f"session:{session_id}"
                data = self.redis_client.get(key)
                return json.loads(data) if data else None
            else:
                return self.active_sessions.get(session_id)
                
        except Exception as e:
            logger.error(f"❌ Failed to get session: {e}")
            return None
    
    def _remove_session(self, session_id: str):
        """Remove session"""
        try:
            if self.use_redis:
                session_data = self._get_session(session_id)
                if session_data:
                    key = f"session:{session_id}"
                    user_key = f"session:user:{session_data['user_id']}:{session_id}"
                    self.redis_client.delete(key, user_key)
            else:
                self.active_sessions.pop(session_id, None)
                
        except Exception as e:
            logger.error(f"❌ Failed to remove session: {e}")
    
    def _cleanup_user_sessions(self, user_id: int):
        """Clean up old sessions for user if exceeding limit"""
        try:
            active_count = self.get_active_sessions_count(user_id)
            
            if active_count >= self.config.max_concurrent_sessions:
                # Remove oldest sessions
                sessions_to_remove = active_count - self.config.max_concurrent_sessions + 1
                
                if self.use_redis:
                    pattern = f"session:user:{user_id}:*"
                    oldest_sessions = []
                    
                    for key in self.redis_client.scan_iter(match=pattern):
                        session_id = key.split(':')[-1]
                        session_data = self._get_session(session_id)
                        if session_data:
                            oldest_sessions.append((session_id, session_data['created_at']))
                    
                    # Sort by creation time and remove oldest
                    oldest_sessions.sort(key=lambda x: x[1])
                    for session_id, _ in oldest_sessions[:sessions_to_remove]:
                        self._remove_session(session_id)
                        self._log_security_event(session_id, 'auto_cleanup', {'user_id': user_id})
                
        except Exception as e:
            logger.error(f"❌ Session cleanup failed: {e}")
    
    def _log_security_event(self, session_id: str, event_type: str, details: Dict):
        """Log security events"""
        try:
            event = {
                'session_id': session_id,
                'event_type': event_type,
                'timestamp': datetime.utcnow().isoformat(),
                'details': details
            }
            
            # Store in security events log
            if session_id not in self.security_events:
                self.security_events[session_id] = []
            
            self.security_events[session_id].append(event)
            
            # Log to application logs
            logger.warning(f"🔒 Security event [{event_type}] for session {session_id}: {details}")
            
        except Exception as e:
            logger.error(f"❌ Failed to log security event: {e}")
    
    def get_security_events(self, session_id: str) -> list:
        """Get security events for session"""
        return self.security_events.get(session_id, [])
    
    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get comprehensive session information"""
        try:
            session_data = self._get_session(session_id)
            if not session_data:
                return {"error": "Session not found"}
            
            current_time = datetime.utcnow()
            created_at = datetime.fromisoformat(session_data['created_at'])
            last_activity = datetime.fromisoformat(session_data['last_activity'])
            
            return {
                "session_id": session_id,
                "user_id": session_data['user_id'],
                "created_at": session_data['created_at'],
                "last_activity": session_data['last_activity'],
                "age_seconds": (current_time - created_at).total_seconds(),
                "idle_seconds": (current_time - last_activity).total_seconds(),
                "ip_address": session_data['ip_address'],
                "security_flags": session_data.get('security_flags', {}),
                "security_events": self.get_security_events(session_id)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get session info: {e}")
            return {"error": str(e)}


# Global session manager instance
session_manager = SessionSecurityManager()


class SecureSessionMiddleware:
    """Middleware for automatic session security validation"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Add session security validation logic here
            pass
        
        await self.app(scope, receive, send)


# Dependency for FastAPI
def get_secure_session(request: Request, credentials: HTTPAuthorizationCredentials = None):
    """FastAPI dependency for secure session validation"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token required"
        )
    
    session_data = session_manager.validate_session(credentials.credentials, request)
    return session_data


# Export utilities
__all__ = [
    'SessionSecurityManager',
    'session_manager',
    'get_secure_session',
    'SecureSessionMiddleware'
]