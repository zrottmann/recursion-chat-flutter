# -*- coding: utf-8 -*-
"""
🔴 ERROR HANDLING SYSTEM
Module: error_handler.py
Purpose: Centralized error handling, tracking, and fix suggestions
Features:
  - Automatic error categorization
  - Known fix database
  - Error pattern detection
  - Detailed logging with context
Last Updated: 2025-08-13
"""

import json
import traceback
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from functools import wraps
import re
import uuid

# Configure enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


class ErrorCode:
    """
    🏷️ ERROR CODE CONSTANTS
    Centralized error codes for consistent error handling
    """
    # Authentication Errors (AUTH_xxx)
    AUTH_001 = "AUTH_001"  # Invalid token
    AUTH_002 = "AUTH_002"  # Token expired
    AUTH_003 = "AUTH_003"  # Insufficient permissions
    AUTH_004 = "AUTH_004"  # User not found
    
    # Database Errors (DB_xxx)
    DB_001 = "DB_001"  # Connection failed
    DB_002 = "DB_002"  # Query failed
    DB_003 = "DB_003"  # Constraint violation
    DB_004 = "DB_004"  # Transaction failed
    
    # Validation Errors (VAL_xxx)
    VAL_001 = "VAL_001"  # Missing required field
    VAL_002 = "VAL_002"  # Invalid format
    VAL_003 = "VAL_003"  # Value out of range
    VAL_004 = "VAL_004"  # Type mismatch
    
    # Business Logic Errors (BIZ_xxx)
    BIZ_001 = "BIZ_001"  # Operation not allowed
    BIZ_002 = "BIZ_002"  # Resource not found
    BIZ_003 = "BIZ_003"  # Duplicate resource
    BIZ_004 = "BIZ_004"  # Quota exceeded
    
    # System Errors (SYS_xxx)
    SYS_001 = "SYS_001"  # Internal server error
    SYS_002 = "SYS_002"  # Service unavailable
    SYS_003 = "SYS_003"  # Timeout
    SYS_004 = "SYS_004"  # Rate limit exceeded


class APIError(Exception):
    """
    🔴 CUSTOM API ERROR CLASS
    Structured error with code, message, and fix hints
    """
    
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict] = None,
        fix_hint: Optional[str] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.fix_hint = fix_hint or ErrorFixes.get_fix_hint(code)
        self.timestamp = datetime.now().isoformat()
        self.error_id = str(uuid.uuid4())
        super().__init__(self.message)
    
    def to_dict(self) -> Dict:
        """Convert error to dictionary for JSON response"""
        return {
            "error_id": self.error_id,
            "code": self.code,
            "message": self.message,
            "details": self.details,
            "fix_hint": self.fix_hint,
            "timestamp": self.timestamp
        }


class ErrorFixes:
    """
    💡 ERROR FIX DATABASE
    Maps error codes to helpful fix suggestions
    """
    
    _fixes = {
        # Authentication Fixes
        ErrorCode.AUTH_001: {
            "hint": "Check if token is in correct format: 'Bearer <token>'",
            "steps": [
                "Verify Authorization header is present",
                "Check token format: should start with 'Bearer '",
                "Ensure token hasn't been modified"
            ]
        },
        ErrorCode.AUTH_002: {
            "hint": "Token has expired. Please log in again.",
            "steps": [
                "Log out and log back in",
                "Check if refresh token is available",
                "Verify server time is synchronized"
            ]
        },
        
        # Database Fixes
        ErrorCode.DB_001: {
            "hint": "Database connection failed. Check database service.",
            "steps": [
                "Verify database is running",
                "Check connection string in .env",
                "Ensure network connectivity",
                "Check database credentials"
            ]
        },
        ErrorCode.DB_003: {
            "hint": "Database constraint violation. Check for duplicates or missing references.",
            "steps": [
                "Check if record already exists",
                "Verify foreign key references",
                "Ensure required fields are provided"
            ]
        },
        
        # Validation Fixes
        ErrorCode.VAL_001: {
            "hint": "Required field is missing from request.",
            "steps": [
                "Check API documentation for required fields",
                "Verify request body structure",
                "Ensure Content-Type is application/json"
            ]
        },
        ErrorCode.VAL_002: {
            "hint": "Field format is invalid.",
            "steps": [
                "Check expected format in API docs",
                "Verify data types (string, number, boolean)",
                "Check for special characters or length limits"
            ]
        },
        
        # System Fixes
        ErrorCode.SYS_001: {
            "hint": "Internal server error occurred. Check server logs.",
            "steps": [
                "Check server logs for stack trace",
                "Verify all dependencies are installed",
                "Check for configuration issues",
                "Restart the server if needed"
            ]
        },
        ErrorCode.SYS_004: {
            "hint": "Rate limit exceeded. Please wait before retrying.",
            "steps": [
                "Wait for rate limit window to reset",
                "Implement exponential backoff",
                "Consider caching responses",
                "Request rate limit increase if needed"
            ]
        }
    }
    
    @classmethod
    def get_fix_hint(cls, error_code: str) -> str:
        """Get fix hint for error code"""
        fix_data = cls._fixes.get(error_code, {})
        return fix_data.get("hint", "Check application logs for more details")
    
    @classmethod
    def get_fix_steps(cls, error_code: str) -> List[str]:
        """Get detailed fix steps for error code"""
        fix_data = cls._fixes.get(error_code, {})
        return fix_data.get("steps", [])


