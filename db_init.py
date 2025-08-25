#!/usr/bin/env python3
"""
Trading Post Database Initialization Script
A comprehensive database setup for a trading app that matches users by items/services.
Supports PostgreSQL with PostGIS for production and SQLite for local development.

Usage:
    python db_init.py --migrate --seed
"""

import os
import sys
import logging
import argparse
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    ForeignKey,
    DateTime,
    CheckConstraint,
    UniqueConstraint,
    Index,
    event,
    DDL,
    func,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, Session, backref
from sqlalchemy.exc import IntegrityError
from alembic.config import Config
from alembic import command

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Database URL from environment variable
DB_URL = os.environ.get("DB_URL", "sqlite:///local.db")
IS_SQLITE = DB_URL.startswith("sqlite://")

Base = declarative_base()

# Custom types for SQLite compatibility
if IS_SQLITE:
    from sqlalchemy import String as ArrayType

    def array_to_string(value):
        if value is None:
            return None
        return ",".join(map(str, value))

    def string_to_array(value):
        if value is None or value == "":
            return []
        return list(map(int, value.split(",")))

else:
    from sqlalchemy.dialects.postgresql import ARRAY as ArrayType


class User(Base):
    """User model representing trading app users with location and preferences."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    age = Column(Integer, CheckConstraint("age > 18"), nullable=False)
    location_lat = Column(Float, CheckConstraint("location_lat >= -90 AND location_lat <= 90"))
    location_lon = Column(Float, CheckConstraint("location_lon >= -180 AND location_lon <= 180"))
    bio = Column(Text)
    opt_in_inferences = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    listings = relationship("Listing", back_populates="user", cascade="all, delete-orphan")
    inferences = relationship("Inference", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


class Listing(Base):
    """Listing model for items, services, or tasks users want to buy/sell."""

    __tablename__ = "listings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(
        String(50),
        CheckConstraint("type IN ('service', 'item', 'task')"),
        nullable=False,
    )
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    is_selling = Column(Boolean, nullable=False)
    price = Column(Float, CheckConstraint("price >= 0"))
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="listings")

    def __repr__(self):
        action = "selling" if self.is_selling else "buying"
        return f"<Listing(id={self.id}, {action} {self.type}: {self.category})>"


class Match(Base):
    """Match model representing AI-suggested matches between users."""

    __tablename__ = "matches"

    id = Column(Integer, primary_key=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_ids = Column(ArrayType(Integer) if not IS_SQLITE else String(255))
    ai_reason = Column(Text)
    score = Column(Float, CheckConstraint("score >= 0 AND score <= 1"))
    status = Column(String(50), default="proposed")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user1 = relationship(
        "User",
        foreign_keys=[user1_id],
        backref=backref("matches_as_user1", cascade="all, delete-orphan"),
    )
    user2 = relationship(
        "User",
        foreign_keys=[user2_id],
        backref=backref("matches_as_user2", cascade="all, delete-orphan"),
    )

    # Unique constraint on user pairs
    __table_args__ = (UniqueConstraint("user1_id", "user2_id", name="unique_user_pair"),)

    def __repr__(self):
        return f"<Match(id={self.id}, user1={self.user1_id}, user2={self.user2_id}, score={self.score})>"


class Inference(Base):
    """Inference model for AI-inferred user needs and preferences."""

    __tablename__ = "inferences"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inferred_need = Column(String(255), nullable=False)
    confidence = Column(Float, CheckConstraint("confidence >= 0 AND confidence <= 1"))
    source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="inferences")

    def __repr__(self):
        return (
            f"<Inference(id={self.id}, user={self.user_id}, need='{self.inferred_need}', confidence={self.confidence})>"
        )


# Create indexes
if not IS_SQLITE:
    # PostGIS spatial index for user locations
    Index(
        "idx_user_location",
        func.point(User.location_lat, User.location_lon),
        postgresql_using="gist",
    )

# Regular indexes
Index("idx_listing_user", Listing.user_id)
Index("idx_listing_status", Listing.status)
Index("idx_match_users", Match.user1_id, Match.user2_id)
Index("idx_inference_user", Inference.user_id)


# Update timestamp trigger for PostgreSQL
if not IS_SQLITE:
    update_timestamp_trigger = DDL(
        """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """
    )

    for table in ["users", "listings", "matches", "inferences"]:
        trigger = DDL(
            f"""
        CREATE TRIGGER update_{table}_updated_at BEFORE UPDATE ON {table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        )
        event.listen(Base.metadata, "after_create", trigger.execute_if(dialect="postgresql"))

    event.listen(
        Base.metadata,
        "after_create",
        update_timestamp_trigger.execute_if(dialect="postgresql"),
    )


