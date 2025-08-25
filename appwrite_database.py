"""
Appwrite Database Service for Trading Post
Provides comprehensive CRUD operations for all collections
"""

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query
from appwrite_config import appwrite_config, DATABASE_ID, COLLECTIONS
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class AppwriteDatabaseService:
    """Handle database operations with Appwrite"""

    def __init__(self):
        self.client = appwrite_config.client
        self.databases = appwrite_config.databases

    # User Management
    async def create_user_profile(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create user profile in database"""
        try:
            profile = await self.databases.create_document(
                database_id=DATABASE_ID,
                collection_id=COLLECTIONS["users"],
                document_id=user_id,
                data={
                    "name": data.get("name", ""),
                    "email": data.get("email", ""),
                    "username": data.get("username", ""),
                    "age": data.get("age"),
                    "location": data.get("location", ""),
                    "bio": data.get("bio", ""),
                    "phone": data.get("phone", ""),
                    "profile_image_url": data.get("profile_image_url", ""),
                    "opt_in_ai": data.get("opt_in_ai", True),
                    "email_verified": data.get("email_verified", False),
                    "is_active": data.get("is_active", True),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                    "preferences": data.get("preferences", {}),
                    "ratings": {"average": 0.0, "count": 0},
                },
            )

            logger.info(f"User profile created: {user_id}")
            return {"profile": profile, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to create user profile {user_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile"""
        try:
            profile = await self.databases.get_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["users"], document_id=user_id
            )

            return {"profile": profile, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to get user profile {user_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def update_user_profile(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        try:
            # Add update timestamp
            data["updated_at"] = datetime.utcnow().isoformat()

            profile = await self.databases.update_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["users"], document_id=user_id, data=data
            )

            logger.info(f"User profile updated: {user_id}")
            return {"profile": profile, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to update user profile {user_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def search_users(self, query_text: str = None, location: str = None, limit: int = 50) -> Dict[str, Any]:
        """Search users with filters"""
        try:
            queries = [Query.limit(limit)]

            if location:
                queries.append(Query.equal("location", location))

            if query_text:
                queries.append(Query.search("name", query_text))

            result = await self.databases.list_documents(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["users"], queries=queries
            )

            return {"users": result["documents"], "total": result["total"], "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to search users: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    # Listing Management
    async def create_listing(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new listing"""
        try:
            listing = await self.databases.create_document(
                database_id=DATABASE_ID,
                collection_id=COLLECTIONS["items"],
                document_id=ID.unique(),
                data={
                    "user_id": data.get("user_id"),
                    "title": data.get("title"),
                    "description": data.get("description"),
                    "category": data.get("category"),
                    "type": data.get("type"),  # 'offer' or 'want'
                    "condition": data.get("condition"),
                    "value_estimate": data.get("value_estimate", 0.0),
                    "images": data.get("images", []),
                    "tags": data.get("tags", []),
                    "location": data.get("location", ""),
                    "coordinates": data.get("coordinates", {}),
                    "is_active": data.get("is_active", True),
                    "is_featured": data.get("is_featured", False),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                    "expires_at": data.get("expires_at"),
                    "view_count": 0,
                    "save_count": 0,
                    "metadata": data.get("metadata", {}),
                },
            )

            logger.info(f"Listing created: {listing['$id']}")
            return {"listing": listing, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to create listing: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def get_listing(self, listing_id: str) -> Dict[str, Any]:
        """Get single listing"""
        try:
            listing = await self.databases.get_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["items"], document_id=listing_id
            )

            # Increment view count
            await self.databases.update_document(
                database_id=DATABASE_ID,
                collection_id=COLLECTIONS["items"],
                document_id=listing_id,
                data={"view_count": listing.get("view_count", 0) + 1},
            )

            return {"listing": listing, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to get listing {listing_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def update_listing(self, listing_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update listing"""
        try:
            data["updated_at"] = datetime.utcnow().isoformat()

            listing = await self.databases.update_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["items"], document_id=listing_id, data=data
            )

            logger.info(f"Listing updated: {listing_id}")
            return {"listing": listing, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to update listing {listing_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def delete_listing(self, listing_id: str) -> Dict[str, Any]:
        """Delete listing"""
        try:
            await self.databases.delete_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["items"], document_id=listing_id
            )

            logger.info(f"Listing deleted: {listing_id}")
            return {"success": True}

        except AppwriteException as e:
            logger.error(f"Failed to delete listing {listing_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def search_listings(
        self,
        category: str = None,
        listing_type: str = None,
        location: str = None,
        query_text: str = None,
        user_id: str = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Search listings with filters"""
        try:
            queries = [
                Query.limit(limit),
                Query.offset(offset),
                Query.equal("is_active", True),
                Query.order_desc("created_at"),
            ]

            if category:
                queries.append(Query.equal("category", category))

            if listing_type:
                queries.append(Query.equal("type", listing_type))

            if location:
                queries.append(Query.equal("location", location))

            if user_id:
                queries.append(Query.equal("user_id", user_id))

            if query_text:
                queries.append(Query.search("title", query_text))

            result = await self.databases.list_documents(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["items"], queries=queries
            )

            return {"listings": result["documents"], "total": result["total"], "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to search listings: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    # Trade/Match Management
    async def create_trade(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new trade/match"""
        try:
            trade = await self.databases.create_document(
                database_id=DATABASE_ID,
                collection_id=COLLECTIONS["trades"],
                document_id=ID.unique(),
                data={
                    "user1_id": data.get("user1_id"),
                    "user2_id": data.get("user2_id"),
                    "listing1_id": data.get("listing1_id"),
                    "listing2_id": data.get("listing2_id"),
                    "status": data.get("status", "pending"),  # pending, accepted, rejected, completed
                    "ai_reason": data.get("ai_reason", ""),
                    "score": data.get("score", 0.0),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                    "messages": [],
                    "meeting_details": data.get("meeting_details", {}),
                    "completion_details": data.get("completion_details", {}),
                    "feedback": data.get("feedback", {}),
                },
            )

            logger.info(f"Trade created: {trade['$id']}")
            return {"trade": trade, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to create trade: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def get_user_trades(self, user_id: str, status: str = None) -> Dict[str, Any]:
        """Get trades for a user"""
        try:
            queries = [Query.limit(100), Query.order_desc("created_at")]

            # Get trades where user is either user1 or user2
            queries_user1 = queries + [Query.equal("user1_id", user_id)]
            queries_user2 = queries + [Query.equal("user2_id", user_id)]

            if status:
                queries_user1.append(Query.equal("status", status))
                queries_user2.append(Query.equal("status", status))

            # Execute both queries
            result1 = await self.databases.list_documents(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["trades"], queries=queries_user1
            )

            result2 = await self.databases.list_documents(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["trades"], queries=queries_user2
            )

            # Combine results and remove duplicates
            trades = result1["documents"] + result2["documents"]
            unique_trades = {trade["$id"]: trade for trade in trades}.values()

            return {"trades": list(unique_trades), "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to get user trades {user_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def update_trade_status(self, trade_id: str, status: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
        """Update trade status"""
        try:
            update_data = {"status": status, "updated_at": datetime.utcnow().isoformat()}

            if details:
                update_data.update(details)

            trade = await self.databases.update_document(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["trades"], document_id=trade_id, data=update_data
            )

            logger.info(f"Trade status updated: {trade_id} -> {status}")
            return {"trade": trade, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to update trade status {trade_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    # Message Management
    async def create_message(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new message"""
        try:
            message = await self.databases.create_document(
                database_id=DATABASE_ID,
                collection_id=COLLECTIONS["messages"],
                document_id=ID.unique(),
                data={
                    "sender_id": data.get("sender_id"),
                    "recipient_id": data.get("recipient_id"),
                    "trade_id": data.get("trade_id"),
                    "content": data.get("content"),
                    "message_type": data.get("message_type", "text"),  # text, image, file
                    "is_read": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "attachments": data.get("attachments", []),
                    "metadata": data.get("metadata", {}),
                },
            )

            logger.info(f"Message created: {message['$id']}")
            return {"message": message, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to create message: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def get_conversation(self, user1_id: str, user2_id: str, trade_id: str = None) -> Dict[str, Any]:
        """Get conversation between two users"""
        try:
            queries = [Query.limit(100), Query.order_desc("created_at")]

            if trade_id:
                queries.append(Query.equal("trade_id", trade_id))
            else:
                # Get messages between the two users
                queries.extend([Query.equal("sender_id", user1_id), Query.equal("recipient_id", user2_id)])

            result = await self.databases.list_documents(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["messages"], queries=queries
            )

            return {"messages": result["documents"], "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to get conversation: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def mark_messages_read(self, user_id: str, conversation_partner_id: str) -> Dict[str, Any]:
        """Mark messages as read"""
        try:
            # Get unread messages from conversation partner
            queries = [
                Query.equal("sender_id", conversation_partner_id),
                Query.equal("recipient_id", user_id),
                Query.equal("is_read", False),
            ]

            result = await self.databases.list_documents(
                database_id=DATABASE_ID, collection_id=COLLECTIONS["messages"], queries=queries
            )

            # Update each message to mark as read
            for message in result["documents"]:
                await self.databases.update_document(
                    database_id=DATABASE_ID,
                    collection_id=COLLECTIONS["messages"],
                    document_id=message["$id"],
                    data={"is_read": True},
                )

            logger.info(f"Marked {len(result['documents'])} messages as read")
            return {"updated_count": len(result["documents"]), "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to mark messages as read: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    # AI Inference Storage
    async def store_ai_inference(self, user_id: str, inference_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store AI inference results"""
        try:
            inference = await self.databases.create_document(
                database_id=DATABASE_ID,
                collection_id="ai_inferences",  # Create this collection
                document_id=ID.unique(),
                data={
                    "user_id": user_id,
                    "inference_type": inference_data.get("type", "need_prediction"),
                    "inferred_need": inference_data.get("inferred_need"),
                    "confidence": inference_data.get("confidence", 0.0),
                    "source": inference_data.get("source", "ai_model"),
                    "model_version": inference_data.get("model_version", "1.0"),
                    "created_at": datetime.utcnow().isoformat(),
                    "metadata": inference_data.get("metadata", {}),
                },
            )

            return {"inference": inference, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to store AI inference: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    # Analytics and Reporting
    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics for a user"""
        try:
            # Get user's listings
            listings_result = await self.search_listings(user_id=user_id, limit=1000)

            # Get user's trades
            trades_result = await self.get_user_trades(user_id)

            # Calculate analytics
            listings = listings_result.get("listings", [])
            trades = trades_result.get("trades", [])

            analytics = {
                "total_listings": len(listings),
                "active_listings": len([l for l in listings if l.get("is_active")]),
                "total_trades": len(trades),
                "completed_trades": len([t for t in trades if t.get("status") == "completed"]),
                "pending_trades": len([t for t in trades if t.get("status") == "pending"]),
                "total_views": sum(l.get("view_count", 0) for l in listings),
                "average_listing_views": sum(l.get("view_count", 0) for l in listings) / max(len(listings), 1),
                "success_rate": len([t for t in trades if t.get("status") == "completed"]) / max(len(trades), 1) * 100,
            }

            return {"analytics": analytics, "success": True}

        except Exception as e:
            logger.error(f"Failed to get user analytics: {e}")
            return {"error": str(e), "success": False}


# Global instance
appwrite_db = AppwriteDatabaseService()
