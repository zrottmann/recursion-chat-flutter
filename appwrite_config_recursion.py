"""
AppWrite Configuration for Trading Post
Using the same AppWrite instance as Recursion Chat for unified backend
"""

import os
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.functions import Functions

class AppwriteConfig:
    def __init__(self):
        # Use Recursion App AppWrite settings
        self.endpoint = "https://nyc.cloud.appwrite.io/v1"
        self.project_id = "689bdaf500072795b0f6" 
        self.api_key = "standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc"
        self.database_id = "recursion_chat_db"
        
        # Trading Post specific collections in shared database
        self.collections = {
            "users": "trading_post_users",
            "items": "trading_post_items",
            "trades": "trading_post_trades",
            "messages": "trading_post_messages",
            "reviews": "trading_post_reviews"
        }
        
        self.buckets = {
            "item_images": "trading_post_item_images",
            "profile_images": "trading_post_profile_images"
        }
        
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
        
        print(f"🚀 Trading Post AppWrite client initialized")
        print(f"   Endpoint: {self.endpoint}")
        print(f"   Project: {self.project_id}")
        print(f"   Database: {self.database_id}")

# Global instance
appwrite_config = AppwriteConfig()
