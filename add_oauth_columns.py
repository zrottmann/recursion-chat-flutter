#!/usr/bin/env python3

"""
Add OAuth and password reset columns to the User table.
This migration script adds support for Google OAuth authentication.
"""

import sqlite3
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migration():
    """Add OAuth and password reset columns to users table"""

    # Database file path
    db_path = Path("tradingpost.db")

    if not db_path.exists():
        logger.error(f"Database file {db_path} not found!")
        return False

    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        migrations_needed = []

        # Check each new column
        new_columns = [
            ("password_reset_token", "TEXT"),
            ("password_reset_expires", "DATETIME"),
            ("oauth_provider", "TEXT"),
            ("oauth_id", "TEXT"),
            ("profile_picture", "TEXT"),
            ("is_verified", "BOOLEAN DEFAULT 0"),
        ]

        for column_name, column_type in new_columns:
            if column_name not in columns:
                migrations_needed.append((column_name, column_type))

        if not migrations_needed:
            logger.info("All OAuth columns already exist. No migration needed.")
            return True

        # Run migrations
        for column_name, column_type in migrations_needed:
            logger.info(f"Adding column: {column_name} ({column_type})")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")

        # Commit changes
        conn.commit()
        logger.info(f"Successfully added {len(migrations_needed)} columns to users table")

        # Verify columns were added
        cursor.execute("PRAGMA table_info(users)")
        new_columns_list = [row[1] for row in cursor.fetchall()]
        logger.info(f"Users table now has columns: {new_columns_list}")

        return True

    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    logger.info("Starting OAuth migration...")
    success = run_migration()
    if success:
        logger.info("Migration completed successfully!")
    else:
        logger.error("Migration failed!")
        exit(1)
