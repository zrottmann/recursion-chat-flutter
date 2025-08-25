"""
Firebase Authentication Module for Trading Post
Provides SSO (Single Sign-On) with Google, Facebook, and Email
"""

import os
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

# Configure logging
logger = logging.getLogger(__name__)

# JWT Configuration with security validation
import secrets

def validate_jwt_secret():
    """Validate JWT secret key configuration for security"""
    secret = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
    
    if not secret:
        logger.warning("No JWT secret key found in environment variables!")
        logger.warning("Generating temporary key for development. Set JWT_SECRET_KEY or SECRET_KEY for production!")
        return secrets.token_urlsafe(32)
    
    if secret == "your-secret-key-change-this-in-production":
        logger.error("SECURITY RISK: Default JWT secret detected!")
        logger.error("Set a secure JWT_SECRET_KEY environment variable immediately!")
        raise ValueError("Default JWT secret is not allowed for security reasons")
    
    if len(secret) < 32:
        logger.error(f"SECURITY RISK: JWT secret too short ({len(secret)} chars)!")
        logger.error("JWT secret must be at least 32 characters for security")
        raise ValueError("JWT secret must be at least 32 characters long")
    
    return secret

SECRET_KEY = validate_jwt_secret()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


# Firebase Admin SDK initialization
@lru_cache()
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    try:
        # Check if already initialized
        if len(firebase_admin._apps) > 0:
            return firebase_admin.get_app()

        # Initialize from environment variable or file
        firebase_config = os.getenv("FIREBASE_ADMIN_CONFIG")

        if firebase_config:
            # Parse from environment variable (JSON string)
            cred_dict = json.loads(firebase_config)
            cred = credentials.Certificate(cred_dict)
        else:
            # Load from file
            config_path = os.getenv("FIREBASE_CONFIG_PATH", "firebase-adminsdk.json")
            if not os.path.exists(config_path):
                logger.warning("Firebase config file not found. SSO features will be disabled.")
                return None
            cred = credentials.Certificate(config_path)

        # Initialize Firebase app
        firebase_app = firebase_admin.initialize_app(
            cred, {"storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "trading-post.appspot.com")}
        )

        logger.info("Firebase Admin SDK initialized successfully")
        return firebase_app

    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {str(e)}")
        return None


# Pydantic models
class FirebaseSignInRequest(BaseModel):
    """Request model for Firebase sign-in"""

    id_token: str
    provider: Optional[str] = "firebase"


class FirebaseSignUpRequest(BaseModel):
    """Request model for Firebase sign-up"""

    email: EmailStr
    password: str
    display_name: Optional[str] = None
    phone_number: Optional[str] = None


class FirebaseUserResponse(BaseModel):
    """Response model for Firebase user data"""

    uid: str
    email: Optional[str]
    email_verified: bool
    display_name: Optional[str]
    photo_url: Optional[str]
    phone_number: Optional[str]
    provider_id: str
    created_at: Optional[datetime]
    last_login: Optional[datetime]
    custom_claims: Optional[Dict[str, Any]]


class TokenResponse(BaseModel):
    """Response model for JWT tokens"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60


# Security
security = HTTPBearer()


class FirebaseAuth:
    """Firebase Authentication handler"""

    def __init__(self):
        self.app = initialize_firebase()
        self.db = firestore.client() if self.app else None

    async def verify_id_token(self, id_token: str) -> Dict[str, Any]:
        """Verify Firebase ID token and return user data"""
        if not self.app:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firebase authentication is not configured"
            )

        try:
            # Verify the ID token
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except auth.InvalidIdTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ID token")
        except auth.ExpiredIdTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID token has expired")
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token verification failed")

    async def get_user_by_uid(self, uid: str) -> auth.UserRecord:
        """Get Firebase user by UID"""
        if not self.app:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firebase authentication is not configured"
            )

        try:
            return auth.get_user(uid)
        except auth.UserNotFoundError:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        except Exception as e:
            logger.error(f"Error fetching user: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch user data")

    async def create_user(self, email: str, password: str, **kwargs) -> auth.UserRecord:
        """Create a new Firebase user"""
        if not self.app:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firebase authentication is not configured"
            )

        try:
            user = auth.create_user(email=email, password=password, email_verified=False, **kwargs)

            # Send email verification
            link = auth.generate_email_verification_link(email)
            # TODO: Send email with the link

            return user
        except auth.EmailAlreadyExistsError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")

    async def update_user_claims(self, uid: str, claims: Dict[str, Any]) -> None:
        """Update custom claims for a user"""
        if not self.app:
            return

        try:
            auth.set_custom_user_claims(uid, claims)
        except Exception as e:
            logger.error(f"Error updating user claims: {str(e)}")

    async def delete_user(self, uid: str) -> None:
        """Delete a Firebase user"""
        if not self.app:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firebase authentication is not configured"
            )

        try:
            auth.delete_user(uid)
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete user")

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: dict):
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    async def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    async def store_user_in_db(self, user_data: Dict[str, Any]) -> None:
        """Store or update user data in Firestore"""
        if not self.db:
            return

        try:
            user_ref = self.db.collection("users").document(user_data["uid"])
            user_ref.set(
                {
                    "email": user_data.get("email"),
                    "displayName": user_data.get("display_name"),
                    "photoURL": user_data.get("photo_url"),
                    "phoneNumber": user_data.get("phone_number"),
                    "emailVerified": user_data.get("email_verified", False),
                    "lastLogin": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                },
                merge=True,
            )
        except Exception as e:
            logger.error(f"Error storing user in database: {str(e)}")


# Dependency injection
firebase_auth = FirebaseAuth()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    try:
        payload = await firebase_auth.verify_jwt_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        return payload
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")


async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# Firebase Authentication Routes for FastAPI
from fastapi import APIRouter

router = APIRouter(prefix="/api/auth/firebase", tags=["Firebase Auth"])


@router.post("/signin", response_model=TokenResponse)
async def firebase_signin(request: FirebaseSignInRequest):
    """Sign in with Firebase ID token"""
    try:
        # Verify Firebase ID token
        user_data = await firebase_auth.verify_id_token(request.id_token)

        # Get user details
        user = await firebase_auth.get_user_by_uid(user_data["uid"])

        # Create JWT tokens
        token_data = {
            "sub": user.uid,
            "email": user.email,
            "email_verified": user.email_verified,
            "provider": request.provider,
        }

        access_token = firebase_auth.create_access_token(token_data)
        refresh_token = firebase_auth.create_refresh_token({"sub": user.uid})

        # Store/update user in database
        await firebase_auth.store_user_in_db(
            {
                "uid": user.uid,
                "email": user.email,
                "email_verified": user.email_verified,
                "display_name": user.display_name,
                "photo_url": user.photo_url,
                "phone_number": user.phone_number,
            }
        )

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sign-in error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sign-in failed")


@router.post("/signup", response_model=TokenResponse)
async def firebase_signup(request: FirebaseSignUpRequest):
    """Sign up with email and password"""
    try:
        # Create Firebase user
        user = await firebase_auth.create_user(
            email=request.email,
            password=request.password,
            display_name=request.display_name,
            phone_number=request.phone_number,
        )

        # Create JWT tokens
        token_data = {"sub": user.uid, "email": user.email, "email_verified": False, "provider": "email"}

        access_token = firebase_auth.create_access_token(token_data)
        refresh_token = firebase_auth.create_refresh_token({"sub": user.uid})

        # Store user in database
        await firebase_auth.store_user_in_db(
            {
                "uid": user.uid,
                "email": user.email,
                "email_verified": False,
                "display_name": request.display_name,
                "phone_number": request.phone_number,
            }
        )

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sign-up error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sign-up failed")


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """Refresh access token using refresh token"""
    try:
        payload = await firebase_auth.verify_jwt_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        # Get user data
        user = await firebase_auth.get_user_by_uid(payload["sub"])

        # Create new access token
        token_data = {"sub": user.uid, "email": user.email, "email_verified": user.email_verified}

        new_access_token = firebase_auth.create_access_token(token_data)

        return TokenResponse(access_token=new_access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")


@router.get("/user", response_model=FirebaseUserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    try:
        user = await firebase_auth.get_user_by_uid(current_user["sub"])

        return FirebaseUserResponse(
            uid=user.uid,
            email=user.email,
            email_verified=user.email_verified,
            display_name=user.display_name,
            photo_url=user.photo_url,
            phone_number=user.phone_number,
            provider_id=user.provider_id or "firebase",
            created_at=(
                datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000) if user.user_metadata else None
            ),
            last_login=(
                datetime.fromtimestamp(user.user_metadata.last_sign_in_timestamp / 1000) if user.user_metadata else None
            ),
            custom_claims=user.custom_claims,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch user information"
        )


@router.delete("/user")
async def delete_user_account(current_user: dict = Depends(get_current_user)):
    """Delete current user account"""
    try:
        await firebase_auth.delete_user(current_user["sub"])
        return {"message": "User account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete user account")