# Query functions
def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    """Get a user by their ID."""
    return session.query(User).filter(User.id == user_id).first()


def get_listings_by_user(session: Session, user_id: int) -> List[Listing]:
    """Get all listings for a specific user."""
    return session.query(Listing).filter(Listing.user_id == user_id).all()


def get_active_listings(session: Session) -> List[Listing]:
    """Get all active listings."""
    return session.query(Listing).filter(Listing.status == "active").all()


def get_matches_for_user(session: Session, user_id: int) -> List[Match]:
    """Get all matches involving a specific user."""
    return session.query(Match).filter((Match.user1_id == user_id) | (Match.user2_id == user_id)).all()


# Validation functions
def validate_user_age(age: int) -> bool:
    """Validate that user is over 18."""
    return age > 18


def validate_location(lat: float, lon: float) -> bool:
    """Validate that coordinates are within valid ranges."""
    return -90 <= lat <= 90 and -180 <= lon <= 180


# Seeding functions
def seed_data(session: Session) -> None:
    """Seed the database with sample data."""
    logger.info("Seeding database with sample data...")

    try:
        # Create users
        frank = User(
            username="frank",
            password_hash="hashed_password_frank",  # In production, use proper hashing
            age=35,
            location_lat=40.7,
            location_lon=-74.0,
            bio="Busy professional",
            opt_in_inferences=True,
        )

        bill = User(
            username="bill",
            password_hash="hashed_password_bill",
            age=60,
            location_lat=40.71,
            location_lon=-74.01,
            bio="Retired pet lover",
            opt_in_inferences=True,
        )

        session.add_all([frank, bill])
        session.commit()

        # Frank's listings
        frank_listings = [
            Listing(
                user_id=frank.id,
                type="service",
                category="medical",
                description="GP consultations",
                is_selling=True,
                price=100.0,
            ),
            Listing(
                user_id=frank.id,
                type="service",
                category="pet care",
                description="Need weekly grooming",
                is_selling=False,
                price=50.0,
            ),
        ]

        # Bill's listings
        bill_listings = [
            Listing(
                user_id=bill.id,
                type="service",
                category="pet care",
                description="Experienced groomer",
                is_selling=True,
                price=40.0,
            ),
            Listing(
                user_id=bill.id,
                type="service",
                category="home",
                description="Weekly lawn mowing service",
                is_selling=True,
                price=30.0,
            ),
            Listing(
                user_id=bill.id,
                type="service",
                category="medical",
                description="Routine medical checkup visits",
                is_selling=False,
                price=80.0,
            ),
            # Additional varied listings for testing
            Listing(
                user_id=bill.id,
                type="item",
                category="tools",
                description="Power drill for rent",
                is_selling=True,
                price=15.0,
            ),
            Listing(
                user_id=bill.id,
                type="task",
                category="errands",
                description="Need someone to pick up groceries",
                is_selling=False,
                price=20.0,
            ),
            Listing(
                user_id=bill.id,
                type="item",
                category="furniture",
                description="Looking for used office chair",
                is_selling=False,
                price=50.0,
            ),
        ]

        session.add_all(frank_listings + bill_listings)
        session.commit()

        # Create a match between Frank and Bill
        listing_ids = [frank_listings[1].id, bill_listings[0].id]  # Dog grooming match
        if IS_SQLITE:
            listing_ids_str = array_to_string(listing_ids)
        else:
            listing_ids_str = listing_ids

        match = Match(
            user1_id=frank.id,
            user2_id=bill.id,
            listing_ids=listing_ids_str,
            ai_reason="Frank needs dog grooming services and Bill offers them at a competitive price. They are located very close to each other.",
            score=0.95,
        )

        session.add(match)

        # Create inferences
        inferences = [
            Inference(
                user_id=frank.id,
                inferred_need="time-saving services",
                confidence=0.85,
                source="bio_analysis",
            ),
            Inference(
                user_id=bill.id,
                inferred_need="health services",
                confidence=0.75,
                source="age_demographic",
            ),
        ]

        session.add_all(inferences)
        session.commit()

        logger.info("Sample data seeded successfully!")

    except IntegrityError as e:
        session.rollback()
        logger.error(f"Error seeding data: {e}")
        raise


