"""
Authentication router with zip code based registration.
"""

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import re
from passlib.context import CryptContext
from datetime import datetime

from zipcode_service import ZipCodeService

router = APIRouter(prefix="/api/users", tags=["auth"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Pydantic models
class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    zipcode: str
    optInLocation: bool = True

    @validator("username")
    def username_alphanumeric(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username must be alphanumeric with underscores only")
        return v

    @validator("password")
    def password_strength(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[@$!%*?&]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @validator("zipcode")
    def validate_zipcode(cls, v):
        # Remove spaces and hyphens
        cleaned = v.replace(" ", "").replace("-", "")
        if not re.match(r"^\d{5}(\d{4})?$", cleaned):
            raise ValueError("Invalid US zip code format")
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    city: Optional[str] = None
    state: Optional[str] = None

    class Config:
        from_attributes = True


# Dependency to get DB session
def get_db():
    # This should be imported from your database module
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine("sqlite:///trading_post.db")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Initialize zip code service
zip_service = ZipCodeService()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user with zip code based location.
    """
    # Check if username or email already exists
    existing_user = db.execute(
        select(User).where((User.username == user_data.username) | (User.email == user_data.email))
    ).scalar_one_or_none()

    if existing_user:
        if existing_user.username == user_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Get location from zip code
    location_info = zip_service.get_location_info(user_data.zipcode)
    if not location_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unrecognized zip code",
        )

    # Create new user
    hashed_password = pwd_context.hash(user_data.password)

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        latitude=location_info["latitude"],
        longitude=location_info["longitude"],
        city=location_info.get("city"),
        state=location_info.get("state"),
        zipcode=user_data.zipcode,
        opt_in_location=user_data.optInLocation,
        created_at=datetime.utcnow(),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        created_at=new_user.created_at,
        city=new_user.city,
        state=new_user.state,
    )


@router.get("/validate-zipcode/{zipcode}")
def validate_zipcode(zipcode: str):
    """
    Validate a US zip code and return location information.
    """
    # Validate format
    if not zip_service.validate_usa_zipcode(zipcode):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid zip code format")

    # Get location info
    location_info = zip_service.get_location_info(zipcode)
    if not location_info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zip code not found")

    return {
        "valid": True,
        "zipcode": location_info["zipcode"],
        "city": location_info.get("city"),
        "state": location_info.get("state"),
        "state_code": location_info.get("state_code"),
    }


# Example User model (adjust to match your actual model)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zipcode = Column(String, nullable=True)
    opt_in_location = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Add relationships as needed
    # listings = relationship("Listing", back_populates="user")
