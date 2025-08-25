"""
AI Matching and Inference System for Trading App
Matches users by trade compatibility using Grok API and local ML
"""

import requests
import json
import os
import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.exc import SQLAlchemyError
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
GROK_API_KEY = os.getenv("GROK_API_KEY", "local_test_key")
API_URL = os.getenv("API_URL", "https://api.x.ai/v1/chat/completions")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///trading_post.db")
USE_MOCK_API = os.getenv("USE_MOCK_API", "true").lower() == "true"

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    age = Column(Integer)
    location = Column(String)
    bio = Column(Text)
    opt_in_ai = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship("Listing", back_populates="user")
    inferences = relationship("Inference", back_populates="user")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    type = Column(String)  # 'offer' or 'need'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="listings")


class Inference(Base):
    __tablename__ = "inferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    inferred_need = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    source = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="inferences")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"))
    user2_id = Column(Integer, ForeignKey("users.id"))
    listing1_id = Column(Integer, ForeignKey("listings.id"))
    listing2_id = Column(Integer, ForeignKey("listings.id"))
    ai_reason = Column(Text)
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI router
router = APIRouter(prefix="/api", tags=["matching"])


# Request/Response models
class MatchGroupRequest(BaseModel):
    group_id: Optional[str] = None
    user_id: Optional[int] = None
    radius: Optional[float] = 10.0
    use_inferences: Optional[bool] = True


class InferredNeed(BaseModel):
    inferred_need: str
    confidence: float
    source: str


class MatchResult(BaseModel):
    user1_id: int
    user2_id: int
    listings: List[Dict]
    ai_reason: str
    score: float


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Mock Grok API for local development
def mock_grok_api(prompt: str) -> Dict:
    """Mock Grok API response for local testing"""
    logger.info("Using mock Grok API")

    # Extract user data from prompt for realistic mocking
    if "medical" in prompt.lower():
        return {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            [
                                {
                                    "user1_id": 1,
                                    "user2_id": 2,
                                    "reason": (
                                        "Frank offers medical consultation "
                                        "services which matches Bill's "
                                        "inferred need for medical assistance"
                                    ),
                                    "score": 0.95,
                                }
                            ]
                        )
                    }
                }
            ]
        }

    return {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        [
                            {
                                "user1_id": 1,
                                "user2_id": 2,
                                "reason": ("Compatible trading interests based " "on listings"),
                                "score": 0.85,
                            }
                        ]
                    )
                }
            }
        ]
    }


def infer_needs(user: Dict, db: Session) -> List[Dict]:
    """
    Hybrid approach to infer user needs from demographics, bio, and listings
    Uses both rule-based logic and ML (TF-IDF) analysis
    """
    inferences = []

    # Skip if user hasn't opted in
    if not user.get("opt_in_ai", True):
        return inferences

    # Rule-based inferences
    age = user.get("age", 0)
    bio = user.get("bio", "").lower()
    user.get("location", "").lower()

    # Age-based rules
    if age > 55:
        inferences.append(
            {
                "inferred_need": "medical assistance",
                "confidence": 0.8,
                "source": "age_rule",
            }
        )
        inferences.append(
            {
                "inferred_need": "home maintenance",
                "confidence": 0.7,
                "source": "age_rule",
            }
        )

    if age < 25:
        inferences.append({"inferred_need": "tutoring", "confidence": 0.6, "source": "age_rule"})

    # Bio keyword analysis
    bio_keywords = {
        "pet": ["pet grooming", "pet sitting", "veterinary care"],
        "child": ["childcare", "tutoring", "kids activities"],
        "garden": ["landscaping", "gardening tools", "plant care"],
        "car": ["auto repair", "car washing", "ride sharing"],
        "tech": ["computer repair", "tech support", "programming help"],
        "health": ["fitness training", "nutrition advice", "medical consultation"],
    }

    for keyword, needs in bio_keywords.items():
        if keyword in bio:
            for need in needs:
                inferences.append({"inferred_need": need, "confidence": 0.7, "source": "bio_keyword"})

    # ML-based inference using TF-IDF on listings
    listings = user.get("listings", [])
    if listings:
        # Combine all listing descriptions
        listing_texts = [f"{listing.get('title', '')} {listing.get('description', '')}" for listing in listings]
        combined_text = " ".join(listing_texts)

        # Use TF-IDF to find important terms
        if combined_text.strip():
            try:
                vectorizer = TfidfVectorizer(max_features=10, stop_words="english")
                vectorizer.fit_transform([combined_text])
                feature_names = vectorizer.get_feature_names_out()

                # Infer complementary needs based on offerings
                offering_to_need = {
                    "selling": "buying",
                    "teaching": "learning",
                    "offering": "seeking",
                    "repair": "maintenance",
                    "provide": "require",
                }

                for term in feature_names:
                    for offer_term, need_term in offering_to_need.items():
                        if offer_term in term.lower():
                            inferences.append(
                                {
                                    "inferred_need": term.replace(offer_term, need_term),
                                    "confidence": 0.6,
                                    "source": "ml_tfidf",
                                }
                            )
            except Exception as e:
                logger.error(f"TF-IDF analysis failed: {str(e)}")

    # Store inferences in database
    try:
        for inference in inferences:
            db_inference = Inference(
                user_id=user["id"],
                inferred_need=inference["inferred_need"],
                confidence=inference["confidence"],
                source=inference["source"],
            )
            db.add(db_inference)
        db.commit()
    except SQLAlchemyError as e:
        logger.error(f"Failed to store inferences: {str(e)}")
        db.rollback()

    return inferences


