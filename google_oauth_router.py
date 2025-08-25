from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import httpx
import logging
import os
from typing import Optional
import asyncio

# Import auth timeout manager for secure OAuth handling
try:
    from auth_timeout_fixes import oauth_handler, auth_timeout_manager
    TIMEOUT_MANAGER_AVAILABLE = True
    logger.info("✅ Enhanced OAuth timeout handling enabled for Google OAuth")
except ImportError:
    TIMEOUT_MANAGER_AVAILABLE = False
    logger.warning("⚠️ Basic OAuth handling (no timeout protection) for Google OAuth")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["oauth"])

# These will be set when the router is initialized
get_db = None
User = None
SECRET_KEY = None
ALGORITHM = None
create_access_token = None


def init_oauth_router(db_dependency, user_model, secret_key, algorithm, token_creator):
    """Initialize OAuth router with dependencies from main app"""
    global get_db, User, SECRET_KEY, ALGORITHM, create_access_token
    get_db = db_dependency
    User = user_model
    SECRET_KEY = secret_key
    ALGORITHM = algorithm
    create_access_token = token_creator


# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


class GoogleAuthRequest(BaseModel):
    credential: str  # The ID token from Google


class GoogleCallbackRequest(BaseModel):
    code: str
    redirect_uri: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/google/callback")
async def google_callback(request: GoogleCallbackRequest, db: Session = Depends(lambda: get_db())):
    """Handle Google OAuth callback with authorization code"""
    try:
        # Exchange authorization code for tokens with timeout protection
        if TIMEOUT_MANAGER_AVAILABLE:
            # Use enhanced OAuth handler with timeout protection
            tokens = await oauth_handler.exchange_oauth_code(
                provider="google",
                code=request.code,
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET,
                redirect_uri=request.redirect_uri,
                token_url=GOOGLE_TOKEN_URL
            )
            
            # Get user info with timeout protection
            google_user = await oauth_handler.get_user_info(
                provider="google",
                access_token=tokens["access_token"],
                user_info_url=GOOGLE_USER_INFO_URL
            )
        else:
            # Fallback to basic OAuth handling without timeout protection
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "code": request.code,
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "redirect_uri": request.redirect_uri,
                        "grant_type": "authorization_code",
                    },
                )

                if token_response.status_code != 200:
                    logger.error(f"Failed to exchange code: {token_response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to authenticate with Google"
                    )

                tokens = token_response.json()

                # Get user info from Google
                user_response = await client.get(
                    GOOGLE_USER_INFO_URL, headers={"Authorization": f"Bearer {tokens['access_token']}"}
                )

                if user_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to get user information from Google"
                    )

                google_user = user_response.json()

        # Check if user exists
        user = db.query(User).filter(User.email == google_user["email"]).first()

        if not user:
            # Create new user
            user = User(
                username=google_user.get("name", google_user["email"].split("@")[0]),
                email=google_user["email"],
                hashed_password="",  # No password for OAuth users
                is_verified=google_user.get("verified_email", False),
                is_active=True,
                oauth_provider="google",
                oauth_id=google_user["id"],
                profile_picture=google_user.get("picture", None),
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user via Google OAuth: {user.email}")
        else:
            # Update existing user's OAuth info if needed
            if not user.oauth_provider:
                user.oauth_provider = "google"
                user.oauth_id = google_user["id"]
                user.is_verified = True
                if google_user.get("picture") and not user.profile_picture:
                    user.profile_picture = google_user["picture"]
                db.commit()
                logger.info(f"Updated existing user with Google OAuth: {user.email}")

        # Create access token
        access_token = create_access_token(data={"sub": user.email})

        return TokenResponse(
            access_token=access_token,
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_verified": user.is_verified,
                "profile_picture": user.profile_picture,
            },
        )

    except asyncio.TimeoutError:
        logger.error("Google OAuth request timed out")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Google authentication service timed out. Please try again."
        )
    except httpx.RequestError as e:
        logger.error(f"Network error during Google OAuth: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to communicate with Google services"
        )
    except Exception as e:
        logger.error(f"Unexpected error during Google OAuth: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.post("/google/verify")
async def verify_google_token(request: GoogleAuthRequest, db: Session = Depends(lambda: get_db())):
    """Verify Google ID token (for one-tap sign in)"""
    try:
        # Verify the Google ID token with timeout protection
        if TIMEOUT_MANAGER_AVAILABLE:
            # Use enhanced OAuth handler with timeout protection
            token_info = await oauth_handler.verify_google_token(
                id_token=request.credential,
                client_id=GOOGLE_CLIENT_ID
            )
            
            # Extract user info from verified token
            email = token_info.get("email")
            name = token_info.get("name", email.split("@")[0])
            picture = token_info.get("picture")
            google_id = token_info.get("sub")
            email_verified = token_info.get("email_verified", False)
        else:
            # Fallback to basic token verification without timeout protection
            async with httpx.AsyncClient() as client:
                # Verify token with Google
                response = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={request.credential}")

                if response.status_code != 200:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

                token_info = response.json()

                # Verify the token is for our app
                if token_info.get("aud") != GOOGLE_CLIENT_ID:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not intended for this application"
                    )

                # Extract user info
                email = token_info.get("email")
                name = token_info.get("name", email.split("@")[0])
                picture = token_info.get("picture")
                google_id = token_info.get("sub")
                email_verified = token_info.get("email_verified", False)

        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Create new user
            user = User(
                username=name,
                email=email,
                hashed_password="",  # No password for OAuth users
                is_verified=email_verified,
                is_active=True,
                oauth_provider="google",
                oauth_id=google_id,
                profile_picture=picture,
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user via Google One-Tap: {user.email}")
        else:
            # Update existing user's OAuth info if needed
            if not user.oauth_provider:
                user.oauth_provider = "google"
                user.oauth_id = google_id
                user.is_verified = True
                if picture and not user.profile_picture:
                    user.profile_picture = picture
                db.commit()
                logger.info(f"Updated existing user with Google OAuth: {user.email}")

        # Create access token
        access_token = create_access_token(data={"sub": user.email})

        return TokenResponse(
            access_token=access_token,
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_verified": user.is_verified,
                "profile_picture": user.profile_picture,
            },
        )

    except asyncio.TimeoutError:
        logger.error("Google token verification timed out")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Google token verification timed out. Please try again."
        )
    except httpx.RequestError as e:
        logger.error(f"Network error verifying Google token: {str(e)}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to verify with Google")
    except Exception as e:
        logger.error(f"Error verifying Google token: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to verify Google token")


@router.get("/google/config")
async def get_google_config():
    """Get Google OAuth configuration for frontend"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")

    return {"client_id": GOOGLE_CLIENT_ID, "enabled": bool(GOOGLE_CLIENT_ID)}
