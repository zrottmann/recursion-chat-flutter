"""
Main FastAPI application for Trading Post with Appwrite Integration
Enhanced with real-time features, AI matching, and comprehensive backend services
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import uvicorn
import os
import json
import logging
from datetime import datetime

# Import Appwrite services
from appwrite_config import appwrite_config
from appwrite_auth import appwrite_auth
from appwrite_database import appwrite_db
from appwrite_storage import appwrite_storage
from appwrite_functions import appwrite_functions
from appwrite_realtime import appwrite_realtime

# Import AI matching system
from ai_matching_router import get_matching_router
from ai_integration_service import AIIntegrationService
from ml_learning_system import MatchingMLSystem
from batch_matching_system import BatchMatchingSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Trading Post with Appwrite",
    description="Local community trading and bartering app with AI-powered matching, real-time updates, and comprehensive backend services",
    version="2.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include AI matching router
app.include_router(get_matching_router())

# Security
security = HTTPBearer()

# Initialize AI systems
ai_integration_service = AIIntegrationService()
ml_system = MatchingMLSystem()
batch_matching_system = BatchMatchingSystem()


# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    username: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None


class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    type: str  # 'offer' or 'want'
    condition: Optional[str] = None
    value_estimate: Optional[float] = None
    location: Optional[str] = None
    tags: Optional[List[str]] = []


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    value_estimate: Optional[float] = None
    is_active: Optional[bool] = None


class MessageCreate(BaseModel):
    recipient_id: str
    content: str
    trade_id: Optional[str] = None


class TradeUpdate(BaseModel):
    status: str  # 'accepted', 'rejected', 'completed'
    meeting_details: Optional[Dict[str, Any]] = None
    feedback: Optional[Dict[str, Any]] = None


class MatchRequest(BaseModel):
    location: Optional[str] = None
    radius: Optional[float] = 10.0
    use_ai: Optional[bool] = True


# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        result = await appwrite_auth.get_current_user(token)

        if not result.get("success"):
            raise HTTPException(status_code=401, detail="Invalid authentication")

        return result["user"], result["profile"]

    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# Health and status endpoints
@app.get("/")
async def root():
    return {
        "message": "Welcome to Trading Post with Appwrite",
        "version": "2.0.0",
        "features": [
            "Real-time messaging",
            "AI-powered matching",
            "Cloud storage with CDN",
            "Advanced analytics",
            "Serverless functions",
        ],
        "endpoints": {
            "auth": "/auth/*",
            "users": "/users/*",
            "listings": "/listings/*",
            "trades": "/trades/*",
            "messages": "/messages/*",
            "upload": "/upload/*",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check including Appwrite services"""
    try:
        # Check Appwrite connectivity
        appwrite_health = appwrite_config.health_check()

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "appwrite": appwrite_health,
                "database": appwrite_health,
                "storage": appwrite_health,
                "functions": appwrite_health,
                "realtime": len(appwrite_realtime.active_subscriptions) > 0,
            },
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.utcnow().isoformat()}


