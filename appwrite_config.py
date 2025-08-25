"""
Appwrite Configuration for Trading Post
Provides centralized Appwrite client setup and configuration
"""

import os
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.functions import Functions
from appwrite.exception import AppwriteException
import logging

# Configure logging
logger = logging.getLogger(__name__)


class AppwriteConfig:
    """Appwrite configuration and client management"""

    def __init__(self):
        self.endpoint = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
        self.project_id = os.getenv("APPWRITE_PROJECT_ID")
        self.api_key = os.getenv("APPWRITE_API_KEY")

        if not self.project_id:
            logger.warning("APPWRITE_PROJECT_ID not set. Please configure Appwrite project.")

        # Initialize client
        self.client = Client()
        self.client.set_endpoint(self.endpoint)

        if self.project_id:
            self.client.set_project(self.project_id)

        if self.api_key:
            self.client.set_key(self.api_key)  # For server-side operations

        # Initialize services
        self.account = Account(self.client)
        self.databases = Databases(self.client)
        self.storage = Storage(self.client)
        self.functions = Functions(self.client)

        logger.info(f"Appwrite client initialized for endpoint: {self.endpoint}")

    def set_jwt(self, jwt_token):
        """Set JWT token for user-specific operations"""
        self.client.set_jwt(jwt_token)
        return self

    def health_check(self):
        """Check if Appwrite service is accessible"""
        try:
            # Try to get account (this will fail if not authenticated, but will succeed if service is up)
            self.account.get()
            return True
        except AppwriteException as e:
            if e.code == 401:
                # Unauthorized is expected without authentication
                return True
            logger.error(f"Appwrite health check failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Appwrite connection error: {e}")
            return False


# Global instance
appwrite_config = AppwriteConfig()

# Database and Collection IDs
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "trading_post_db")
COLLECTIONS = {
    "users": os.getenv("APPWRITE_USERS_COLLECTION_ID", "users"),
    "items": os.getenv("APPWRITE_ITEMS_COLLECTION_ID", "items"),
    "wants": os.getenv("APPWRITE_WANTS_COLLECTION_ID", "wants"),
    "trades": os.getenv("APPWRITE_TRADES_COLLECTION_ID", "trades"),
    "messages": os.getenv("APPWRITE_MESSAGES_COLLECTION_ID", "messages"),
}

# Storage Bucket IDs
BUCKETS = {
    "item_images": os.getenv("APPWRITE_ITEM_IMAGES_BUCKET_ID", "item_images"),
    "profile_images": os.getenv("APPWRITE_PROFILE_IMAGES_BUCKET_ID", "profile_images"),
}
