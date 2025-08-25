"""
Advanced Rate Limiting Middleware for Trading Post API
Provides comprehensive rate limiting with different policies for different endpoint types
"""

import time
import json
import logging
from typing import Dict, Optional, Tuple, Any
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Advanced rate limiting middleware with multiple policies
    """
    
    def __init__(self, app, config: Optional[Dict] = None):
        super().__init__(app)
        
        # Default rate limiting configuration
        self.config = config or {
            # General API endpoints
            "default": {"requests": 100, "window": 3600},  # 100 requests per hour
            
            # Authentication endpoints
            "auth": {"requests": 10, "window": 900},  # 10 attempts per 15 minutes
            
            # Search/listing endpoints
            "search": {"requests": 60, "window": 3600},  # 60 searches per hour
            
            # Messaging endpoints
            "messaging": {"requests": 30, "window": 3600},  # 30 messages per hour
            
            # Upload endpoints
            "upload": {"requests": 20, "window": 3600},  # 20 uploads per hour
            
            # Creation endpoints (items, reviews)
            "creation": {"requests": 25, "window": 3600},  # 25 creates per hour
            
            # Critical operations (password reset, payment)
            "critical": {"requests": 5, "window": 3600},  # 5 attempts per hour
        }
        
        # Storage for rate limit tracking
        self.request_counts = defaultdict(lambda: defaultdict(list))
        self.cleanup_interval = 300  # Cleanup every 5 minutes
        self.last_cleanup = time.time()
        
        # Define endpoint categories
        self.endpoint_categories = {
            # Authentication
            "/register": "auth",
            "/token": "auth",
            "/auth/": "auth",
            "/sso/": "auth",
            
            # Search and listings
            "/api/listings/search": "search",
            "/items": "search",
            "/api/listings": "search",
            
            # Messaging
            "/messages": "messaging",
            
            # Uploads
            "/upload/": "upload",
            "/api/items/analyze-photo": "upload",
            
            # Creation
            "/items": "creation",
            "/reviews": "creation",
            "/api/items/create-from-ai": "creation",
            
            # Critical operations
            "/payments/": "critical",
            "/memberships/": "critical",
            "/users/me": "default",  # Profile updates are important but not critical
        }
    
    def _get_client_identifier(self, request: Request) -> str:
        """
        Get unique identifier for the client (IP + User ID if available)
        """
        # Get IP address
        client_ip = request.client.host
        if "x-forwarded-for" in request.headers:
            client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
        elif "x-real-ip" in request.headers:
            client_ip = request.headers["x-real-ip"]
        
        # Try to get user ID from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        
        # Combine IP and user ID for more granular tracking
        if user_id:
            return f"user_{user_id}_{client_ip}"
        else:
            return f"ip_{client_ip}"
    
    def _get_endpoint_category(self, path: str, method: str) -> str:
        """
        Determine the rate limit category for an endpoint
        """
        # Check for exact matches first
        if path in self.endpoint_categories:
            return self.endpoint_categories[path]
        
        # Check for prefix matches
        for endpoint_prefix, category in self.endpoint_categories.items():
            if endpoint_prefix.endswith("/") and path.startswith(endpoint_prefix):
                return category
            elif not endpoint_prefix.endswith("/") and path.startswith(endpoint_prefix + "/"):
                return category
        
        # Special handling based on HTTP method
        if method == "POST":
            if "/items" in path:
                return "creation"
            elif "/messages" in path:
                return "messaging"
            elif "/upload" in path:
                return "upload"
        elif method == "GET":
            if "/search" in path or "/listings" in path:
                return "search"
        
        return "default"
    
    def _cleanup_old_requests(self):
        """
        Clean up old request records to prevent memory leaks
        """
        current_time = time.time()
        
        # Only cleanup every 5 minutes
        if current_time - self.last_cleanup < self.cleanup_interval:
            return
        
        logger.info("🧹 Cleaning up old rate limit records")
        
        # Get the maximum window size
        max_window = max(policy["window"] for policy in self.config.values())
        cutoff_time = current_time - max_window
        
        # Clean up old records
        total_removed = 0
        for client_id in list(self.request_counts.keys()):
            for category in list(self.request_counts[client_id].keys()):
                old_count = len(self.request_counts[client_id][category])
                self.request_counts[client_id][category] = [
                    timestamp for timestamp in self.request_counts[client_id][category]
                    if timestamp > cutoff_time
                ]
                new_count = len(self.request_counts[client_id][category])
                total_removed += old_count - new_count
                
                # Remove empty categories
                if not self.request_counts[client_id][category]:
                    del self.request_counts[client_id][category]
            
            # Remove empty clients
            if not self.request_counts[client_id]:
                del self.request_counts[client_id]
        
        self.last_cleanup = current_time
        if total_removed > 0:
            logger.info(f"✅ Cleaned up {total_removed} old rate limit records")
    
    def _check_rate_limit(self, client_id: str, category: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if client has exceeded rate limit for the category
        """
        current_time = time.time()
        policy = self.config[category]
        window_start = current_time - policy["window"]
        
        # Get recent requests for this client and category
        recent_requests = [
            timestamp for timestamp in self.request_counts[client_id][category]
            if timestamp > window_start
        ]
        
        # Update the stored requests (remove old ones)
        self.request_counts[client_id][category] = recent_requests
        
        # Check if limit exceeded
        current_count = len(recent_requests)
        limit_exceeded = current_count >= policy["requests"]
        
        # Calculate reset time
        if recent_requests:
            oldest_request = min(recent_requests)
            reset_time = oldest_request + policy["window"]
        else:
            reset_time = current_time + policy["window"]
        
        return not limit_exceeded, {
            "limit": policy["requests"],
            "remaining": max(0, policy["requests"] - current_count),
            "reset": int(reset_time),
            "window": policy["window"],
            "category": category
        }
    
    def _record_request(self, client_id: str, category: str):
        """
        Record a new request for rate limiting
        """
        current_time = time.time()
        self.request_counts[client_id][category].append(current_time)
    
    async def dispatch(self, request: Request, call_next):
        """
        Main middleware dispatch method
        """
        # Skip rate limiting for static files and health checks
        if (request.url.path.startswith("/static/") or 
            request.url.path.startswith("/assets/") or
            request.url.path in ["/health", "/favicon.ico", "/manifest.json"]):
            return await call_next(request)
        
        # Cleanup old records periodically
        self._cleanup_old_requests()
        
        # Get client identifier and endpoint category
        client_id = self._get_client_identifier(request)
        category = self._get_endpoint_category(request.url.path, request.method)
        
        # Check rate limit
        allowed, limit_info = self._check_rate_limit(client_id, category)
        
        if not allowed:
            logger.warning(
                f"🚫 Rate limit exceeded for {client_id} on {request.url.path} "
                f"(category: {category}, limit: {limit_info['limit']}/{limit_info['window']}s)"
            )
            
            # Return rate limit exceeded response
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests for {category} operations. "
                              f"Limit: {limit_info['limit']} requests per {limit_info['window']} seconds.",
                    "category": category,
                    "limit": limit_info['limit'],
                    "window": limit_info['window'],
                    "reset_time": limit_info['reset'],
                    "retry_after": limit_info['reset'] - int(time.time())
                },
                headers={
                    "X-RateLimit-Limit": str(limit_info['limit']),
                    "X-RateLimit-Remaining": str(limit_info['remaining']),
                    "X-RateLimit-Reset": str(limit_info['reset']),
                    "X-RateLimit-Category": category,
                    "Retry-After": str(max(1, limit_info['reset'] - int(time.time())))
                }
            )
        
        # Record the request
        self._record_request(client_id, category)
        
        # Process the request
        try:
            response = await call_next(request)
            
            # Add rate limit headers to successful responses
            response.headers["X-RateLimit-Limit"] = str(limit_info['limit'])
            response.headers["X-RateLimit-Remaining"] = str(limit_info['remaining'])
            response.headers["X-RateLimit-Reset"] = str(limit_info['reset'])
            response.headers["X-RateLimit-Category"] = category
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Error processing request: {e}")
            raise


