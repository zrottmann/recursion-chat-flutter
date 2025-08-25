"""
Enhanced AI Matching Database Schema for Trading Post
Integrates with existing Appwrite database and extends matching capabilities
"""

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
    JSON,
    Index,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///trading_post.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MatchingSuggestion(Base):
    """
    Store AI-generated match suggestions between users/items
    """
    __tablename__ = "matching_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Users involved in the match
    user1_id = Column(String, nullable=False, index=True)  # Appwrite user ID
    user2_id = Column(String, nullable=False, index=True)  # Appwrite user ID
    
    # Items/listings involved
    item1_id = Column(String, nullable=False, index=True)  # Appwrite document ID
    item2_id = Column(String, nullable=False, index=True)  # Appwrite document ID
    
    # Matching scores and analysis
    overall_score = Column(Float, nullable=False)  # 0.0 to 1.0
    value_compatibility_score = Column(Float, nullable=False)  # Value matching score
    geographic_score = Column(Float, nullable=False)  # Location proximity score
    category_score = Column(Float, nullable=False)  # Category compatibility
    preference_score = Column(Float, nullable=False)  # User preference alignment
    
    # AI reasoning and metadata
    ai_reasoning = Column(Text, nullable=False)  # Explanation for the match
    confidence_level = Column(Float, nullable=False)  # AI confidence in match
    
    # Value analysis
    item1_estimated_value = Column(Float)  # From AI pricing system
    item2_estimated_value = Column(Float)  # From AI pricing system
    value_difference_percentage = Column(Float)  # % difference in values
    
    # Geographic data
    distance_km = Column(Float)  # Distance between users in km
    location_compatibility = Column(String)  # 'same_city', 'nearby', 'regional', 'distant'
    
    # Status tracking
    status = Column(String, default="pending")  # 'pending', 'viewed', 'accepted', 'declined', 'expired'
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime)  # When match suggestion expires
    
    # Machine learning features
    ml_features = Column(JSON)  # Store feature vector for ML analysis
    
    # Constraints and indexes
    __table_args__ = (
        # Ensure no duplicate matches (order-independent)
        UniqueConstraint('user1_id', 'user2_id', 'item1_id', 'item2_id', name='unique_match_suggestion'),
        CheckConstraint('overall_score >= 0 AND overall_score <= 1', name='check_overall_score'),
        CheckConstraint('confidence_level >= 0 AND confidence_level <= 1', name='check_confidence'),
        Index('idx_matching_suggestions_score_status', 'overall_score', 'status'),
        Index('idx_matching_suggestions_created', 'created_at'),
        Index('idx_matching_suggestions_users', 'user1_id', 'user2_id'),
    )


class MatchingPreference(Base):
    """
    Store user preferences for AI matching
    """
    __tablename__ = "matching_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, unique=True, index=True)  # Appwrite user ID
    
    # Geographic preferences
    max_distance_km = Column(Float, default=50.0)  # Maximum distance for matches
    preferred_locations = Column(JSON)  # List of preferred location names/areas
    
    # Category preferences
    preferred_categories = Column(JSON)  # List of preferred item categories
    excluded_categories = Column(JSON)  # List of categories to exclude
    
    # Value matching preferences
    max_value_difference_percent = Column(Float, default=20.0)  # Max % difference in values
    min_item_value = Column(Float)  # Minimum item value to consider
    max_item_value = Column(Float)  # Maximum item value to consider
    
    # AI and notification preferences
    enable_ai_matching = Column(Boolean, default=True)
    notification_frequency = Column(String, default="daily")  # 'instant', 'daily', 'weekly', 'disabled'
    auto_decline_low_scores = Column(Boolean, default=False)  # Auto-decline matches below threshold
    min_auto_decline_score = Column(Float, default=0.3)  # Score threshold for auto-decline
    
    # Behavioral preferences
    preferred_trade_types = Column(JSON)  # ['direct_swap', 'service_exchange', 'barter_plus_cash']
    communication_style = Column(String, default="messages")  # 'messages', 'phone', 'in_person'
    
    # Learning preferences
    learn_from_interactions = Column(Boolean, default=True)  # Allow ML to learn from behavior
    feedback_frequency = Column(String, default="always")  # 'always', 'sometimes', 'never'
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint('max_value_difference_percent >= 0 AND max_value_difference_percent <= 100', 
                       name='check_value_difference_percent'),
        CheckConstraint('min_auto_decline_score >= 0 AND min_auto_decline_score <= 1', 
                       name='check_auto_decline_score'),
    )


