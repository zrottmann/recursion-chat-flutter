"""
Trading Post App with Firebase SSO Integration
This file adds Firebase authentication to the existing Trading Post app
"""

# Import existing app_sqlite module
from app_sqlite import *
from firebase_auth import router as firebase_router, get_current_user, get_current_user_optional

# Add Firebase authentication endpoints to the app
app.include_router(firebase_router)


# Modify existing authentication to support both methods
@app.post("/token")
async def login_with_firebase_or_traditional(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Login endpoint that supports both traditional and Firebase authentication
    If username starts with 'firebase:', it's a Firebase token
    """
    if form_data.username.startswith("firebase:"):
        # Firebase authentication
        firebase_token = form_data.username.replace("firebase:", "")
        from firebase_auth import firebase_auth

        try:
            # Verify Firebase token
            user_data = await firebase_auth.verify_id_token(firebase_token)

            # Check if user exists in local database
            user = db.query(User).filter(User.email == user_data.get("email")).first()

            if not user:
                # Create user in local database
                user = User(
                    username=user_data.get("email", "").split("@")[0],
                    email=user_data.get("email"),
                    hashed_password="firebase_user",  # Placeholder password
                    phone=user_data.get("phone_number"),
                    firebase_uid=user_data.get("uid"),
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Create access token
            access_token = create_access_token(data={"sub": user.username, "user_id": user.id})

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
            }
        except Exception as e:
            logger.error(f"Firebase authentication error: {str(e)}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token")
    else:
        # Traditional authentication
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(data={"sub": user.username, "user_id": user.id})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
        }


# Add Firebase user profile endpoint
@app.get("/api/firebase/profile")
async def get_firebase_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user profile with Firebase data"""
    try:
        # Get Firebase user data
        from firebase_auth import firebase_auth

        firebase_user = await firebase_auth.get_user_by_uid(current_user["sub"])

        # Get local user data
        local_user = db.query(User).filter(User.email == firebase_user.email).first()

        return {
            "firebase": {
                "uid": firebase_user.uid,
                "email": firebase_user.email,
                "email_verified": firebase_user.email_verified,
                "display_name": firebase_user.display_name,
                "photo_url": firebase_user.photo_url,
                "provider": firebase_user.provider_id,
            },
            "local": {
                "id": local_user.id if local_user else None,
                "username": local_user.username if local_user else None,
                "phone": local_user.phone if local_user else None,
                "created_at": local_user.created_at if local_user else None,
            },
        }
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch profile")


# Add SSO provider endpoints
@app.get("/api/auth/providers")
async def get_auth_providers():
    """Get available authentication providers"""
    return {
        "providers": [
            {
                "id": "google",
                "name": "Google",
                "enabled": True,
                "icon": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
            },
            {
                "id": "facebook",
                "name": "Facebook",
                "enabled": True,
                "icon": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg",
            },
            {
                "id": "apple",
                "name": "Apple",
                "enabled": True,
                "icon": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/apple.png",
            },
            {"id": "email", "name": "Email/Password", "enabled": True, "icon": None},
        ]
    }


# Extend User model to include Firebase UID
from sqlalchemy import Column, String

# Add firebase_uid column to User model if not exists
if not hasattr(User, "firebase_uid"):
    User.firebase_uid = Column(String, nullable=True, unique=True)


# Migration endpoint to link existing users with Firebase
@app.post("/api/auth/link-firebase")
async def link_firebase_account(
    firebase_token: str, current_user: dict = Depends(get_current_user_dependency), db: Session = Depends(get_db)
):
    """Link existing account with Firebase"""
    try:
        from firebase_auth import firebase_auth

        # Verify Firebase token
        firebase_data = await firebase_auth.verify_id_token(firebase_token)

        # Update user with Firebase UID
        user = db.query(User).filter(User.id == current_user["user_id"]).first()
        if user:
            user.firebase_uid = firebase_data["uid"]
            db.commit()

            return {"message": "Account linked with Firebase successfully"}
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except Exception as e:
        logger.error(f"Error linking Firebase account: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to link Firebase account")


# Add middleware to log Firebase authentication attempts
@app.middleware("http")
async def log_firebase_auth(request: Request, call_next):
    """Log Firebase authentication attempts"""
    if request.url.path.startswith("/api/auth/firebase"):
        logger.info(f"Firebase auth attempt: {request.method} {request.url.path}")

    response = await call_next(request)
    return response


if __name__ == "__main__":
    import uvicorn

    print(
        """
    ====================================
    Trading Post with Firebase SSO
    ====================================
    Features:
    - Traditional email/password login
    - Firebase SSO (Google, Facebook, Apple)
    - Unified user management
    - Secure token handling
    ====================================
    """
    )
    uvicorn.run(app, host="0.0.0.0", port=3000)
