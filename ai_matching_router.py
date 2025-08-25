"""
FastAPI Router for AI Matching System
Provides comprehensive matching endpoints for Trading Post
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

# Import matching components
from ai_matching_engine import (
    AIMatchingEngine,
    MatchingContext,
    ItemData,
    UserProfile
)
from ai_matching_schema import (
    MatchingSuggestion,
    MatchingPreference,
    MatchingHistory,
    get_matching_db,
    init_user_matching_preferences
)

# Import existing Appwrite services for integration
from appwrite_auth import appwrite_auth
from appwrite_database import appwrite_db
from appwrite_realtime import appwrite_realtime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()
router = APIRouter(prefix="/api/matching", tags=["AI Matching"])

# Initialize matching engine
matching_engine = AIMatchingEngine()


# Pydantic Models for API
class FindMatchesRequest(BaseModel):
    item_id: Optional[str] = None
    max_matches: int = Field(default=20, ge=1, le=100)
    use_ai_enhancement: bool = True
    location_radius: Optional[float] = Field(default=None, ge=0, le=500)


class UserMatchesRequest(BaseModel):
    max_matches: int = Field(default=50, ge=1, le=200)
    include_expired: bool = False
    status_filter: Optional[str] = Field(default=None, regex="^(pending|viewed|accepted|declined)$")


class AcceptMatchRequest(BaseModel):
    match_id: int
    message: Optional[str] = Field(default=None, max_length=500)
    propose_meetup: bool = False
    meetup_details: Optional[Dict[str, Any]] = None


class DeclineMatchRequest(BaseModel):
    match_id: int
    reason: str = Field(..., regex="^(location|value|category|quality|other)$")
    feedback: Optional[str] = Field(default=None, max_length=300)
    block_similar: bool = False


class UpdatePreferencesRequest(BaseModel):
    max_distance_km: Optional[float] = Field(default=None, ge=0, le=500)
    preferred_categories: Optional[List[str]] = None
    excluded_categories: Optional[List[str]] = None
    max_value_difference_percent: Optional[float] = Field(default=None, ge=0, le=100)
    min_item_value: Optional[float] = Field(default=None, ge=0)
    max_item_value: Optional[float] = Field(default=None, ge=0)
    enable_ai_matching: Optional[bool] = None
    notification_frequency: Optional[str] = Field(
        default=None, 
        regex="^(instant|daily|weekly|disabled)$"
    )
    auto_decline_low_scores: Optional[bool] = None
    min_auto_decline_score: Optional[float] = Field(default=None, ge=0, le=1)
    learn_from_interactions: Optional[bool] = None

    @validator('max_item_value')
    def max_greater_than_min(cls, v, values):
        min_val = values.get('min_item_value')
        if min_val is not None and v is not None and v < min_val:
            raise ValueError('max_item_value must be greater than min_item_value')
        return v


class MatchResponse(BaseModel):
    id: int
    user1_id: str
    user2_id: str
    item1_id: str
    item2_id: str
    item1_details: Dict[str, Any]
    item2_details: Dict[str, Any]
    matched_user: Dict[str, Any]
    overall_score: float
    value_score: float
    geographic_score: float
    category_score: float
    ai_reasoning: str
    confidence_level: float
    distance_km: Optional[float]
    value_difference_percentage: Optional[float]
    status: str
    created_at: datetime
    expires_at: Optional[datetime]


class PreferencesResponse(BaseModel):
    user_id: str
    max_distance_km: float
    preferred_categories: List[str]
    excluded_categories: List[str]
    max_value_difference_percent: float
    min_item_value: Optional[float]
    max_item_value: Optional[float]
    enable_ai_matching: bool
    notification_frequency: str
    auto_decline_low_scores: bool
    min_auto_decline_score: float
    learn_from_interactions: bool
    created_at: datetime
    updated_at: datetime


# Dependency to get current user (integrates with existing auth)
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


# Helper function to load item details from Appwrite
async def load_item_details(item_id: str) -> Dict[str, Any]:
    """Load item details from Appwrite database"""
    try:
        result = await appwrite_db.get_listing(item_id)
        if result.get("success"):
            return result["listing"]
        return {}
    except Exception as e:
        logger.error(f"Failed to load item {item_id}: {e}")
        return {}


# Helper function to load user profile from Appwrite
async def load_user_profile(user_id: str) -> Dict[str, Any]:
    """Load user profile from Appwrite database"""
    try:
        result = await appwrite_db.get_user_profile(user_id)
        if result.get("success"):
            profile = result["profile"]
            return {
                "id": profile["$id"],
                "name": profile.get("name", "Unknown User"),
                "email": profile.get("email"),
                "location": profile.get("location"),
                "bio": profile.get("bio"),
                "profile_image_url": profile.get("profile_image_url"),
                "ratings": profile.get("ratings", {}),
            }
        return {}
    except Exception as e:
        logger.error(f"Failed to load user profile {user_id}: {e}")
        return {}


@router.post("/find-matches/{item_id}", response_model=List[MatchResponse])
async def find_matches_for_item(
    item_id: str,
    request: FindMatchesRequest,
    background_tasks: BackgroundTasks,
    user_profile=Depends(get_current_user),
    db: Session = Depends(get_matching_db)
):
    """
    Find AI-powered matches for a specific item
    """
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Create matching context
        context = MatchingContext(
            user_id=user_id,
            item_id=item_id,
            max_matches=request.max_matches,
            use_ai_enhancement=request.use_ai_enhancement
        )

        # Update user preferences if location radius specified
        if request.location_radius:
            user_prefs = db.query(MatchingPreference).filter(
                MatchingPreference.user_id == user_id
            ).first()
            
            if user_prefs:
                user_prefs.max_distance_km = request.location_radius
                db.commit()

        # Find matches using AI engine
        matches = await matching_engine.find_matches_for_item(context, db)

        # Convert to response format
        response_matches = []
        for match in matches:
            # Load additional details for response
            item1_details = await load_item_details(match['item1_id'])
            item2_details = await load_item_details(match['item2_id'])
            
            # Determine which user is the matched user (not the current user)
            matched_user_id = match['user2_id'] if match['user1_id'] == user_id else match['user1_id']
            matched_user = await load_user_profile(matched_user_id)

            response_matches.append(MatchResponse(
                id=match['id'],
                user1_id=match['user1_id'],
                user2_id=match['user2_id'],
                item1_id=match['item1_id'],
                item2_id=match['item2_id'],
                item1_details=item1_details,
                item2_details=item2_details,
                matched_user=matched_user,
                overall_score=match['overall_score'],
                value_score=match.get('value_score', 0.0),
                geographic_score=match.get('geographic_score', 0.0),
                category_score=match.get('category_score', 0.0),
                ai_reasoning=match['ai_reasoning'],
                confidence_level=match['confidence_level'],
                distance_km=match.get('distance_km'),
                value_difference_percentage=match.get('value_difference_percentage'),
                status="pending",
                created_at=match['created_at'],
                expires_at=match.get('expires_at')
            ))

        # Send real-time notifications in background
        if response_matches:
            background_tasks.add_task(
                send_match_notifications, 
                user_id, 
                [match.matched_user['id'] for match in response_matches]
            )

        logger.info(f"Found {len(response_matches)} matches for item {item_id}")
        return response_matches

    except Exception as e:
        logger.error(f"Error finding matches for item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to find matches")


@router.get("/user-matches/{user_id}", response_model=List[MatchResponse])
async def get_user_matches(
    user_id: str,
    request: UserMatchesRequest = Depends(),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_matching_db)
):
    """
    Get all matches for a user
    """
    try:
        user, profile = current_user
        current_user_id = user["$id"]

        # Only allow users to access their own matches or admin access
        if user_id != current_user_id:
            # In a production system, check for admin privileges
            raise HTTPException(status_code=403, detail="Access denied")

        # Query matches from database
        query = db.query(MatchingSuggestion).filter(
            (MatchingSuggestion.user1_id == user_id) | 
            (MatchingSuggestion.user2_id == user_id)
        )

        # Apply filters
        if not request.include_expired:
            query = query.filter(
                (MatchingSuggestion.expires_at.is_(None)) |
                (MatchingSuggestion.expires_at > datetime.utcnow())
            )

        if request.status_filter:
            query = query.filter(MatchingSuggestion.status == request.status_filter)

        # Order by score and limit
        matches = query.order_by(
            MatchingSuggestion.overall_score.desc(),
            MatchingSuggestion.created_at.desc()
        ).limit(request.max_matches).all()

        # Convert to response format
        response_matches = []
        for match in matches:
            # Load additional details
            item1_details = await load_item_details(match.item1_id)
            item2_details = await load_item_details(match.item2_id)
            
            # Determine matched user
            matched_user_id = match.user2_id if match.user1_id == user_id else match.user1_id
            matched_user = await load_user_profile(matched_user_id)

            response_matches.append(MatchResponse(
                id=match.id,
                user1_id=match.user1_id,
                user2_id=match.user2_id,
                item1_id=match.item1_id,
                item2_id=match.item2_id,
                item1_details=item1_details,
                item2_details=item2_details,
                matched_user=matched_user,
                overall_score=match.overall_score,
                value_score=match.value_compatibility_score,
                geographic_score=match.geographic_score,
                category_score=match.category_score,
                ai_reasoning=match.ai_reasoning,
                confidence_level=match.confidence_level,
                distance_km=match.distance_km,
                value_difference_percentage=match.value_difference_percentage,
                status=match.status,
                created_at=match.created_at,
                expires_at=match.expires_at
            ))

        return response_matches

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get matches")


@router.post("/accept-match")
async def accept_match(
    request: AcceptMatchRequest,
    background_tasks: BackgroundTasks,
    user_profile=Depends(get_current_user),
    db: Session = Depends(get_matching_db)
):
    """
    Accept a match suggestion and initiate trade communication
    """
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Get match suggestion
        match = db.query(MatchingSuggestion).filter(
            MatchingSuggestion.id == request.match_id,
            (MatchingSuggestion.user1_id == user_id) | 
            (MatchingSuggestion.user2_id == user_id)
        ).first()

        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        if match.status != "pending":
            raise HTTPException(status_code=400, detail="Match is no longer available")

        # Update match status
        match.status = "accepted"
        match.updated_at = datetime.utcnow()

        # Record interaction in history
        history_entry = MatchingHistory(
            match_suggestion_id=match.id,
            user_id=user_id,
            action="accepted",
            feedback_rating=None,  # Could be added later
            user_session_data={}
        )
        db.add(history_entry)

        # Create initial message/trade proposal
        other_user_id = match.user2_id if match.user1_id == user_id else match.user1_id
        
        # Default message if none provided
        if not request.message:
            request.message = f"Hi! I'm interested in trading based on our AI match. Let's discuss!"

        # Create message through Appwrite
        message_result = await appwrite_db.create_message({
            "sender_id": user_id,
            "recipient_id": other_user_id,
            "content": request.message,
            "match_id": match.id
        })

        # Create trade proposal if meetup details provided
        trade_data = None
        if request.propose_meetup and request.meetup_details:
            trade_result = await appwrite_db.create_trade({
                "user1_id": match.user1_id,
                "user2_id": match.user2_id,
                "item1_id": match.item1_id,
                "item2_id": match.item2_id,
                "status": "proposed",
                "meeting_details": request.meetup_details,
                "proposed_by": user_id
            })
            
            if trade_result.get("success"):
                trade_data = trade_result["trade"]

        db.commit()

        # Send real-time notifications
        background_tasks.add_task(
            send_match_acceptance_notifications,
            user_id,
            other_user_id,
            match.id,
            message_result.get("message") if message_result.get("success") else None
        )

        # Run ML learning update in background
        background_tasks.add_task(update_ml_learning, user_id, match.id, "accepted")

        return {
            "success": True,
            "message": "Match accepted successfully",
            "match_id": match.id,
            "conversation": {
                "recipient_id": other_user_id,
                "message": message_result.get("message") if message_result.get("success") else None
            },
            "trade": trade_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting match: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to accept match")


@router.post("/decline-match")
async def decline_match(
    request: DeclineMatchRequest,
    background_tasks: BackgroundTasks,
    user_profile=Depends(get_current_user),
    db: Session = Depends(get_matching_db)
):
    """
    Decline a match suggestion with feedback for ML learning
    """
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Get match suggestion
        match = db.query(MatchingSuggestion).filter(
            MatchingSuggestion.id == request.match_id,
            (MatchingSuggestion.user1_id == user_id) | 
            (MatchingSuggestion.user2_id == user_id)
        ).first()

        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        if match.status != "pending":
            raise HTTPException(status_code=400, detail="Match is no longer available")

        # Update match status
        match.status = "declined"
        match.updated_at = datetime.utcnow()

        # Record detailed feedback in history
        history_entry = MatchingHistory(
            match_suggestion_id=match.id,
            user_id=user_id,
            action="declined",
            decline_reason=request.reason,
            feedback_text=request.feedback
        )
        db.add(history_entry)

        # Update user preferences if requested to block similar matches
        if request.block_similar:
            await update_preferences_from_decline(user_id, match, request.reason, db)

        db.commit()

        # Update ML learning in background
        background_tasks.add_task(
            update_ml_learning, 
            user_id, 
            match.id, 
            "declined",
            {"reason": request.reason, "feedback": request.feedback}
        )

        return {
            "success": True,
            "message": "Match declined successfully",
            "match_id": match.id,
            "learned_preferences": request.block_similar
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error declining match: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to decline match")


@router.get("/matching-preferences", response_model=PreferencesResponse)
async def get_matching_preferences(
    user_profile=Depends(get_current_user),
    db: Session = Depends(get_matching_db)
):
    """
    Get user's matching preferences
    """
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Get or create preferences
        preferences = db.query(MatchingPreference).filter(
            MatchingPreference.user_id == user_id
        ).first()

        if not preferences:
            preferences = init_user_matching_preferences(user_id, db)

        return PreferencesResponse(
            user_id=preferences.user_id,
            max_distance_km=preferences.max_distance_km,
            preferred_categories=preferences.preferred_categories or [],
            excluded_categories=preferences.excluded_categories or [],
            max_value_difference_percent=preferences.max_value_difference_percent,
            min_item_value=preferences.min_item_value,
            max_item_value=preferences.max_item_value,
            enable_ai_matching=preferences.enable_ai_matching,
            notification_frequency=preferences.notification_frequency,
            auto_decline_low_scores=preferences.auto_decline_low_scores,
            min_auto_decline_score=preferences.min_auto_decline_score,
            learn_from_interactions=preferences.learn_from_interactions,
            created_at=preferences.created_at,
            updated_at=preferences.updated_at
        )

    except Exception as e:
        logger.error(f"Error getting preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get preferences")


@router.put("/matching-preferences", response_model=PreferencesResponse)
async def update_matching_preferences(
    request: UpdatePreferencesRequest,
    user_profile=Depends(get_current_user),
    db: Session = Depends(get_matching_db)
):
    """
    Update user's matching preferences
    """
    try:
        user, profile = user_profile
        user_id = user["$id"]

        # Get or create preferences
        preferences = db.query(MatchingPreference).filter(
            MatchingPreference.user_id == user_id
        ).first()

        if not preferences:
            preferences = init_user_matching_preferences(user_id, db)

        # Update fields that are provided
        update_data = request.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(preferences, field, value)

        preferences.updated_at = datetime.utcnow()
        db.commit()

        return PreferencesResponse(
            user_id=preferences.user_id,
            max_distance_km=preferences.max_distance_km,
            preferred_categories=preferences.preferred_categories or [],
            excluded_categories=preferences.excluded_categories or [],
            max_value_difference_percent=preferences.max_value_difference_percent,
            min_item_value=preferences.min_item_value,
            max_item_value=preferences.max_item_value,
            enable_ai_matching=preferences.enable_ai_matching,
            notification_frequency=preferences.notification_frequency,
            auto_decline_low_scores=preferences.auto_decline_low_scores,
            min_auto_decline_score=preferences.min_auto_decline_score,
            learn_from_interactions=preferences.learn_from_interactions,
            created_at=preferences.created_at,
            updated_at=preferences.updated_at
        )

    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update preferences")


# Background task functions
async def send_match_notifications(current_user_id: str, matched_user_ids: List[str]):
    """Send real-time notifications about new matches"""
    try:
        for matched_user_id in matched_user_ids:
            appwrite_realtime.broadcast_user_notification(
                matched_user_id, 
                "new_match", 
                {
                    "from_user_id": current_user_id,
                    "message": "You have a new AI-powered match!"
                }
            )
        logger.info(f"Sent match notifications to {len(matched_user_ids)} users")
    except Exception as e:
        logger.error(f"Failed to send match notifications: {e}")


async def send_match_acceptance_notifications(
    accepting_user_id: str, 
    other_user_id: str, 
    match_id: int, 
    message: Optional[Dict]
):
    """Send notifications when a match is accepted"""
    try:
        appwrite_realtime.broadcast_user_notification(
            other_user_id,
            "match_accepted",
            {
                "from_user_id": accepting_user_id,
                "match_id": match_id,
                "message": "Someone accepted your match! Check your messages.",
                "conversation_id": message.get("$id") if message else None
            }
        )
        logger.info(f"Sent match acceptance notification to user {other_user_id}")
    except Exception as e:
        logger.error(f"Failed to send acceptance notification: {e}")


async def update_ml_learning(user_id: str, match_id: int, action: str, 
                           feedback: Optional[Dict] = None):
    """Update ML models based on user interactions"""
    try:
        # This would update the ML models with user interaction data
        # For now, just log the learning data
        logger.info(f"ML Learning Update: User {user_id}, Match {match_id}, Action {action}")
        if feedback:
            logger.info(f"Feedback: {feedback}")
        
        # In production, this would:
        # 1. Update feature weights based on user actions
        # 2. Retrain models periodically
        # 3. Adjust matching algorithms for better accuracy
        
    except Exception as e:
        logger.error(f"ML learning update failed: {e}")


async def update_preferences_from_decline(user_id: str, match: MatchingSuggestion, 
                                        reason: str, db: Session):
    """Update user preferences based on decline reason"""
    try:
        preferences = db.query(MatchingPreference).filter(
            MatchingPreference.user_id == user_id
        ).first()
        
        if not preferences:
            return
        
        # Adjust preferences based on decline reason
        if reason == "location" and match.distance_km:
            # Reduce max distance if location was the issue
            new_distance = max(preferences.max_distance_km * 0.8, match.distance_km * 0.9)
            preferences.max_distance_km = new_distance
        
        elif reason == "value" and match.value_difference_percentage:
            # Reduce value difference tolerance
            new_tolerance = max(
                preferences.max_value_difference_percent * 0.9,
                match.value_difference_percentage * 0.8
            )
            preferences.max_value_difference_percent = new_tolerance
        
        elif reason == "category":
            # Add category to excluded list
            excluded = preferences.excluded_categories or []
            # This would need item details to get the actual category
            # For now, just update the timestamp to indicate learning occurred
            pass
        
        preferences.updated_at = datetime.utcnow()
        
    except Exception as e:
        logger.error(f"Failed to update preferences from decline: {e}")


# Export the router
def get_matching_router():
    return router