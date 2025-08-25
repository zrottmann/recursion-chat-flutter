"""
Appwrite Realtime Service for Trading Post
Handles real-time subscriptions, live updates, and notifications
"""

from appwrite.exception import AppwriteException
from appwrite_config import appwrite_config, DATABASE_ID, COLLECTIONS
import logging
from typing import Optional, Dict, Any, List, Callable
import asyncio
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class AppwriteRealtimeService:
    """Handle real-time operations with Appwrite"""

    def __init__(self):
        self.client = appwrite_config.client
        self.active_subscriptions = {}
        self.event_handlers = {}

    def subscribe_to_collection(
        self, collection_id: str, callback: Callable, user_id: str = None, filters: List[str] = None
    ) -> str:
        """Subscribe to collection changes"""
        try:
            # Build subscription channels
            channels = [f"databases.{DATABASE_ID}.collections.{collection_id}.documents"]

            if user_id:
                # Subscribe to user-specific documents
                channels.append(f"databases.{DATABASE_ID}.collections.{collection_id}.documents.{user_id}")

            # Create subscription
            subscription_id = f"{collection_id}_{user_id or 'all'}_{len(self.active_subscriptions)}"

            def realtime_callback(response):
                try:
                    event_data = {
                        "event": response.get("event"),
                        "data": response.get("payload"),
                        "timestamp": datetime.utcnow().isoformat(),
                        "collection_id": collection_id,
                        "subscription_id": subscription_id,
                    }

                    # Apply filters if specified
                    if filters and not self._passes_filters(event_data, filters):
                        return

                    # Call the user-provided callback
                    callback(event_data)

                    logger.info(f"Realtime event processed: {response.get('event')}")

                except Exception as e:
                    logger.error(f"Realtime callback error: {e}")

            # Subscribe using Appwrite client
            unsubscribe = self.client.subscribe(channels, realtime_callback)

            # Store subscription
            self.active_subscriptions[subscription_id] = {
                "channels": channels,
                "callback": callback,
                "unsubscribe": unsubscribe,
                "created_at": datetime.utcnow().isoformat(),
                "collection_id": collection_id,
                "user_id": user_id,
            }

            logger.info(f"Subscribed to collection: {collection_id} - ID: {subscription_id}")
            return subscription_id

        except Exception as e:
            logger.error(f"Failed to subscribe to collection {collection_id}: {e}")
            return None

    def subscribe_to_user_messages(self, user_id: str, callback: Callable) -> str:
        """Subscribe to new messages for a user"""

        def message_callback(event_data):
            # Filter for messages where user is recipient
            message = event_data.get("data", {})
            if message.get("recipient_id") == user_id:
                callback(event_data)

        return self.subscribe_to_collection(COLLECTIONS["messages"], message_callback, filters=["create"])

    def subscribe_to_user_trades(self, user_id: str, callback: Callable) -> str:
        """Subscribe to trade updates for a user"""

        def trade_callback(event_data):
            # Filter for trades involving this user
            trade = event_data.get("data", {})
            if trade.get("user1_id") == user_id or trade.get("user2_id") == user_id:
                callback(event_data)

        return self.subscribe_to_collection(COLLECTIONS["trades"], trade_callback)

    def subscribe_to_marketplace_updates(self, callback: Callable, location: str = None, category: str = None) -> str:
        """Subscribe to marketplace listing updates"""

        def marketplace_callback(event_data):
            listing = event_data.get("data", {})

            # Apply location filter
            if location and listing.get("location") != location:
                return

            # Apply category filter
            if category and listing.get("category") != category:
                return

            callback(event_data)

        return self.subscribe_to_collection(COLLECTIONS["items"], marketplace_callback, filters=["create", "update"])

    def subscribe_to_user_matches(self, user_id: str, callback: Callable) -> str:
        """Subscribe to new AI matches for a user"""

        def match_callback(event_data):
            if event_data.get("event") == "databases.*.collections.*.documents.*.create":
                trade = event_data.get("data", {})
                if (trade.get("user1_id") == user_id or trade.get("user2_id") == user_id) and trade.get(
                    "status"
                ) == "ai_suggested":
                    callback(event_data)

        return self.subscribe_to_collection(COLLECTIONS["trades"], match_callback, filters=["create"])

    def unsubscribe(self, subscription_id: str) -> bool:
        """Unsubscribe from a subscription"""
        try:
            if subscription_id in self.active_subscriptions:
                subscription = self.active_subscriptions[subscription_id]

                # Call the unsubscribe function
                if subscription.get("unsubscribe"):
                    subscription["unsubscribe"]()

                # Remove from active subscriptions
                del self.active_subscriptions[subscription_id]

                logger.info(f"Unsubscribed from: {subscription_id}")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to unsubscribe {subscription_id}: {e}")
            return False

    def unsubscribe_all(self) -> int:
        """Unsubscribe from all active subscriptions"""
        count = 0
        subscription_ids = list(self.active_subscriptions.keys())

        for subscription_id in subscription_ids:
            if self.unsubscribe(subscription_id):
                count += 1

        logger.info(f"Unsubscribed from {count} subscriptions")
        return count

    def get_active_subscriptions(self) -> Dict[str, Any]:
        """Get list of active subscriptions"""
        return {
            sub_id: {
                "collection_id": sub["collection_id"],
                "user_id": sub["user_id"],
                "created_at": sub["created_at"],
                "channels": sub["channels"],
            }
            for sub_id, sub in self.active_subscriptions.items()
        }

    def broadcast_user_notification(self, user_id: str, notification_type: str, data: Dict[str, Any]) -> bool:
        """Send real-time notification to a specific user"""
        try:
            # In a real implementation, this would use Appwrite's messaging system
            # For now, we'll trigger callbacks for matching subscriptions

            notification = {
                "type": notification_type,
                "user_id": user_id,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Find subscriptions for this user
            for sub_id, subscription in self.active_subscriptions.items():
                if subscription.get("user_id") == user_id:
                    try:
                        subscription["callback"](
                            {"event": "notification", "data": notification, "subscription_id": sub_id}
                        )
                    except Exception as e:
                        logger.error(f"Failed to deliver notification: {e}")

            logger.info(f"Notification broadcasted to user {user_id}: {notification_type}")
            return True

        except Exception as e:
            logger.error(f"Failed to broadcast notification: {e}")
            return False

    def broadcast_global_notification(
        self, notification_type: str, data: Dict[str, Any], target_groups: List[str] = None
    ) -> int:
        """Send real-time notification to multiple users"""
        count = 0

        try:
            notification = {
                "type": notification_type,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
                "target_groups": target_groups,
            }

            # Broadcast to all active subscriptions or filtered groups
            for sub_id, subscription in self.active_subscriptions.items():
                try:
                    # Apply group filtering if specified
                    if target_groups:
                        user_groups = subscription.get("groups", [])
                        if not any(group in target_groups for group in user_groups):
                            continue

                    subscription["callback"](
                        {"event": "global_notification", "data": notification, "subscription_id": sub_id}
                    )
                    count += 1

                except Exception as e:
                    logger.error(f"Failed to deliver global notification: {e}")

            logger.info(f"Global notification broadcasted to {count} subscribers: {notification_type}")
            return count

        except Exception as e:
            logger.error(f"Failed to broadcast global notification: {e}")
            return 0

    def _passes_filters(self, event_data: Dict[str, Any], filters: List[str]) -> bool:
        """Check if event data passes the specified filters"""
        try:
            event_type = event_data.get("event", "")

            for filter_condition in filters:
                if filter_condition == "create" and "create" in event_type:
                    return True
                elif filter_condition == "update" and "update" in event_type:
                    return True
                elif filter_condition == "delete" and "delete" in event_type:
                    return True
                elif filter_condition in event_type:
                    return True

            return len(filters) == 0  # No filters means pass all

        except Exception:
            return False

    # Convenience methods for common real-time scenarios
    def setup_user_realtime(self, user_id: str, callbacks: Dict[str, Callable]) -> Dict[str, str]:
        """Setup complete real-time subscriptions for a user"""
        subscriptions = {}

        try:
            # Subscribe to messages
            if "messages" in callbacks:
                sub_id = self.subscribe_to_user_messages(user_id, callbacks["messages"])
                if sub_id:
                    subscriptions["messages"] = sub_id

            # Subscribe to trades
            if "trades" in callbacks:
                sub_id = self.subscribe_to_user_trades(user_id, callbacks["trades"])
                if sub_id:
                    subscriptions["trades"] = sub_id

            # Subscribe to matches
            if "matches" in callbacks:
                sub_id = self.subscribe_to_user_matches(user_id, callbacks["matches"])
                if sub_id:
                    subscriptions["matches"] = sub_id

            # Subscribe to profile updates
            if "profile" in callbacks:
                sub_id = self.subscribe_to_collection(COLLECTIONS["users"], callbacks["profile"], user_id)
                if sub_id:
                    subscriptions["profile"] = sub_id

            logger.info(f"Setup {len(subscriptions)} real-time subscriptions for user {user_id}")
            return subscriptions

        except Exception as e:
            logger.error(f"Failed to setup user realtime: {e}")
            return subscriptions

    def cleanup_user_realtime(self, subscription_ids: Dict[str, str]) -> int:
        """Cleanup user's real-time subscriptions"""
        count = 0

        for sub_type, sub_id in subscription_ids.items():
            if self.unsubscribe(sub_id):
                count += 1

        return count

    async def send_typing_indicator(self, sender_id: str, recipient_id: str, is_typing: bool) -> bool:
        """Send typing indicator in real-time"""
        try:
            return self.broadcast_user_notification(
                recipient_id, "typing_indicator", {"sender_id": sender_id, "is_typing": is_typing}
            )

        except Exception as e:
            logger.error(f"Failed to send typing indicator: {e}")
            return False

    async def send_read_receipt(self, sender_id: str, recipient_id: str, message_id: str) -> bool:
        """Send read receipt in real-time"""
        try:
            return self.broadcast_user_notification(
                sender_id, "read_receipt", {"recipient_id": recipient_id, "message_id": message_id}
            )

        except Exception as e:
            logger.error(f"Failed to send read receipt: {e}")
            return False


# Global instance
appwrite_realtime = AppwriteRealtimeService()