# Database initialization
def init_db(migrate: bool = False) -> None:
    """Initialize the database, optionally running migrations."""
    engine = create_engine(DB_URL, echo=False)

    if migrate:
        logger.info("Running database migrations...")
        # Initialize Alembic
        alembic_cfg = Config()
        alembic_cfg.set_main_option("script_location", "alembic")
        alembic_cfg.set_main_option("sqlalchemy.url", DB_URL)

        try:
            # Create alembic directory if it doesn't exist
            os.makedirs("alembic", exist_ok=True)

            # Initialize alembic if not already done
            if not os.path.exists("alembic/alembic.ini"):
                command.init(alembic_cfg, "alembic")

            # Generate migration
            command.revision(alembic_cfg, autogenerate=True, message="Initial migration")

            # Run migration
            command.upgrade(alembic_cfg, "head")

            logger.info("Migrations completed successfully!")
        except Exception as e:
            logger.warning(f"Migration failed, falling back to create_all: {e}")
            Base.metadata.create_all(engine)
    else:
        Base.metadata.create_all(engine)

    return engine


# Main execution
def main():
    """Main function to run database initialization and seeding."""
    parser = argparse.ArgumentParser(description="Initialize Trading Post database")
    parser.add_argument("--migrate", action="store_true", help="Run database migrations")
    parser.add_argument("--seed", action="store_true", help="Seed sample data")

    args = parser.parse_args()

    logger.info(f"Initializing database with URL: {DB_URL}")
    logger.info(f"Using {'SQLite' if IS_SQLITE else 'PostgreSQL'} backend")

    try:
        # Initialize database
        engine = init_db(migrate=args.migrate)

        # Seed data if requested
        if args.seed:
            SessionLocal = sessionmaker(bind=engine)
            session = SessionLocal()
            try:
                seed_data(session)
            finally:
                session.close()

        logger.info("Database initialization completed successfully!")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)


# Unit tests
def run_tests():
    """Run unit tests for database operations."""

    # Remove old test database if exists
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
        except BaseException:
            pass

    # Create test database
    test_engine = create_engine("sqlite:///test.db")
    Base.metadata.create_all(test_engine)
    TestSession = sessionmaker(bind=test_engine)

    def test_seeding():
        """Test database seeding."""
        session = TestSession()
        try:
            seed_data(session)

            # Check users were created
            users = session.query(User).all()
            assert len(users) == 2

            frank = session.query(User).filter_by(username="frank").first()
            assert frank is not None
            assert frank.age == 35

            # Check listings
            frank_listings = get_listings_by_user(session, frank.id)
            assert len(frank_listings) == 2

        finally:
            session.close()

    def test_query():
        """Test query functions."""
        session = TestSession()
        try:
            # Get user by ID
            user = get_user_by_id(session, 1)
            assert user is not None
            assert user.username == "frank"

            # Get active listings
            active_listings = get_active_listings(session)
            assert len(active_listings) > 0

        finally:
            session.close()

    def test_validation_fail():
        """Test validation functions."""
        # Test age validation
        assert validate_user_age(25)
        assert validate_user_age(17) is False

        # Test location validation
        assert validate_location(40.7, -74.0)
        assert validate_location(91, -74.0) is False
        assert validate_location(40.7, -181) is False

    # Run tests
    test_seeding()
    test_query()
    test_validation_fail()

    # Cleanup
    test_engine.dispose()  # Close all connections
    try:
        os.remove("test.db")
    except PermissionError:
        logger.warning("Could not remove test.db - file may be in use")

    logger.info("All tests passed!")


if __name__ == "__main__":
    # Check if running tests
    if "--test" in sys.argv:
        run_tests()
    else:
        main()
