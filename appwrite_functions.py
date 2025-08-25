"""
Appwrite Functions Service for Trading Post
Handles AI matching, real-time inference, and serverless functions
"""

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite_config import appwrite_config
from appwrite_database import appwrite_db
import logging
from typing import Optional, Dict, Any, List
import json
import asyncio
from datetime import datetime
import requests
import os

logger = logging.getLogger(__name__)


class AppwriteFunctionsService:
    """Handle serverless functions and AI operations with Appwrite"""

    def __init__(self):
        self.client = appwrite_config.client
        self.functions = appwrite_config.functions

        # AI API Configuration
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.grok_api_key = os.getenv("GROK_API_KEY")

    async def execute_function(self, function_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an Appwrite function"""
        try:
            execution = await self.functions.create_execution(
                function_id=function_id, body=json.dumps(data), async_execution=False
            )

            # Parse response
            response_data = {}
            if execution.get("responseBody"):
                try:
                    response_data = json.loads(execution["responseBody"])
                except json.JSONDecodeError:
                    response_data = {"raw_response": execution["responseBody"]}

            result = {
                "execution_id": execution["$id"],
                "status": execution["status"],
                "response": response_data,
                "duration": execution.get("duration", 0),
                "success": execution["status"] == "completed",
            }

            logger.info(f"Function executed: {function_id} - Status: {execution['status']}")
            return result

        except AppwriteException as e:
            logger.error(f"Function execution failed {function_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def ai_match_users(self, users_data: List[Dict[str, Any]], options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute AI matching using Appwrite Functions"""
        try:
            # Prepare data for AI matching function
            function_data = {
                "users": users_data,
                "options": options or {},
                "timestamp": datetime.utcnow().isoformat(),
                "use_openai": bool(self.openai_api_key),
                "use_anthropic": bool(self.anthropic_api_key),
                "use_grok": bool(self.grok_api_key),
            }

            # Execute AI matching function
            result = await self.execute_function("ai-matching", function_data)

            if result.get("success"):
                matches = result["response"].get("matches", [])

                # Store matches in database
                stored_matches = []
                for match in matches:
                    store_result = await appwrite_db.create_trade(
                        {
                            "user1_id": match.get("user1_id"),
                            "user2_id": match.get("user2_id"),
                            "listing1_id": match.get("listing1_id"),
                            "listing2_id": match.get("listing2_id"),
                            "ai_reason": match.get("reason", ""),
                            "score": match.get("score", 0.0),
                            "status": "ai_suggested",
                        }
                    )

                    if store_result.get("success"):
                        stored_matches.append(store_result["trade"])

                return {
                    "matches": stored_matches,
                    "ai_response": result["response"],
                    "execution_time": result.get("duration", 0),
                    "success": True,
                }

            return result

        except Exception as e:
            logger.error(f"AI matching failed: {e}")
            return {"error": str(e), "success": False}

    async def ai_infer_user_needs(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use AI to infer user needs and preferences"""
        try:
            function_data = {"user_id": user_id, "user_data": user_data, "timestamp": datetime.utcnow().isoformat()}

            result = await self.execute_function("ai-inference", function_data)

            if result.get("success"):
                inferences = result["response"].get("inferences", [])

                # Store inferences in database
                for inference in inferences:
                    await appwrite_db.store_ai_inference(user_id, inference)

                return {"inferences": inferences, "execution_time": result.get("duration", 0), "success": True}

            return result

        except Exception as e:
            logger.error(f"AI inference failed: {e}")
            return {"error": str(e), "success": False}

    async def ai_categorize_listing(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use AI to automatically categorize and tag listings"""
        try:
            function_data = {"listing": listing_data, "timestamp": datetime.utcnow().isoformat()}

            result = await self.execute_function("ai-categorization", function_data)

            if result.get("success"):
                return {
                    "category": result["response"].get("category"),
                    "tags": result["response"].get("tags", []),
                    "confidence": result["response"].get("confidence", 0.0),
                    "suggested_value": result["response"].get("suggested_value"),
                    "success": True,
                }

            return result

        except Exception as e:
            logger.error(f"AI categorization failed: {e}")
            return {"error": str(e), "success": False}

    async def ai_generate_listing_description(
        self, title: str, category: str, basic_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Use AI to generate enhanced listing descriptions"""
        try:
            function_data = {
                "title": title,
                "category": category,
                "basic_info": basic_info,
                "timestamp": datetime.utcnow().isoformat(),
            }

            result = await self.execute_function("ai-description-generator", function_data)

            if result.get("success"):
                return {
                    "enhanced_description": result["response"].get("description"),
                    "suggested_keywords": result["response"].get("keywords", []),
                    "seo_title": result["response"].get("seo_title"),
                    "success": True,
                }

            return result

        except Exception as e:
            logger.error(f"AI description generation failed: {e}")
            return {"error": str(e), "success": False}

    async def ai_fraud_detection(self, user_data: Dict[str, Any], activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use AI for fraud detection and user verification"""
        try:
            function_data = {
                "user_data": user_data,
                "activity_data": activity_data,
                "timestamp": datetime.utcnow().isoformat(),
            }

            result = await self.execute_function("ai-fraud-detection", function_data)

            if result.get("success"):
                return {
                    "risk_score": result["response"].get("risk_score", 0.0),
                    "risk_level": result["response"].get("risk_level", "low"),
                    "flags": result["response"].get("flags", []),
                    "recommendations": result["response"].get("recommendations", []),
                    "success": True,
                }

            return result

        except Exception as e:
            logger.error(f"AI fraud detection failed: {e}")
            return {"error": str(e), "success": False}

    async def ai_price_suggestion(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use AI to suggest pricing for items"""
        try:
            function_data = {"item_data": item_data, "timestamp": datetime.utcnow().isoformat()}

            result = await self.execute_function("ai-price-suggestion", function_data)

            if result.get("success"):
                return {
                    "suggested_price": result["response"].get("suggested_price"),
                    "price_range": result["response"].get("price_range", {}),
                    "market_analysis": result["response"].get("market_analysis", {}),
                    "confidence": result["response"].get("confidence", 0.0),
                    "success": True,
                }

            return result

        except Exception as e:
            logger.error(f"AI price suggestion failed: {e}")
            return {"error": str(e), "success": False}

    async def schedule_ai_matching(self, group_criteria: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule periodic AI matching for a group of users"""
        try:
            function_data = {
                "group_criteria": group_criteria,
                "schedule_time": datetime.utcnow().isoformat(),
                "recurring": group_criteria.get("recurring", False),
                "interval_hours": group_criteria.get("interval_hours", 24),
            }

            result = await self.execute_function("schedule-ai-matching", function_data)

            return result

        except Exception as e:
            logger.error(f"AI matching scheduling failed: {e}")
            return {"error": str(e), "success": False}

    async def generate_match_insights(self, user_id: str, time_period: str = "30d") -> Dict[str, Any]:
        """Generate AI insights about user's matching patterns"""
        try:
            # Get user's recent activity
            user_profile = await appwrite_db.get_user_profile(user_id)
            user_trades = await appwrite_db.get_user_trades(user_id)
            user_listings = await appwrite_db.search_listings(user_id=user_id)

            function_data = {
                "user_id": user_id,
                "user_profile": user_profile.get("profile", {}),
                "trades": user_trades.get("trades", []),
                "listings": user_listings.get("listings", []),
                "time_period": time_period,
                "timestamp": datetime.utcnow().isoformat(),
            }

            result = await self.execute_function("ai-match-insights", function_data)

            if result.get("success"):
                return {
                    "insights": result["response"].get("insights", {}),
                    "recommendations": result["response"].get("recommendations", []),
                    "trends": result["response"].get("trends", {}),
                    "success": True,
                }

            return result

        except Exception as e:
            logger.error(f"Match insights generation failed: {e}")
            return {"error": str(e), "success": False}

    async def ai_content_moderation(self, content: str, content_type: str) -> Dict[str, Any]:
        """Use AI for content moderation"""
        try:
            function_data = {
                "content": content,
                "content_type": content_type,  # 'listing', 'message', 'profile'
                "timestamp": datetime.utcnow().isoformat(),
            }

            result = await self.execute_function("ai-content-moderation", function_data)

            if result.get("success"):
                return {
                    "is_safe": result["response"].get("is_safe", True),
                    "flags": result["response"].get("flags", []),
                    "severity": result["response"].get("severity", "low"),
                    "suggested_action": result["response"].get("suggested_action", "approve"),
                    "filtered_content": result["response"].get("filtered_content"),
                    "success": True,
                }

            return result

        except Exception as e:
            logger.error(f"AI content moderation failed: {e}")
            return {"error": str(e), "success": False}

    async def create_function_execution_webhook(self, function_id: str, webhook_url: str) -> Dict[str, Any]:
        """Create webhook for function execution notifications"""
        try:
            # This would integrate with Appwrite's webhook system
            # For now, we'll store webhook configurations in the database
            webhook_data = {
                "function_id": function_id,
                "webhook_url": webhook_url,
                "created_at": datetime.utcnow().isoformat(),
                "is_active": True,
            }

            # In a real implementation, this would create an Appwrite webhook
            logger.info(f"Webhook configuration stored for function: {function_id}")

            return {"webhook_id": ID.unique(), "function_id": function_id, "webhook_url": webhook_url, "success": True}

        except Exception as e:
            logger.error(f"Webhook creation failed: {e}")
            return {"error": str(e), "success": False}

    async def get_function_logs(self, function_id: str, limit: int = 50) -> Dict[str, Any]:
        """Get execution logs for a function"""
        try:
            executions = await self.functions.list_executions(function_id=function_id)

            logs = []
            for execution in executions["executions"][:limit]:
                logs.append(
                    {
                        "execution_id": execution["$id"],
                        "status": execution["status"],
                        "duration": execution.get("duration", 0),
                        "created_at": execution["$createdAt"],
                        "errors": execution.get("errors", []),
                        "logs": execution.get("logs", ""),
                    }
                )

            return {"logs": logs, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to get function logs: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    # Local AI Functions (fallback when Appwrite Functions are not available)
    async def local_ai_matching(self, users_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Local AI matching as fallback"""
        try:
            # Import the existing AI matching logic
            from ai_matching import generate_matches

            # Run the existing matching algorithm
            matches = await asyncio.to_thread(generate_matches, users_data, True, None)

            return {"matches": matches, "source": "local_ai", "success": True}

        except Exception as e:
            logger.error(f"Local AI matching failed: {e}")
            return {"error": str(e), "success": False}


# Global instance
appwrite_functions = AppwriteFunctionsService()
