"""
Secure Appwrite Configuration for Trading Post
This module provides centralized and secure Appwrite client setup
All sensitive data is loaded from environment variables
"""

import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.functions import Functions
from appwrite.services.users import Users
from appwrite.services.teams import Teams
from appwrite.exception import AppwriteException
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
env_file = os.getenv('ENV_FILE', '.env.appwrite')
if os.path.exists(env_file):
    load_dotenv(env_file)
    logger.info(f"Loaded environment from {env_file}")
else:
    logger.warning(f"Environment file {env_file} not found. Using system environment variables.")


class SecureAppwriteConfig:
    """Secure Appwrite configuration and client management"""

    def __init__(self):
        # Load configuration from environment variables
        self.endpoint = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
        self.project_id = os.getenv("APPWRITE_PROJECT_ID")
        self.api_key = os.getenv("APPWRITE_API_KEY")
        
        # Validate required configuration
        if not self.project_id:
            raise ValueError("APPWRITE_PROJECT_ID environment variable is required")
        
        if not self.api_key:
            raise ValueError("APPWRITE_API_KEY environment variable is required")
        
        # Initialize client
        self.client = Client()
        self.client.set_endpoint(self.endpoint)
        self.client.set_project(self.project_id)
        self.client.set_key(self.api_key)
        
        # Initialize services
        self.account = Account(self.client)
        self.databases = Databases(self.client)
        self.storage = Storage(self.client)
        self.functions = Functions(self.client)
        self.users = Users(self.client)
        self.teams = Teams(self.client)
        
        # Load database and collection IDs
        self.database_id = os.getenv("APPWRITE_DATABASE_ID", "trading_post_db")
        self.collections = {
            'users': os.getenv("APPWRITE_USERS_COLLECTION_ID", "users"),
            'items': os.getenv("APPWRITE_ITEMS_COLLECTION_ID", "items"),
            'wants': os.getenv("APPWRITE_WANTS_COLLECTION_ID", "wants"),
            'trades': os.getenv("APPWRITE_TRADES_COLLECTION_ID", "trades"),
            'messages': os.getenv("APPWRITE_MESSAGES_COLLECTION_ID", "messages"),
            'reviews': os.getenv("APPWRITE_REVIEWS_COLLECTION_ID", "reviews"),
            'notifications': os.getenv("APPWRITE_NOTIFICATIONS_COLLECTION_ID", "notifications")
        }
        
        # Load storage bucket IDs
        self.buckets = {
            'item_images': os.getenv("APPWRITE_ITEM_IMAGES_BUCKET_ID", "item_images"),
            'profile_images': os.getenv("APPWRITE_PROFILE_IMAGES_BUCKET_ID", "profile_images"),
            'chat_attachments': os.getenv("APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID", "chat_attachments")
        }
        
        logger.info(f"Appwrite client initialized securely for project: {self.project_id[:8]}...")

    def set_jwt(self, jwt_token):
        """Set JWT token for user-specific operations"""
        self.client.set_jwt(jwt_token)
        logger.debug("JWT token set for user session")

    def set_session(self, session_id):
        """Set session for user-specific operations"""
        self.client.set_session(session_id)
        logger.debug("Session set for user")

    def test_connection(self):
        """Test connection to Appwrite"""
        try:
            # Test by listing databases
            result = self.databases.list()
            logger.info("✅ Successfully connected to Appwrite")
            return True
        except AppwriteException as e:
            logger.error(f"❌ Failed to connect to Appwrite: {e}")
            return False

    def get_collection(self, collection_name):
        """Get collection ID by name"""
        return self.collections.get(collection_name)

    def get_bucket(self, bucket_name):
        """Get bucket ID by name"""
        return self.buckets.get(bucket_name)

    async def create_document(self, collection_name, data, document_id=None):
        """Create a document in a collection"""
        try:
            collection_id = self.get_collection(collection_name)
            if not collection_id:
                raise ValueError(f"Collection '{collection_name}' not configured")
            
            if document_id:
                result = await self.databases.create_document(
                    database_id=self.database_id,
                    collection_id=collection_id,
                    document_id=document_id,
                    data=data
                )
            else:
                result = await self.databases.create_document(
                    database_id=self.database_id,
                    collection_id=collection_id,
                    document_id='unique()',
                    data=data
                )
            
            logger.info(f"Document created in {collection_name}: {result['$id']}")
            return result
        except AppwriteException as e:
            logger.error(f"Failed to create document: {e}")
            raise

    async def get_document(self, collection_name, document_id):
        """Get a document from a collection"""
        try:
            collection_id = self.get_collection(collection_name)
            if not collection_id:
                raise ValueError(f"Collection '{collection_name}' not configured")
            
            result = await self.databases.get_document(
                database_id=self.database_id,
                collection_id=collection_id,
                document_id=document_id
            )
            return result
        except AppwriteException as e:
            logger.error(f"Failed to get document: {e}")
            raise

    async def list_documents(self, collection_name, queries=None, limit=25, offset=0):
        """List documents from a collection"""
        try:
            collection_id = self.get_collection(collection_name)
            if not collection_id:
                raise ValueError(f"Collection '{collection_name}' not configured")
            
            result = await self.databases.list_documents(
                database_id=self.database_id,
                collection_id=collection_id,
                queries=queries or [],
                limit=limit,
                offset=offset
            )
            return result
        except AppwriteException as e:
            logger.error(f"Failed to list documents: {e}")
            raise

    async def update_document(self, collection_name, document_id, data):
        """Update a document in a collection"""
        try:
            collection_id = self.get_collection(collection_name)
            if not collection_id:
                raise ValueError(f"Collection '{collection_name}' not configured")
            
            result = await self.databases.update_document(
                database_id=self.database_id,
                collection_id=collection_id,
                document_id=document_id,
                data=data
            )
            
            logger.info(f"Document updated in {collection_name}: {document_id}")
            return result
        except AppwriteException as e:
            logger.error(f"Failed to update document: {e}")
            raise

    async def delete_document(self, collection_name, document_id):
        """Delete a document from a collection"""
        try:
            collection_id = self.get_collection(collection_name)
            if not collection_id:
                raise ValueError(f"Collection '{collection_name}' not configured")
            
            await self.databases.delete_document(
                database_id=self.database_id,
                collection_id=collection_id,
                document_id=document_id
            )
            
            logger.info(f"Document deleted from {collection_name}: {document_id}")
            return True
        except AppwriteException as e:
            logger.error(f"Failed to delete document: {e}")
            raise

    async def upload_file(self, bucket_name, file_path, file_id=None):
        """Upload a file to a storage bucket"""
        try:
            bucket_id = self.get_bucket(bucket_name)
            if not bucket_id:
                raise ValueError(f"Bucket '{bucket_name}' not configured")
            
            with open(file_path, 'rb') as file:
                if file_id:
                    result = await self.storage.create_file(
                        bucket_id=bucket_id,
                        file_id=file_id,
                        file=file
                    )
                else:
                    result = await self.storage.create_file(
                        bucket_id=bucket_id,
                        file_id='unique()',
                        file=file
                    )
            
            logger.info(f"File uploaded to {bucket_name}: {result['$id']}")
            return result
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            raise

    def get_file_url(self, bucket_name, file_id):
        """Get public URL for a file"""
        bucket_id = self.get_bucket(bucket_name)
        if not bucket_id:
            raise ValueError(f"Bucket '{bucket_name}' not configured")
        
        return f"{self.endpoint}/storage/buckets/{bucket_id}/files/{file_id}/view?project={self.project_id}"


# Singleton instance
_appwrite_config = None


def get_appwrite_config():
    """Get or create the Appwrite configuration singleton"""
    global _appwrite_config
    if _appwrite_config is None:
        _appwrite_config = SecureAppwriteConfig()
    return _appwrite_config


# Export for convenience
appwrite = get_appwrite_config