# Authentication endpoints
@app.post("/auth/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        result = await appwrite_auth.create_user(
            email=user_data.email, password=user_data.password, name=user_data.name
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return {"message": "User created successfully", "user_id": result["user"]["$id"]}

    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    try:
        result = await appwrite_auth.login_user(email=credentials.email, password=credentials.password)

        if not result.get("success"):
            raise HTTPException(status_code=401, detail=result.get("error"))

        return {
            "access_token": result["session"]["secret"],
            "token_type": "bearer",
            "user": result["user"],
            "profile": result["profile"],
        }

    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@app.post("/auth/logout")
async def logout(user_profile=Depends(get_current_user)):
    """Logout user"""
    try:
        # In a real implementation, you'd get the session ID
        session_id = "current"  # This would come from the token
        result = await appwrite_auth.logout_user(session_id)

        return {"message": "Logged out successfully"}

    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")


# User endpoints
@app.get("/users/me")
async def get_current_user_profile(user_profile=Depends(get_current_user)):
    """Get current user profile"""
    user, profile = user_profile
    return {"user": user, "profile": profile}


@app.put("/users/me")
async def update_user_profile(update_data: UserUpdate, user_profile=Depends(get_current_user)):
    """Update user profile"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Get JWT token for user-specific operations
        # In a real implementation, extract this from the request
        jwt_token = "user_jwt_token"

        result = await appwrite_auth.update_user_profile(jwt_token, update_data.dict(exclude_unset=True))

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return result["profile"]

    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Profile update failed")


@app.get("/users/{user_id}")
async def get_user_profile(user_id: str, current_user=Depends(get_current_user)):
    """Get public user profile"""
    try:
        result = await appwrite_db.get_user_profile(user_id)

        if not result.get("success"):
            raise HTTPException(status_code=404, detail="User not found")

        # Return public profile only
        profile = result["profile"]
        public_profile = {
            "id": profile["$id"],
            "name": profile.get("name"),
            "bio": profile.get("bio"),
            "location": profile.get("location"),
            "profile_image_url": profile.get("profile_image_url"),
            "ratings": profile.get("ratings", {}),
            "created_at": profile.get("created_at"),
        }

        return public_profile

    except Exception as e:
        logger.error(f"Get user profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")


@app.get("/users/search")
async def search_users(
    q: Optional[str] = None, location: Optional[str] = None, limit: int = 20, current_user=Depends(get_current_user)
):
    """Search users"""
    try:
        result = await appwrite_db.search_users(query_text=q, location=location, limit=limit)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return {"users": result["users"], "total": result["total"]}

    except Exception as e:
        logger.error(f"User search error: {e}")
        raise HTTPException(status_code=500, detail="User search failed")


# Listing endpoints
@app.post("/listings")
async def create_listing(listing_data: ListingCreate, user_profile=Depends(get_current_user)):
    """Create a new listing"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Use AI to enhance listing if available
        ai_result = await appwrite_functions.ai_categorize_listing(listing_data.dict())
        if ai_result.get("success"):
            listing_data.category = ai_result.get("category", listing_data.category)
            listing_data.tags.extend(ai_result.get("tags", []))

        data = listing_data.dict()
        data["user_id"] = user_id

        result = await appwrite_db.create_listing(data)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        # Trigger real-time update
        appwrite_realtime.broadcast_global_notification(
            "new_listing", {"listing": result["listing"]}, target_groups=["marketplace_subscribers"]
        )

        return result["listing"]

    except Exception as e:
        logger.error(f"Create listing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create listing")


@app.get("/listings")
async def search_listings(
    category: Optional[str] = None,
    type: Optional[str] = None,
    location: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user=Depends(get_current_user),
):
    """Search listings"""
    try:
        result = await appwrite_db.search_listings(
            category=category, listing_type=type, location=location, query_text=q, limit=limit, offset=offset
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return {"listings": result["listings"], "total": result["total"]}

    except Exception as e:
        logger.error(f"Search listings error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@app.get("/listings/{listing_id}")
async def get_listing(listing_id: str, current_user=Depends(get_current_user)):
    """Get single listing"""
    try:
        result = await appwrite_db.get_listing(listing_id)

        if not result.get("success"):
            raise HTTPException(status_code=404, detail="Listing not found")

        return result["listing"]

    except Exception as e:
        logger.error(f"Get listing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get listing")


@app.put("/listings/{listing_id}")
async def update_listing(listing_id: str, update_data: ListingUpdate, user_profile=Depends(get_current_user)):
    """Update listing"""
    try:
        result = await appwrite_db.update_listing(listing_id, update_data.dict(exclude_unset=True))

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return result["listing"]

    except Exception as e:
        logger.error(f"Update listing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update listing")


@app.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user_profile=Depends(get_current_user)):
    """Delete listing"""
    try:
        result = await appwrite_db.delete_listing(listing_id)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return {"message": "Listing deleted successfully"}

    except Exception as e:
        logger.error(f"Delete listing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete listing")


# Trade/Match endpoints
@app.post("/matches/find")
async def find_matches(request: MatchRequest, user_profile=Depends(get_current_user)):
    """Find AI-powered matches for user"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Get user's listings
        listings_result = await appwrite_db.search_listings(user_id=user_id, limit=100)

        # Get nearby users or all users if no location
        if request.location:
            users_result = await appwrite_db.search_users(location=request.location, limit=100)
        else:
            users_result = await appwrite_db.search_users(limit=100)

        if not users_result.get("success"):
            raise HTTPException(status_code=400, detail="Failed to find users")

        users_data = users_result["users"]

        # Use AI matching
        if request.use_ai:
            result = await appwrite_functions.ai_match_users(users_data, request.dict())
        else:
            result = await appwrite_functions.local_ai_matching(users_data)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        # Send real-time notifications for new matches
        for match in result.get("matches", []):
            if match.get("user1_id") == user_id or match.get("user2_id") == user_id:
                other_user_id = match.get("user2_id") if match.get("user1_id") == user_id else match.get("user1_id")

                appwrite_realtime.broadcast_user_notification(other_user_id, "new_match", {"match": match})

        return result

    except Exception as e:
        logger.error(f"Find matches error: {e}")
        raise HTTPException(status_code=500, detail="Failed to find matches")


@app.get("/trades")
async def get_user_trades(status: Optional[str] = None, user_profile=Depends(get_current_user)):
    """Get user's trades"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        result = await appwrite_db.get_user_trades(user_id, status)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return result["trades"]

    except Exception as e:
        logger.error(f"Get trades error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get trades")


@app.put("/trades/{trade_id}")
async def update_trade(trade_id: str, update_data: TradeUpdate, user_profile=Depends(get_current_user)):
    """Update trade status"""
    try:
        result = await appwrite_db.update_trade_status(
            trade_id, update_data.status, update_data.dict(exclude={"status"}, exclude_unset=True)
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        # Send real-time notification
        trade = result["trade"]
        for user_id in [trade.get("user1_id"), trade.get("user2_id")]:
            if user_id:
                appwrite_realtime.broadcast_user_notification(user_id, "trade_updated", {"trade": trade})

        return result["trade"]

    except Exception as e:
        logger.error(f"Update trade error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update trade")


# Messaging endpoints
@app.post("/messages")
async def send_message(message_data: MessageCreate, user_profile=Depends(get_current_user)):
    """Send a message"""
    try:
        user, profile = user_profile
        sender_id = user["$id"]

        data = message_data.dict()
        data["sender_id"] = sender_id

        result = await appwrite_db.create_message(data)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        # Send real-time notification
        appwrite_realtime.broadcast_user_notification(
            message_data.recipient_id, "new_message", {"message": result["message"]}
        )

        return result["message"]

    except Exception as e:
        logger.error(f"Send message error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")


@app.get("/messages/{user_id}")
async def get_conversation(user_id: str, trade_id: Optional[str] = None, user_profile=Depends(get_current_user)):
    """Get conversation with another user"""
    try:
        current_user, profile = user_profile
        current_user_id = current_user["$id"]

        result = await appwrite_db.get_conversation(current_user_id, user_id, trade_id)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        # Mark messages as read
        await appwrite_db.mark_messages_read(current_user_id, user_id)

        return result["messages"]

    except Exception as e:
        logger.error(f"Get conversation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get conversation")


# File upload endpoints
@app.post("/upload/item-image")
async def upload_item_image(
    file: UploadFile = File(...), listing_id: Optional[str] = None, user_profile=Depends(get_current_user)
):
    """Upload item image"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Read file data
        file_data = await file.read()

        result = await appwrite_storage.upload_item_image(file_data, file.filename, user_id, listing_id)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return result

    except Exception as e:
        logger.error(f"Upload item image error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


@app.post("/upload/profile-image")
async def upload_profile_image(file: UploadFile = File(...), user_profile=Depends(get_current_user)):
    """Upload profile image"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Read file data
        file_data = await file.read()

        result = await appwrite_storage.upload_profile_image(file_data, file.filename, user_id)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        # Update user profile with new image URL
        await appwrite_db.update_user_profile(user_id, {"profile_image_url": result["url"]})

        return result

    except Exception as e:
        logger.error(f"Upload profile image error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload profile image")


# Analytics endpoints
@app.get("/analytics/user")
async def get_user_analytics(user_profile=Depends(get_current_user)):
    """Get user analytics"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        result = await appwrite_db.get_user_analytics(user_id)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return result["analytics"]

    except Exception as e:
        logger.error(f"Get analytics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")


@app.get("/analytics/insights")
async def get_match_insights(period: str = "30d", user_profile=Depends(get_current_user)):
    """Get AI-powered match insights"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        result = await appwrite_functions.generate_match_insights(user_id, period)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))

        return result

    except Exception as e:
        logger.error(f"Get insights error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get insights")


# Real-time setup endpoint
@app.post("/realtime/setup")
async def setup_realtime(user_profile=Depends(get_current_user)):
    """Setup real-time subscriptions for user"""
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # This would be handled on the frontend, but we can provide subscription info
        subscription_channels = {
            "messages": f"user:{user_id}:messages",
            "trades": f"user:{user_id}:trades",
            "matches": f"user:{user_id}:matches",
            "marketplace": "marketplace:updates",
        }

        return {
            "channels": subscription_channels,
            "endpoint": appwrite_config.endpoint,
            "project_id": appwrite_config.project_id,
        }

    except Exception as e:
        logger.error(f"Setup realtime error: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup realtime")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run("app_appwrite:app", host="0.0.0.0", port=port, reload=True)