class MatchingHistory(Base):
    """
    Track match interactions for learning and analytics
    """
    __tablename__ = "matching_history"

    id = Column(Integer, primary_key=True, index=True)
    
    # Match reference
    match_suggestion_id = Column(Integer, ForeignKey('matching_suggestions.id'), nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)  # User who performed the action
    
    # Action details
    action = Column(String, nullable=False)  # 'viewed', 'accepted', 'declined', 'expired'
    feedback_rating = Column(Integer)  # 1-5 star rating of match quality
    decline_reason = Column(String)  # Reason for declining: 'location', 'value', 'category', 'other'
    feedback_text = Column(Text)  # Optional user feedback
    
    # Context when action was taken
    user_session_data = Column(JSON)  # Session context for learning
    
    # Outcome tracking
    led_to_trade = Column(Boolean, default=False)  # Did this match result in a trade?
    trade_completion_time = Column(DateTime)  # When trade was completed (if applicable)
    trade_satisfaction_rating = Column(Integer)  # 1-5 rating of completed trade
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    match_suggestion = relationship("MatchingSuggestion")
    
    __table_args__ = (
        CheckConstraint('feedback_rating >= 1 AND feedback_rating <= 5', name='check_feedback_rating'),
        CheckConstraint('trade_satisfaction_rating >= 1 AND trade_satisfaction_rating <= 5', 
                       name='check_trade_satisfaction'),
        Index('idx_matching_history_user_action', 'user_id', 'action'),
        Index('idx_matching_history_outcome', 'led_to_trade'),
    )


class MatchingAnalytics(Base):
    """
    Store aggregated analytics for matching performance
    """
    __tablename__ = "matching_analytics"

    id = Column(Integer, primary_key=True, index=True)
    
    # Time period for analytics
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False, index=True)
    period_type = Column(String, nullable=False)  # 'daily', 'weekly', 'monthly'
    
    # User-specific analytics (optional - for user-level insights)
    user_id = Column(String, index=True)  # Null for global analytics
    
    # Match generation statistics
    total_matches_generated = Column(Integer, default=0)
    total_matches_viewed = Column(Integer, default=0)
    total_matches_accepted = Column(Integer, default=0)
    total_matches_declined = Column(Integer, default=0)
    
    # Performance metrics
    acceptance_rate = Column(Float)  # % of matches that were accepted
    decline_rate = Column(Float)  # % of matches that were declined
    trade_completion_rate = Column(Float)  # % of accepted matches that led to trades
    
    # Quality metrics
    average_match_score = Column(Float)  # Average match scores generated
    average_user_rating = Column(Float)  # Average user feedback ratings
    
    # Category and geographic insights
    top_categories = Column(JSON)  # Most successful matching categories
    distance_success_rates = Column(JSON)  # Success rates by distance ranges
    
    # AI performance
    ai_accuracy = Column(Float)  # How often AI predictions matched user actions
    
    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('period_start', 'period_end', 'period_type', 'user_id', 
                        name='unique_analytics_period'),
        Index('idx_analytics_period_user', 'period_start', 'period_end', 'user_id'),
    )


# Create all tables
def create_matching_tables():
    """Create all matching-related tables"""
    Base.metadata.create_all(bind=engine)


# Helper functions for database operations
def get_matching_db():
    """Get database session for matching operations"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_user_matching_preferences(user_id: str, db_session):
    """Initialize default matching preferences for a new user"""
    existing = db_session.query(MatchingPreference).filter(
        MatchingPreference.user_id == user_id
    ).first()
    
    if not existing:
        preferences = MatchingPreference(
            user_id=user_id,
            max_distance_km=50.0,
            preferred_categories=[],
            excluded_categories=[],
            max_value_difference_percent=20.0,
            enable_ai_matching=True,
            notification_frequency="daily",
            learn_from_interactions=True
        )
        db_session.add(preferences)
        db_session.commit()
        return preferences
    
    return existing


if __name__ == "__main__":
    # Create tables when run directly
    create_matching_tables()
    print("AI Matching database schema created successfully!")