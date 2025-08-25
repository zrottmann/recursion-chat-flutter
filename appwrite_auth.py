"""
Appwrite Authentication Service for Trading Post
Provides authentication methods and user management
"""

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite_config import appwrite_config, DATABASE_ID, COLLECTIONS
import logging
from typing import Optional, Dict, Any
import os

logger = logging.getLogger(__name__)


class AppwriteAuthService:
    """Handle authentication operations with Appwrite"""

    def __init__(self):
        self.client = appwrite_config.client
        self.account = appwrite_config.account
        self.databases = appwrite_config.databases

    async def create_user(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """Create a new user account"""
        try:
            # Create user account
            user = await self.account.create(user_id=ID.unique(), email=email, password=password, name=name)

            # Create user profile in database
            profile = await self.databases.create_document(
                database_id=DATABASE_ID,
                collection_id=COLLECTIONS["users"],
                document_id=user["$id"],
                data={
                    "name": name,
                    "email": email,
                    "createdAt": user["$createdAt"],
                    "emailVerification": False,
                    "prefs": {},
                },
            )

            logger.info(f"User created successfully: {email}")
            return {"user": user, "profile": profile, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to create user {email}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user and create session"""
        try:
            session = await self.account.create_email_password_session(email=email, password=password)

            # Get user details
            user = await self.account.get()

            # Get user profile
            try:
                profile = await self.databases.get_document(
                    database_id=DATABASE_ID, collection_id=COLLECTIONS["users"], document_id=user["$id"]
                )
            except AppwriteException:
                # Profile doesn't exist, create it
                profile = await self.databases.create_document(
                    database_id=DATABASE_ID,
                    collection_id=COLLECTIONS["users"],
                    document_id=user["$id"],
                    data={
                        "name": user.get("name", ""),
                        "email": user.get("email", ""),
                        "createdAt": user["$createdAt"],
                        "emailVerification": user.get("emailVerification", False),
                        "prefs": user.get("prefs", {}),
                    },
                )

            logger.info(f"User logged in successfully: {email}")
            return {"session": session, "user": user, "profile": profile, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to login user {email}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def get_current_user(self, jwt_token: str) -> Dict[str, Any]:
        """Get current user from JWT token"""
        try:
            # Create user-specific client
            user_client = appwrite_config.set_jwt(jwt_token)
            user = await user_client.account.get()

            # Get user profile
            profile = await user_client.databases.get_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["users"], document_id=user["$id"]
            )

            return {"user": user, "profile": profile, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to get current user: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def logout_user(self, session_id: str) -> Dict[str, Any]:
        """Logout user by deleting session"""
        try:
            await self.account.delete_session(session_id)

            logger.info("User logged out successfully")
            return {"success": True}

        except AppwriteException as e:
            logger.error(f"Failed to logout user: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def update_user_profile(self, jwt_token: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        try:
            user_client = appwrite_config.set_jwt(jwt_token)
            user = await user_client.account.get()

            # Update profile in database
            profile = await user_client.databases.update_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["users"], document_id=user["$id"], data=data
            )

            logger.info(f"User profile updated: {user['$id']}")
            return {"profile": profile, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to update user profile: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def verify_email(self, user_id: str, secret: str) -> Dict[str, Any]:
        """Verify user email"""
        try:
            await self.account.update_verification(user_id=user_id, secret=secret)

            logger.info(f"Email verified for user: {user_id}")
            return {"success": True}

        except AppwriteException as e:
            logger.error(f"Failed to verify email: {e}")
            return {"error": str(e), "code": e.code, "success": False}


# Global instance
appwrite_auth = AppwriteAuthService()
