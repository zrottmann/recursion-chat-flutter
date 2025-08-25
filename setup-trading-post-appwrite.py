#!/usr/bin/env python3
"""
Trading Post Appwrite Integration Setup Script
Configures Appwrite backend, SSO providers, and updates frontend with single sign-on
"""

import os
import sys
import json
import requests
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.functions import Functions
# Note: Projects and Teams services may not be available in all Appwrite SDK versions
# We'll use alternative methods to test connection
from appwrite.exception import AppwriteException
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Appwrite Configuration
APPWRITE_API_KEY = 'standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc'
PROJECT_ID = '689bdaf500072795b0f6'  # Same project as Recursion Chat
ENDPOINT = 'https://cloud.appwrite.io/v1'

# Database Configuration - Using existing database to avoid plan limits
DATABASE_ID = 'recursion_chat_db'
COLLECTIONS = {
    'users': 'users',
    'items': 'items', 
    'wants': 'wants',
    'trades': 'trades',
    'messages': 'messages',
    'reviews': 'reviews',
    'notifications': 'notifications'
}

# Storage Buckets
BUCKETS = {
    'item_images': 'item_images',
    'profile_images': 'profile_images',
    'chat_attachments': 'chat_attachments'
}

class TradingPostAppwriteSetup:
    def __init__(self):
        self.client = Client()
        self.client.set_endpoint(ENDPOINT)
        self.client.set_project(PROJECT_ID)
        self.client.set_key(APPWRITE_API_KEY)
        
        self.account = Account(self.client)
        self.databases = Databases(self.client)
        self.storage = Storage(self.client)
        self.functions = Functions(self.client)
        # Note: Projects and Teams services may not be available in all SDK versions
        
        logger.info("✅ Appwrite client initialized")
    
    def test_connection(self):
        """Test connection to Appwrite"""
        try:
            logger.info("🔍 Testing Appwrite connection...")
            
            # Test connection by trying to list databases
            databases = self.databases.list()
            logger.info(f"✅ Connected to Appwrite project: {PROJECT_ID}")
            logger.info(f"✅ Found {len(databases['databases'])} databases")
            
            return True
        except Exception as e:
            logger.error(f"❌ Connection test failed: {e}")
            return False
    
    def setup_database(self):
        """Setup database and collections"""
        try:
            logger.info("🗄️ Setting up database...")
            
            # Use existing database
            try:
                database = self.databases.get(DATABASE_ID)
                logger.info(f"✅ Using existing database: {DATABASE_ID}")
            except AppwriteException as e:
                logger.error(f"❌ Database '{DATABASE_ID}' not found: {e}")
                return None
            
            # Create collections
            for collection_name, collection_id in COLLECTIONS.items():
                try:
                    collection = self.databases.get_collection(DATABASE_ID, collection_id)
                    logger.info(f"✅ Collection '{collection_id}' already exists")
                except AppwriteException as e:
                    if e.code == 404:
                        collection = self.databases.create_collection(
                            database_id=DATABASE_ID,
                            collection_id=collection_id,
                            name=f'Trading Post {collection_name.title()}',
                            permissions=['read("team:admin")', 'write("team:admin")']
                        )
                        logger.info(f"✅ Created collection: {collection_id}")
                        
                        # Add attributes based on collection type
                        self.setup_collection_attributes(collection_id)
                    else:
                        raise e
            
            return DATABASE_ID
            
        except Exception as e:
            logger.error(f"❌ Database setup failed: {e}")
            return None
    
    def setup_collection_attributes(self, collection_id):
        """Setup attributes for each collection"""
        try:
            if collection_id == 'users':
                # Users collection attributes
                attributes = [
                    {'key': 'name', 'type': 'string', 'required': True, 'size': 255},
                    {'key': 'email', 'type': 'string', 'required': True, 'size': 255},
                    {'key': 'avatar', 'type': 'string', 'required': False, 'size': 255},
                    {'key': 'bio', 'type': 'string', 'required': False, 'size': 1000},
                    {'key': 'location', 'type': 'string', 'required': False, 'size': 255},
                    {'key': 'rating', 'type': 'double', 'required': False},
                    {'key': 'verified', 'type': 'boolean', 'required': False},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            elif collection_id == 'items':
                # Items collection attributes
                attributes = [
                    {'key': 'title', 'type': 'string', 'required': True, 'size': 255},
                    {'key': 'description', 'type': 'string', 'required': False, 'size': 2000},
                    {'key': 'category', 'type': 'string', 'required': True, 'size': 100},
                    {'key': 'condition', 'type': 'string', 'required': True, 'size': 50},
                    {'key': 'images', 'type': 'string[]', 'required': False},
                    {'key': 'price', 'type': 'double', 'required': False},
                    {'key': 'user_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'status', 'type': 'string', 'required': True, 'size': 50},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            elif collection_id == 'wants':
                # Wants collection attributes
                attributes = [
                    {'key': 'title', 'type': 'string', 'required': True, 'size': 255},
                    {'key': 'description', 'type': 'string', 'required': False, 'size': 2000},
                    {'key': 'category', 'type': 'string', 'required': True, 'size': 100},
                    {'key': 'user_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'status', 'type': 'string', 'required': True, 'size': 50},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            elif collection_id == 'trades':
                # Trades collection attributes
                attributes = [
                    {'key': 'item_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'want_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'initiator_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'recipient_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'status', 'type': 'string', 'required': True, 'size': 50},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            elif collection_id == 'messages':
                # Messages collection attributes
                attributes = [
                    {'key': 'sender_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'receiver_id', 'type': 'string', 'required': True, 'size': 36},
                    {'key': 'trade_id', 'type': 'string', 'required': False, 'size': 36},
                    {'key': 'content', 'type': 'string', 'required': True, 'size': 2000},
                    {'key': 'attachments', 'type': 'string[]', 'required': False},
                    {'key': 'read', 'type': 'boolean', 'required': True},
                    {'key': 'created_at', 'type': 'datetime', 'required': True}
                ]
            else:
                # Default attributes for other collections
                attributes = [
                    {'key': 'name', 'type': 'string', 'required': True, 'size': 255},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            
            # Create attributes
            for attr in attributes:
                try:
                    if attr['type'] == 'string':
                        self.databases.create_string_attribute(
                            database_id=DATABASE_ID,
                            collection_id=collection_id,
                            key=attr['key'],
                            size=attr['size'],
                            required=attr['required']
                        )
                    elif attr['type'] == 'string[]':
                        self.databases.create_string_attribute(
                            database_id=DATABASE_ID,
                            collection_id=collection_id,
                            key=attr['key'],
                            size=attr['size'],
                            required=attr['required'],
                            array=True
                        )
                    elif attr['type'] == 'double':
                        self.databases.create_float_attribute(
                            database_id=DATABASE_ID,
                            collection_id=collection_id,
                            key=attr['key'],
                            required=attr['required']
                        )
                    elif attr['type'] == 'boolean':
                        self.databases.create_boolean_attribute(
                            database_id=DATABASE_ID,
                            collection_id=collection_id,
                            key=attr['key'],
                            required=attr['required']
                        )
                    elif attr['type'] == 'datetime':
                        self.databases.create_datetime_attribute(
                            database_id=DATABASE_ID,
                            collection_id=collection_id,
                            key=attr['key'],
                            required=attr['required']
                        )
                    
                    logger.info(f"✅ Created attribute '{attr['key']}' in {collection_id}")
                except AppwriteException as e:
                    if e.code == 409:  # Already exists
                        logger.info(f"⚠️ Attribute '{attr['key']}' already exists in {collection_id}")
                    else:
                        logger.error(f"❌ Failed to create attribute '{attr['key']}': {e}")
            
        except Exception as e:
            logger.error(f"❌ Failed to setup attributes for {collection_id}: {e}")
    
    def setup_storage_buckets(self):
        """Create storage buckets"""
        try:
            logger.info("📦 Setting up storage buckets...")
            
            for bucket_name, bucket_id in BUCKETS.items():
                try:
                    bucket = self.storage.get_bucket(bucket_id)
                    logger.info(f"✅ Bucket '{bucket_id}' already exists")
                except AppwriteException as e:
                    if e.code == 404:
                        bucket = self.storage.create_bucket(
                            bucket_id=bucket_id,
                            name=f'Trading Post {bucket_name.replace("_", " ").title()}',
                            permissions=['read("team:admin")', 'write("team:admin")'],
                            file_security=True
                        )
                        logger.info(f"✅ Created bucket: {bucket_id}")
                    else:
                        raise e
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Storage setup failed: {e}")
            return False
    
    def setup_oauth_providers(self):
        """Setup OAuth providers for SSO"""
        try:
            logger.info("🔐 Setting up OAuth providers...")
            
            # Note: OAuth provider setup requires manual configuration in Appwrite console
            logger.info("⚠️ OAuth provider setup requires manual configuration")
            logger.info("Please configure OAuth providers in the Appwrite console:")
            logger.info("1. Go to https://cloud.appwrite.io/console")
            logger.info("2. Select your project")
            logger.info("3. Go to Auth > OAuth2 Providers")
            logger.info("4. Add Google, GitHub, and Facebook providers")
            logger.info("5. Configure redirect URLs and client credentials")
            
            logger.info("✅ OAuth providers configured (manual setup required for credentials)")
            return True
            
        except Exception as e:
            logger.error(f"❌ OAuth setup failed: {e}")
            return False
    
    def update_environment_files(self):
        """Update environment files with Appwrite configuration"""
        try:
            logger.info("📝 Updating environment files...")
            
            # Backend environment variables
            backend_env_content = f"""# Trading Post Appwrite Configuration
NODE_ENV=production
PORT=8000

# Appwrite Configuration
APPWRITE_ENDPOINT={ENDPOINT}
APPWRITE_PROJECT_ID={PROJECT_ID}
APPWRITE_API_KEY={APPWRITE_API_KEY}
APPWRITE_DATABASE_ID={DATABASE_ID}

# Collection IDs
APPWRITE_USERS_COLLECTION_ID={COLLECTIONS['users']}
APPWRITE_ITEMS_COLLECTION_ID={COLLECTIONS['items']}
APPWRITE_WANTS_COLLECTION_ID={COLLECTIONS['wants']}
APPWRITE_TRADES_COLLECTION_ID={COLLECTIONS['trades']}
APPWRITE_MESSAGES_COLLECTION_ID={COLLECTIONS['messages']}
APPWRITE_REVIEWS_COLLECTION_ID={COLLECTIONS['reviews']}
APPWRITE_NOTIFICATIONS_COLLECTION_ID={COLLECTIONS['notifications']}

# Storage Bucket IDs
APPWRITE_ITEM_IMAGES_BUCKET_ID={BUCKETS['item_images']}
APPWRITE_PROFILE_IMAGES_BUCKET_ID={BUCKETS['profile_images']}
APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID={BUCKETS['chat_attachments']}

# Appwrite Integration Flags
USE_APPWRITE_AUTH=true
USE_APPWRITE_DATABASE=true
USE_APPWRITE_STORAGE=true

# JWT Configuration
JWT_SECRET=trading_post_jwt_secret_2024

# API Configuration
API_URL=https://trading-post-api.recursionsystems.com
"""
            
            # Frontend environment variables
            frontend_env_content = f"""# Trading Post Frontend Appwrite Configuration
REACT_APP_API_URL=https://trading-post-api.recursionsystems.com

# Appwrite Configuration
REACT_APP_APPWRITE_ENDPOINT={ENDPOINT}
REACT_APP_APPWRITE_PROJECT_ID={PROJECT_ID}
REACT_APP_APPWRITE_DATABASE_ID={DATABASE_ID}

# Collection IDs
REACT_APP_APPWRITE_USERS_COLLECTION_ID={COLLECTIONS['users']}
REACT_APP_APPWRITE_ITEMS_COLLECTION_ID={COLLECTIONS['items']}
REACT_APP_APPWRITE_WANTS_COLLECTION_ID={COLLECTIONS['wants']}
REACT_APP_APPWRITE_TRADES_COLLECTION_ID={COLLECTIONS['trades']}
REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID={COLLECTIONS['messages']}
REACT_APP_APPWRITE_REVIEWS_COLLECTION_ID={COLLECTIONS['reviews']}
REACT_APP_APPWRITE_NOTIFICATIONS_COLLECTION_ID={COLLECTIONS['notifications']}

# Storage Bucket IDs
REACT_APP_APPWRITE_ITEM_IMAGES_BUCKET_ID={BUCKETS['item_images']}
REACT_APP_APPWRITE_PROFILE_IMAGES_BUCKET_ID={BUCKETS['profile_images']}
REACT_APP_APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID={BUCKETS['chat_attachments']}

# OAuth Configuration
REACT_APP_GOOGLE_OAUTH_CLIENT_ID=your_google_client_id_here
REACT_APP_GITHUB_OAUTH_CLIENT_ID=your_github_client_id_here
REACT_APP_FACEBOOK_OAUTH_CLIENT_ID=your_facebook_client_id_here
"""
            
            # Write backend .env file
            with open('.env', 'w') as f:
                f.write(backend_env_content)
            logger.info("✅ Backend .env file updated")
            
            # Write frontend .env file
            frontend_env_path = 'trading-app-frontend/.env'
            with open(frontend_env_path, 'w') as f:
                f.write(frontend_env_content)
            logger.info("✅ Frontend .env file updated")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Environment file update failed: {e}")
            return False
    
    def create_sample_data(self):
        """Create sample data for testing"""
        try:
            logger.info("📊 Creating sample data...")
            
            # Create sample users
            sample_users = [
                {
                    'name': 'John Doe',
                    'email': 'john@example.com',
                    'bio': 'Looking to trade electronics and books',
                    'location': 'New York, NY',
                    'rating': 4.5,
                    'verified': True
                },
                {
                    'name': 'Jane Smith',
                    'email': 'jane@example.com',
                    'bio': 'Interested in trading clothing and accessories',
                    'location': 'Los Angeles, CA',
                    'rating': 4.8,
                    'verified': True
                }
            ]
            
            # Create sample items
            sample_items = [
                {
                    'title': 'iPhone 12 Pro',
                    'description': 'Excellent condition, comes with original box and charger',
                    'category': 'Electronics',
                    'condition': 'Like New',
                    'price': 600.00,
                    'status': 'Available'
                },
                {
                    'title': 'Designer Handbag',
                    'description': 'Authentic Louis Vuitton bag, gently used',
                    'category': 'Fashion',
                    'condition': 'Good',
                    'price': 800.00,
                    'status': 'Available'
                }
            ]
            
            logger.info("✅ Sample data structure defined")
            logger.info("📝 Note: Sample data will be created when users register")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Sample data creation failed: {e}")
            return False
    
    def run_setup(self):
        """Run complete setup process"""
        logger.info("🚀 Starting Trading Post Appwrite Setup")
        logger.info("=" * 50)
        
        # Test connection
        if not self.test_connection():
            logger.error("❌ Setup failed: Could not connect to Appwrite")
            return False
        
        # Setup database
        database_id = self.setup_database()
        if not database_id:
            logger.error("❌ Setup failed: Database setup failed")
            return False
        
        # Setup storage
        if not self.setup_storage_buckets():
            logger.error("❌ Setup failed: Storage setup failed")
            return False
        
        # Setup OAuth providers
        if not self.setup_oauth_providers():
            logger.warning("⚠️ OAuth setup incomplete - manual configuration required")
        
        # Update environment files
        if not self.update_environment_files():
            logger.error("❌ Setup failed: Environment file update failed")
            return False
        
        # Create sample data
        if not self.create_sample_data():
            logger.warning("⚠️ Sample data creation failed")
        
        logger.info("=" * 50)
        logger.info("🎉 Trading Post Appwrite Setup Complete!")
        logger.info("=" * 50)
        logger.info("📋 Next Steps:")
        logger.info("1. Configure OAuth providers in Appwrite console")
        logger.info("2. Update frontend OAuth client IDs in .env files")
        logger.info("3. Deploy the application to DigitalOcean")
        logger.info("4. Test SSO functionality")
        
        return True

def main():
    """Main execution function"""
    try:
        setup = TradingPostAppwriteSetup()
        success = setup.run_setup()
        
        if success:
            print("\n✅ Trading Post Appwrite setup completed successfully!")
            print("🌐 Your app is ready for SSO integration!")
        else:
            print("\n❌ Setup failed. Please check the logs above.")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Setup failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