class ErrorTracker:
    """
    🔍 ERROR TRACKING SYSTEM
    Tracks, categorizes, and provides analytics for errors
    """
    
    def __init__(self, log_dir: str = "./error_logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.errors: List[Dict] = []
        self.patterns: Dict[str, int] = {}
        self.stats = {
            "total": 0,
            "by_code": {},
            "by_severity": {},
            "fixed": 0
        }
    
    def track_error(
        self,
        error: Exception,
        context: Optional[Dict] = None,
        request_data: Optional[Dict] = None
    ) -> str:
        """
        📝 Track an error occurrence
        Returns: Error ID for reference
        """
        error_id = str(uuid.uuid4())
        
        # Extract error details
        if isinstance(error, APIError):
            error_data = error.to_dict()
        else:
            error_data = {
                "error_id": error_id,
                "type": type(error).__name__,
                "message": str(error),
                "timestamp": datetime.now().isoformat()
            }
        
        # Add context and traceback
        error_entry = {
            **error_data,
            "traceback": traceback.format_exc(),
            "context": context or {},
            "request_data": request_data or {},
            "location": self._extract_error_location(),
            "fixed": False
        }
        
        # Store and analyze
        self.errors.append(error_entry)
        self._update_statistics(error_entry)
        self._detect_pattern(error_entry)
        self._log_error(error_entry)
        
        # Save to file
        self._save_to_file(error_entry)
        
        return error_id
    
    def _extract_error_location(self) -> Dict:
        """Extract file and line number from traceback"""
        tb = traceback.extract_tb(traceback.sys.exc_info()[2])
        if tb:
            last_call = tb[-1]
            return {
                "file": last_call.filename,
                "line": last_call.lineno,
                "function": last_call.name
            }
        return {}
    
    def _update_statistics(self, error_entry: Dict):
        """Update error statistics"""
        self.stats["total"] += 1
        
        # Count by error code
        if "code" in error_entry:
            code = error_entry["code"]
            self.stats["by_code"][code] = self.stats["by_code"].get(code, 0) + 1
        
        # Categorize severity
        if "status_code" in error_entry:
            status = error_entry["status_code"]
            if status >= 500:
                severity = "critical"
            elif status >= 400:
                severity = "error"
            else:
                severity = "warning"
            
            self.stats["by_severity"][severity] = \
                self.stats["by_severity"].get(severity, 0) + 1
    
    def _detect_pattern(self, error_entry: Dict):
        """Detect recurring error patterns"""
        pattern_key = f"{error_entry.get('code', 'unknown')}:{error_entry.get('message', '')}"
        self.patterns[pattern_key] = self.patterns.get(pattern_key, 0) + 1
        
        if self.patterns[pattern_key] > 3:
            logger.warning(
                f"⚠️ PATTERN DETECTED: Error '{pattern_key}' "
                f"has occurred {self.patterns[pattern_key]} times"
            )
    
    def _log_error(self, error_entry: Dict):
        """Log formatted error to console"""
        logger.error("=" * 60)
        logger.error(f"🔴 ERROR: {error_entry.get('error_id', 'unknown')}")
        logger.error("=" * 60)
        
        if "code" in error_entry:
            logger.error(f"Code: {error_entry['code']}")
        
        logger.error(f"Message: {error_entry.get('message', 'No message')}")
        
        if "location" in error_entry and error_entry["location"]:
            loc = error_entry["location"]
            logger.error(
                f"Location: {loc.get('file', 'unknown')}:"
                f"{loc.get('line', 0)} in {loc.get('function', 'unknown')}"
            )
        
        if "fix_hint" in error_entry:
            logger.info(f"💡 FIX HINT: {error_entry['fix_hint']}")
            
            fix_steps = ErrorFixes.get_fix_steps(error_entry.get("code", ""))
            if fix_steps:
                logger.info("📋 Steps to fix:")
                for i, step in enumerate(fix_steps, 1):
                    logger.info(f"   {i}. {step}")
        
        logger.error("=" * 60)
    
    def _save_to_file(self, error_entry: Dict):
        """Save error to log file"""
        timestamp = datetime.now().strftime("%Y%m%d")
        log_file = self.log_dir / f"errors_{timestamp}.json"
        
        # Load existing errors or create new list
        if log_file.exists():
            with open(log_file, 'r') as f:
                errors = json.load(f)
        else:
            errors = []
        
        # Append new error
        errors.append(error_entry)
        
        # Save back to file
        with open(log_file, 'w') as f:
            json.dump(errors, f, indent=2, default=str)
    
    def mark_as_fixed(self, error_id: str, fix_details: Optional[Dict] = None):
        """Mark an error as fixed"""
        for error in self.errors:
            if error.get("error_id") == error_id:
                error["fixed"] = True
                error["fix_details"] = fix_details or {}
                error["fixed_at"] = datetime.now().isoformat()
                self.stats["fixed"] += 1
                logger.info(f"✅ Error {error_id} marked as fixed")
                break
    
    def get_report(self) -> Dict:
        """Generate error analytics report"""
        return {
            "summary": self.stats,
            "patterns": [
                {"pattern": k, "count": v}
                for k, v in sorted(
                    self.patterns.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:10]
            ],
            "recent_errors": self.errors[-10:],
            "unfixed_errors": [e for e in self.errors if not e.get("fixed")]
        }


# 🌐 Global error tracker instance
error_tracker = ErrorTracker()


def track_errors(func):
    """
    🔧 DECORATOR: Automatic error tracking
    Usage:
        @track_errors
        def my_function():
            # function code
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Track the error
            error_id = error_tracker.track_error(
                e,
                context={
                    "function": func.__name__,
                    "module": func.__module__,
                    "args": str(args)[:200],  # Truncate for safety
                    "kwargs": str(kwargs)[:200]
                }
            )
            
            # Re-raise with error ID
            if isinstance(e, APIError):
                raise
            else:
                raise APIError(
                    code=ErrorCode.SYS_001,
                    message=str(e),
                    status_code=500,
                    details={"error_id": error_id}
                )
    
    return wrapper


def handle_api_errors(func):
    """
    🛡️ DECORATOR: API error handler for FastAPI endpoints
    Converts exceptions to proper JSON responses
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except APIError as e:
            # Already structured error
            error_tracker.track_error(e)
            return {
                "success": False,
                **e.to_dict()
            }
        except Exception as e:
            # Unexpected error
            error_id = error_tracker.track_error(e)
            return {
                "success": False,
                "error_id": error_id,
                "code": ErrorCode.SYS_001,
                "message": "An unexpected error occurred",
                "fix_hint": "Please contact support with the error ID"
            }
    
    return wrapper


# 📝 Example usage functions
def validate_request(data: Dict, required_fields: List[str]):
    """
    ✅ VALIDATION HELPER
    Validates request data and raises appropriate errors
    """
    missing_fields = [f for f in required_fields if f not in data]
    
    if missing_fields:
        raise APIError(
            code=ErrorCode.VAL_001,
            message=f"Missing required fields: {', '.join(missing_fields)}",
            status_code=400,
            details={"missing_fields": missing_fields}
        )


def check_authorization(user_role: str, required_role: str):
    """
    🔐 AUTHORIZATION HELPER
    Checks if user has required role
    """
    role_hierarchy = {
        "admin": 3,
        "moderator": 2,
        "user": 1,
        "guest": 0
    }
    
    if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 0):
        raise APIError(
            code=ErrorCode.AUTH_003,
            message=f"Insufficient permissions. Required role: {required_role}",
            status_code=403,
            details={
                "user_role": user_role,
                "required_role": required_role
            }
        )