def calculate_listing_similarity(listing1: Dict, listing2: Dict) -> float:
    """Calculate similarity between two listings using cosine similarity"""
    try:
        # Combine title and description
        text1 = f"{listing1.get('title', '')} {listing1.get('description', '')}"
        text2 = f"{listing2.get('title', '')} {listing2.get('description', '')}"

        # Category match boost
        category_boost = 0.2 if listing1.get("category") == listing2.get("category") else 0

        # Type compatibility (offer matches need)
        type_boost = 0.3 if listing1.get("type") != listing2.get("type") else 0

        # Text similarity
        if text1.strip() and text2.strip():
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

            return min(1.0, similarity + category_boost + type_boost)
        else:
            return category_boost + type_boost

    except Exception as e:
        logger.error(f"Similarity calculation failed: {str(e)}")
        return 0.0


def generate_matches(group_users: List[Dict], use_inferences: bool = True, db: Session = None) -> List[Dict]:
    """
    Generate matches using hybrid approach: local similarity + Grok API
    Ensures fairness and avoids bias
    """
    matches = []

    # Filter out users who haven't opted in
    eligible_users = [u for u in group_users if u.get("opt_in_ai", True)]

    if len(eligible_users) < 2:
        logger.warning("Not enough eligible users for matching")
        return matches

    # Local matching using cosine similarity
    user_pairs = []
    for i in range(len(eligible_users)):
        for j in range(i + 1, len(eligible_users)):
            user1, user2 = eligible_users[i], eligible_users[j]

            # Calculate proximity score (if location data available)
            proximity_score = 0.0
            if user1.get("location") and user2.get("location"):
                # Simple location matching (could be enhanced with real
                # geocoding)
                if user1["location"].lower() == user2["location"].lower():
                    proximity_score = 0.2

            # Calculate listing compatibility
            best_match_score = 0.0
            best_listings = []

            for listing1 in user1.get("listings", []):
                for listing2 in user2.get("listings", []):
                    score = calculate_listing_similarity(listing1, listing2)
                    if score > best_match_score:
                        best_match_score = score
                        best_listings = [listing1, listing2]

            # Include inferences if enabled
            if use_inferences and db:
                infer_needs(user1, db)
                user2_inferences = infer_needs(user2, db)

                # Match offers to inferred needs
                for listing in user1.get("listings", []):
                    if listing.get("type") == "offer":
                        for inference in user2_inferences:
                            if inference["inferred_need"].lower() in listing.get("title", "").lower():
                                best_match_score = max(best_match_score, inference["confidence"])

            total_score = best_match_score + proximity_score
            if total_score > 0.3:  # Threshold for viable matches
                user_pairs.append(
                    {
                        "user1": user1,
                        "user2": user2,
                        "local_score": total_score,
                        "listings": best_listings,
                    }
                )

    # Sort by score and take top pairs
    user_pairs.sort(key=lambda x: x["local_score"], reverse=True)

    # Prepare data for Grok API
    if len(user_pairs) > 0:
        # Truncate data to fit token limits (4k chars)
        prompt_data = []
        char_count = 0
        max_chars = 4000

        for pair in user_pairs[:10]:  # Limit to top 10 pairs
            pair_summary = {
                "user1": {
                    "id": pair["user1"]["id"],
                    "age": pair["user1"].get("age"),
                    "bio": pair["user1"].get("bio", "")[:100],
                    "listings": [
                        {"title": listing["title"], "type": listing.get("type")}
                        for listing in pair["user1"].get("listings", [])[:3]
                    ],
                },
                "user2": {
                    "id": pair["user2"]["id"],
                    "age": pair["user2"].get("age"),
                    "bio": pair["user2"].get("bio", "")[:100],
                    "listings": [
                        {"title": listing["title"], "type": listing.get("type")}
                        for listing in pair["user2"].get("listings", [])[:3]
                    ],
                },
            }

            pair_json = json.dumps(pair_summary)
            if char_count + len(pair_json) < max_chars:
                prompt_data.append(pair_summary)
                char_count += len(pair_json)
            else:
                break

        # Build Grok prompt
        prompt = f"""
        You are an AI matchmaker for a local trading/bartering app.
        Match users based on:
        1. Compatible trades/services (one's offer matches other's need)
        2. Inferred needs from age, location, bio if data is limited
        3. Prioritize mutual benefits

        Users to match:
        {json.dumps(prompt_data)}

        Output a JSON list of matched pairs with format:
        [{{
            "user1_id": int,
            "user2_id": int,
            "reason": "string explaining the match",
            "score": float (0-1)
        }}]

        Ensure fairness, avoid bias, and create diverse matches.
        """

        # Call Grok API or mock
        try:
            if USE_MOCK_API or GROK_API_KEY == "local_test_key":
                response = mock_grok_api(prompt)
            else:
                headers = {
                    "Authorization": f"Bearer {GROK_API_KEY}",
                    "Content-Type": "application/json",
                }

                payload = {
                    "model": "grok-beta",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                }

                # Implement retry with exponential backoff
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
                        response.raise_for_status()
                        response = response.json()
                        break
                    except requests.exceptions.RequestException as e:
                        if attempt < max_retries - 1:
                            wait_time = (2**attempt) * 1
                            logger.warning(f"API request failed, retrying in " f"{wait_time}s: {str(e)}")
                            time.sleep(wait_time)
                        else:
                            raise

            # Parse Grok response
            ai_matches = json.loads(response["choices"][0]["message"]["content"])

            # Combine with local matches
            for ai_match in ai_matches:
                # Find corresponding local match data
                local_match = next(
                    (
                        p
                        for p in user_pairs
                        if p["user1"]["id"] == ai_match["user1_id"] and p["user2"]["id"] == ai_match["user2_id"]
                    ),
                    None,
                )

                if local_match:
                    matches.append(
                        {
                            "user1_id": ai_match["user1_id"],
                            "user2_id": ai_match["user2_id"],
                            "listings": local_match["listings"],
                            "ai_reason": ai_match["reason"],
                            "score": (local_match["local_score"] + ai_match["score"]) / 2,
                        }
                    )

        except Exception as e:
            logger.error(f"Grok API call failed: {str(e)}")
            # Fallback to local matches only
            for pair in user_pairs[:5]:
                matches.append(
                    {
                        "user1_id": pair["user1"]["id"],
                        "user2_id": pair["user2"]["id"],
                        "listings": pair["listings"],
                        "ai_reason": (
                            f"Local match based on listing compatibility " f"(score: {pair['local_score']:.2f})"
                        ),
                        "score": pair["local_score"],
                    }
                )

    # Store matches in database
    if db:
        try:
            for match in matches:
                db_match = Match(
                    user1_id=match["user1_id"],
                    user2_id=match["user2_id"],
                    listing1_id=(match["listings"][0].get("id") if match["listings"] else None),
                    listing2_id=(match["listings"][1].get("id") if len(match["listings"]) > 1 else None),
                    ai_reason=match["ai_reason"],
                    score=match["score"],
                )
                db.add(db_match)
            db.commit()
        except SQLAlchemyError as e:
            logger.error(f"Failed to store matches: {str(e)}")
            db.rollback()

    return matches


