#!/usr/bin/env python3
"""
Database Migration Script: SQLite/PostgreSQL to Appwrite
Migrates all existing data from the current database to Appwrite Cloud
"""

import os
import sys
import sqlite3
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import argparse

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import Appwrite services
from appwrite_config import appwrite_config, DATABASE_ID, COLLECTIONS
from appwrite_database import appwrite_db
from appwrite_auth import appwrite_auth
from appwrite_storage import appwrite_storage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("migration.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


class DatabaseMigration:
    """Handles migration from SQLite/PostgreSQL to Appwrite"""

    def __init__(self, source_db_path: str, dry_run: bool = False):
        self.source_db_path = source_db_path
        self.dry_run = dry_run
        self.migration_stats = {
            "users_migrated": 0,
            "listings_migrated": 0,
            "trades_migrated": 0,
            "messages_migrated": 0,
            "errors": [],
        }

        # Connect to source database
        try:
            self.source_conn = sqlite3.connect(source_db_path)
            self.source_conn.row_factory = sqlite3.Row  # Enable column access by name
            logger.info(f"Connected to source database: {source_db_path}")
        except Exception as e:
            logger.error(f"Failed to connect to source database: {e}")
            raise

    def get_source_data(self, table_name: str) -> List[Dict[str, Any]]:
        """Get all data from a source table"""
        try:
            cursor = self.source_conn.cursor()
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()

            # Convert rows to dictionaries
            data = []
            for row in rows:
                data.append(dict(row))

            logger.info(f"Retrieved {len(data)} records from {table_name}")
            return data

        except Exception as e:
            logger.error(f"Failed to get data from {table_name}: {e}")
            return []

    def transform_user_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform user data for Appwrite format"""
        try:
            return {
                "name": user_data.get("name", ""),
                "email": user_data.get("email", ""),
                "username": user_data.get("email", "").split("@")[0] if user_data.get("email") else "",
                "age": user_data.get("age"),
                "location": user_data.get("location", ""),
                "bio": user_data.get("bio", ""),
                "phone": user_data.get("phone", ""),
                "profile_image_url": user_data.get("profile_image_url", ""),
                "opt_in_ai": user_data.get("opt_in_ai", True),
                "email_verified": user_data.get("email_verification", False),
                "is_active": True,
                "created_at": user_data.get("created_at", datetime.utcnow().isoformat()),
                "updated_at": datetime.utcnow().isoformat(),
                "preferences": {},
                "ratings": {"average": 0.0, "count": 0},
            }
        except Exception as e:
            logger.error(f"Failed to transform user data: {e}")
            return None

    def transform_listing_data(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform listing data for Appwrite format"""
        try:
            return {
                "user_id": str(listing_data.get("user_id", "")),
                "title": listing_data.get("title", ""),
                "description": listing_data.get("description", ""),
                "category": listing_data.get("category", ""),
                "type": listing_data.get("type", "offer"),
                "condition": listing_data.get("condition", ""),
                "value_estimate": float(listing_data.get("value_estimate", 0.0)),
                "images": [],  # Will be populated if images exist
                "tags": [],
                "location": listing_data.get("location", ""),
                "coordinates": {},
                "is_active": True,
                "is_featured": False,
                "created_at": listing_data.get("created_at", datetime.utcnow().isoformat()),
                "updated_at": datetime.utcnow().isoformat(),
                "expires_at": listing_data.get("expires_at"),
                "view_count": listing_data.get("view_count", 0),
                "save_count": 0,
                "metadata": {},
            }
        except Exception as e:
            logger.error(f"Failed to transform listing data: {e}")
            return None

    def transform_trade_data(self, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform trade data for Appwrite format"""
        try:
            return {
                "user1_id": str(trade_data.get("user1_id", "")),
                "user2_id": str(trade_data.get("user2_id", "")),
                "listing1_id": str(trade_data.get("listing1_id", "")),
                "listing2_id": str(trade_data.get("listing2_id", "")),
                "status": trade_data.get("status", "pending"),
                "ai_reason": trade_data.get("ai_reason", ""),
                "score": float(trade_data.get("score", 0.0)),
                "created_at": trade_data.get("created_at", datetime.utcnow().isoformat()),
                "updated_at": datetime.utcnow().isoformat(),
                "messages": [],
                "meeting_details": {},
                "completion_details": {},
                "feedback": {},
            }
        except Exception as e:
            logger.error(f"Failed to transform trade data: {e}")
            return None

    def transform_message_data(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform message data for Appwrite format"""
        try:
            return {
                "sender_id": str(message_data.get("sender_id", "")),
                "recipient_id": str(message_data.get("recipient_id", "")),
                "trade_id": str(message_data.get("trade_id", "")) if message_data.get("trade_id") else None,
                "content": message_data.get("content", ""),
                "message_type": message_data.get("message_type", "text"),
                "is_read": message_data.get("is_read", False),
                "created_at": message_data.get("created_at", datetime.utcnow().isoformat()),
                "attachments": [],
                "metadata": {},
            }
        except Exception as e:
            logger.error(f"Failed to transform message data: {e}")
            return None

    async def migrate_users(self) -> bool:
        """Migrate users from source database to Appwrite"""
        logger.info("Starting user migration...")

        try:
            source_users = self.get_source_data("users")

            for user_data in source_users:
                try:
                    # Transform user data
                    appwrite_user_data = self.transform_user_data(user_data)
                    if not appwrite_user_data:
                        continue

                    if not self.dry_run:
                        # Create user profile in Appwrite database
                        result = await appwrite_db.create_user_profile(str(user_data["id"]), appwrite_user_data)

                        if result.get("success"):
                            self.migration_stats["users_migrated"] += 1
                            logger.info(f"✅ Migrated user: {user_data.get('email', user_data['id'])}")
                        else:
                            error_msg = f"Failed to migrate user {user_data['id']}: {result.get('error')}"
                            logger.error(error_msg)
                            self.migration_stats["errors"].append(error_msg)
                    else:
                        logger.info(f"[DRY RUN] Would migrate user: {user_data.get('email', user_data['id'])}")
                        self.migration_stats["users_migrated"] += 1

                except Exception as e:
                    error_msg = f"Error migrating user {user_data.get('id', 'unknown')}: {e}"
                    logger.error(error_msg)
                    self.migration_stats["errors"].append(error_msg)

            logger.info(f"User migration completed. Migrated: {self.migration_stats['users_migrated']}")
            return True

        except Exception as e:
            logger.error(f"User migration failed: {e}")
            return False

    async def migrate_listings(self) -> bool:
        """Migrate listings from source database to Appwrite"""
        logger.info("Starting listing migration...")

        try:
            # Check if listings table exists
            cursor = self.source_conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='listings'")
            if not cursor.fetchone():
                logger.warning("No listings table found, skipping listing migration")
                return True

            source_listings = self.get_source_data("listings")

            for listing_data in source_listings:
                try:
                    # Transform listing data
                    appwrite_listing_data = self.transform_listing_data(listing_data)
                    if not appwrite_listing_data:
                        continue

                    if not self.dry_run:
                        # Create listing in Appwrite
                        result = await appwrite_db.create_listing(appwrite_listing_data)

                        if result.get("success"):
                            self.migration_stats["listings_migrated"] += 1
                            logger.info(f"✅ Migrated listing: {listing_data.get('title', listing_data['id'])}")
                        else:
                            error_msg = f"Failed to migrate listing {listing_data['id']}: {result.get('error')}"
                            logger.error(error_msg)
                            self.migration_stats["errors"].append(error_msg)
                    else:
                        logger.info(f"[DRY RUN] Would migrate listing: {listing_data.get('title', listing_data['id'])}")
                        self.migration_stats["listings_migrated"] += 1

                except Exception as e:
                    error_msg = f"Error migrating listing {listing_data.get('id', 'unknown')}: {e}"
                    logger.error(error_msg)
                    self.migration_stats["errors"].append(error_msg)

            logger.info(f"Listing migration completed. Migrated: {self.migration_stats['listings_migrated']}")
            return True

        except Exception as e:
            logger.error(f"Listing migration failed: {e}")
            return False

    async def migrate_trades(self) -> bool:
        """Migrate trades/matches from source database to Appwrite"""
        logger.info("Starting trade migration...")

        try:
            # Check if matches/trades table exists
            cursor = self.source_conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('matches', 'trades')")
            table_result = cursor.fetchone()

            if not table_result:
                logger.warning("No matches/trades table found, skipping trade migration")
                return True

            table_name = table_result[0]
            source_trades = self.get_source_data(table_name)

            for trade_data in source_trades:
                try:
                    # Transform trade data
                    appwrite_trade_data = self.transform_trade_data(trade_data)
                    if not appwrite_trade_data:
                        continue

                    if not self.dry_run:
                        # Create trade in Appwrite
                        result = await appwrite_db.create_trade(appwrite_trade_data)

                        if result.get("success"):
                            self.migration_stats["trades_migrated"] += 1
                            logger.info(f"✅ Migrated trade: {trade_data.get('id')}")
                        else:
                            error_msg = f"Failed to migrate trade {trade_data['id']}: {result.get('error')}"
                            logger.error(error_msg)
                            self.migration_stats["errors"].append(error_msg)
                    else:
                        logger.info(f"[DRY RUN] Would migrate trade: {trade_data.get('id')}")
                        self.migration_stats["trades_migrated"] += 1

                except Exception as e:
                    error_msg = f"Error migrating trade {trade_data.get('id', 'unknown')}: {e}"
                    logger.error(error_msg)
                    self.migration_stats["errors"].append(error_msg)

            logger.info(f"Trade migration completed. Migrated: {self.migration_stats['trades_migrated']}")
            return True

        except Exception as e:
            logger.error(f"Trade migration failed: {e}")
            return False

    async def migrate_messages(self) -> bool:
        """Migrate messages from source database to Appwrite"""
        logger.info("Starting message migration...")

        try:
            # Check if messages table exists
            cursor = self.source_conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'")
            if not cursor.fetchone():
                logger.warning("No messages table found, skipping message migration")
                return True

            source_messages = self.get_source_data("messages")

            for message_data in source_messages:
                try:
                    # Transform message data
                    appwrite_message_data = self.transform_message_data(message_data)
                    if not appwrite_message_data:
                        continue

                    if not self.dry_run:
                        # Create message in Appwrite
                        result = await appwrite_db.create_message(appwrite_message_data)

                        if result.get("success"):
                            self.migration_stats["messages_migrated"] += 1
                            logger.info(f"✅ Migrated message: {message_data.get('id')}")
                        else:
                            error_msg = f"Failed to migrate message {message_data['id']}: {result.get('error')}"
                            logger.error(error_msg)
                            self.migration_stats["errors"].append(error_msg)
                    else:
                        logger.info(f"[DRY RUN] Would migrate message: {message_data.get('id')}")
                        self.migration_stats["messages_migrated"] += 1

                except Exception as e:
                    error_msg = f"Error migrating message {message_data.get('id', 'unknown')}: {e}"
                    logger.error(error_msg)
                    self.migration_stats["errors"].append(error_msg)

            logger.info(f"Message migration completed. Migrated: {self.migration_stats['messages_migrated']}")
            return True

        except Exception as e:
            logger.error(f"Message migration failed: {e}")
            return False

    async def migrate_images(self) -> bool:
        """Migrate image files to Appwrite Storage"""
        logger.info("Starting image migration...")

        try:
            uploads_dir = os.path.join(os.path.dirname(self.source_db_path), "uploads")

            if not os.path.exists(uploads_dir):
                logger.warning("No uploads directory found, skipping image migration")
                return True

            migrated_count = 0

            for filename in os.listdir(uploads_dir):
                file_path = os.path.join(uploads_dir, filename)

                if os.path.isfile(file_path) and filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    try:
                        if not self.dry_run:
                            with open(file_path, "rb") as f:
                                file_data = f.read()

                            # Upload to Appwrite Storage (item images bucket)
                            result = await appwrite_storage.upload_item_image(
                                file_data,
                                filename,
                                "migrated_user",  # Use a generic user ID for migrated images
                                "migrated_listing",
                            )

                            if result.get("success"):
                                migrated_count += 1
                                logger.info(f"✅ Migrated image: {filename}")
                            else:
                                error_msg = f"Failed to migrate image {filename}: {result.get('error')}"
                                logger.error(error_msg)
                                self.migration_stats["errors"].append(error_msg)
                        else:
                            logger.info(f"[DRY RUN] Would migrate image: {filename}")
                            migrated_count += 1

                    except Exception as e:
                        error_msg = f"Error migrating image {filename}: {e}"
                        logger.error(error_msg)
                        self.migration_stats["errors"].append(error_msg)

            logger.info(f"Image migration completed. Migrated: {migrated_count} images")
            return True

        except Exception as e:
            logger.error(f"Image migration failed: {e}")
            return False

    async def run_migration(self) -> bool:
        """Run the complete migration process"""
        logger.info("=" * 60)
        logger.info("STARTING DATABASE MIGRATION TO APPWRITE")
        logger.info("=" * 60)

        if self.dry_run:
            logger.info("🔍 DRY RUN MODE - No data will be actually migrated")

        try:
            # Check Appwrite connectivity
            if not appwrite_config.health_check():
                logger.error("❌ Appwrite health check failed. Cannot proceed with migration.")
                return False

            logger.info("✅ Appwrite connectivity confirmed")

            # Run migrations in order
            success = True

            # 1. Migrate users first (required for foreign keys)
            if not await self.migrate_users():
                success = False

            # 2. Migrate listings
            if not await self.migrate_listings():
                success = False

            # 3. Migrate trades
            if not await self.migrate_trades():
                success = False

            # 4. Migrate messages
            if not await self.migrate_messages():
                success = False

            # 5. Migrate images
            if not await self.migrate_images():
                success = False

            # Print migration summary
            logger.info("=" * 60)
            logger.info("MIGRATION SUMMARY")
            logger.info("=" * 60)
            logger.info(f"Users migrated: {self.migration_stats['users_migrated']}")
            logger.info(f"Listings migrated: {self.migration_stats['listings_migrated']}")
            logger.info(f"Trades migrated: {self.migration_stats['trades_migrated']}")
            logger.info(f"Messages migrated: {self.migration_stats['messages_migrated']}")
            logger.info(f"Total errors: {len(self.migration_stats['errors'])}")

            if self.migration_stats["errors"]:
                logger.error("Migration errors:")
                for error in self.migration_stats["errors"][:10]:  # Show first 10 errors
                    logger.error(f"  - {error}")
                if len(self.migration_stats["errors"]) > 10:
                    logger.error(f"  ... and {len(self.migration_stats['errors']) - 10} more errors")

            if success:
                logger.info("✅ Migration completed successfully!")
            else:
                logger.error("❌ Migration completed with errors")

            return success

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
        finally:
            self.source_conn.close()
            logger.info("Database connections closed")

    def save_migration_report(self, output_file: str = "migration_report.json"):
        """Save detailed migration report"""
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "source_database": self.source_db_path,
            "dry_run": self.dry_run,
            "statistics": self.migration_stats,
            "appwrite_config": {
                "endpoint": appwrite_config.endpoint,
                "project_id": appwrite_config.project_id,
                "database_id": DATABASE_ID,
                "collections": COLLECTIONS,
            },
        }

        with open(output_file, "w") as f:
            json.dump(report, f, indent=2)

        logger.info(f"Migration report saved to: {output_file}")


async def main():
    """Main migration function"""
    parser = argparse.ArgumentParser(description="Migrate Trading Post database to Appwrite")
    parser.add_argument("source_db", help="Path to source SQLite database file")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (no actual migration)")
    parser.add_argument("--report", default="migration_report.json", help="Output file for migration report")

    args = parser.parse_args()

    # Validate source database exists
    if not os.path.exists(args.source_db):
        logger.error(f"Source database not found: {args.source_db}")
        return False

    # Create migration instance
    migration = DatabaseMigration(args.source_db, args.dry_run)

    try:
        # Run migration
        success = await migration.run_migration()

        # Save report
        migration.save_migration_report(args.report)

        return success

    except KeyboardInterrupt:
        logger.info("Migration interrupted by user")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False


if __name__ == "__main__":
    # Check environment variables
    required_env_vars = ["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY"]

    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please set these variables before running the migration script")
        sys.exit(1)

    # Run migration
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