class AdvancedRateLimiter:
    """
    Advanced rate limiter with Redis-like functionality using in-memory storage
    Provides additional features like burst protection and adaptive limiting
    """
    
    def __init__(self):
        self.request_history = defaultdict(list)
        self.burst_protection = defaultdict(list)
        self.adaptive_limits = defaultdict(lambda: 1.0)  # Multiplier for adaptive limiting
    
    def check_burst_protection(self, client_id: str, burst_window: int = 60, burst_limit: int = 10) -> bool:
        """
        Check for burst protection (too many requests in a short time)
        """
        current_time = time.time()
        window_start = current_time - burst_window
        
        # Get recent burst requests
        recent_bursts = [
            timestamp for timestamp in self.burst_protection[client_id]
            if timestamp > window_start
        ]
        
        # Update stored bursts
        self.burst_protection[client_id] = recent_bursts
        
        return len(recent_bursts) < burst_limit
    
    def record_burst(self, client_id: str):
        """
        Record a burst request
        """
        self.burst_protection[client_id].append(time.time())
    
    def get_adaptive_limit(self, client_id: str, base_limit: int) -> int:
        """
        Get adaptive limit based on client behavior
        """
        multiplier = self.adaptive_limits[client_id]
        return int(base_limit * multiplier)
    
    def adjust_adaptive_limit(self, client_id: str, increase: bool = True, factor: float = 0.1):
        """
        Adjust adaptive limit based on client behavior
        """
        current_multiplier = self.adaptive_limits[client_id]
        
        if increase:
            # Increase limit for well-behaved clients
            self.adaptive_limits[client_id] = min(2.0, current_multiplier + factor)
        else:
            # Decrease limit for problematic clients
            self.adaptive_limits[client_id] = max(0.5, current_multiplier - factor)


# Global instance for dependency injection
advanced_rate_limiter = AdvancedRateLimiter()


def create_rate_limiting_middleware(custom_config: Optional[Dict] = None) -> RateLimitingMiddleware:
    """
    Factory function to create rate limiting middleware with custom configuration
    """
    return RateLimitingMiddleware(None, custom_config)


# Rate limiting decorator for individual endpoints
def rate_limit(category: str = "default", requests: int = None, window: int = None):
    """
    Decorator to apply rate limiting to specific endpoints
    """
    def decorator(func):
        func._rate_limit_category = category
        if requests is not None:
            func._rate_limit_requests = requests
        if window is not None:
            func._rate_limit_window = window
        return func
    return decorator


# Dependency for manual rate limit checking
async def check_rate_limit_dependency(request: Request, category: str = "default"):
    """
    Dependency function for manual rate limit checking in endpoints
    """
    # This would be implemented to work with the middleware
    # For now, we'll rely on the middleware to handle rate limiting
    pass


# Health check for rate limiting system
def get_rate_limit_health() -> Dict[str, Any]:
    """
    Get health information about the rate limiting system
    """
    return {
        "status": "healthy",
        "tracked_clients": len(advanced_rate_limiter.request_history),
        "burst_protection_active": len(advanced_rate_limiter.burst_protection),
        "adaptive_limits_active": len(advanced_rate_limiter.adaptive_limits)
    }