@router.post("/match_group", response_model=List[MatchResult])
async def match_group_endpoint(request: MatchGroupRequest, db: Session = Depends(get_db)):
    """
    Async endpoint to match users within a group or radius
    Handles transactions and sends notifications
    """
    try:
        # Fetch users based on request parameters
        if request.group_id:
            # Mock implementation - would integrate with grouping.py
            logger.info(f"Fetching users for group {request.group_id}")
            # For now, fetch all users
            users = db.query(User).all()
        elif request.user_id and request.radius:
            # Mock radius-based fetching - would use real geocoding
            logger.info(f"Fetching users within {request.radius}km of " f"user {request.user_id}")
            center_user = db.query(User).filter(User.id == request.user_id).first()
            if not center_user:
                raise HTTPException(status_code=404, detail="User not found")

            # For now, fetch all users in same location
            users = db.query(User).filter(User.location == center_user.location).all()
        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide either group_id or user_id with radius",
            )

        # Convert to dicts with listings
        group_users = []
        for user in users:
            user_dict = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "age": user.age,
                "location": user.location,
                "bio": user.bio,
                "opt_in_ai": user.opt_in_ai,
                "listings": [
                    {
                        "id": listing.id,
                        "title": listing.title,
                        "description": listing.description,
                        "category": listing.category,
                        "type": listing.type,
                    }
                    for listing in user.listings
                ],
            }
            group_users.append(user_dict)

        # Generate matches
        matches = await asyncio.to_thread(generate_matches, group_users, request.use_inferences, db)

        # Stub email notifications
        for match in matches:
            logger.info(
                f"Would send email notification for match between users " f"{match['user1_id']} and {match['user2_id']}"
            )

        # Convert to response model
        return [
            MatchResult(
                user1_id=match["user1_id"],
                user2_id=match["user2_id"],
                listings=match["listings"],
                ai_reason=match["ai_reason"],
                score=match["score"],
            )
            for match in matches
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Match group endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Export router for app.py
def get_router():
    return router
