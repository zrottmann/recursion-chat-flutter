#!/usr/bin/env python3
"""
Complete Database Initialization for Trading Post
Creates all required tables for the application to function properly
"""

import sqlite3
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_database_path():
    """Get the database file path"""
    possible_paths = [
        "trading_post.db",
        "tradingpost.db",
        os.path.join(os.path.dirname(__file__), "trading_post.db"),
        os.path.join(os.path.dirname(__file__), "tradingpost.db")
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # Default to trading_post.db
    return "trading_post.db"

def create_core_tables(db_path):
    """Create core application tables"""
    
    logger.info(f"👥 Creating core application tables in {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                profile_picture_url TEXT,
                bio TEXT,
                location TEXT,
                rating REAL DEFAULT 0.0,
                total_trades INTEGER DEFAULT 0
            )
        """)
        
        # Create items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                condition_rating INTEGER DEFAULT 5,
                estimated_value REAL DEFAULT 0.0,
                image_urls TEXT,
                latitude REAL,
                longitude REAL,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Create trades table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                initiator_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                initiator_item_ids TEXT,
                receiver_item_ids TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                trade_value REAL DEFAULT 0.0,
                notes TEXT,
                FOREIGN KEY (initiator_id) REFERENCES users (id),
                FOREIGN KEY (receiver_id) REFERENCES users (id)
            )
        """)
        
        # Create messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                trade_id INTEGER,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                message_type TEXT DEFAULT 'text',
                FOREIGN KEY (sender_id) REFERENCES users (id),
                FOREIGN KEY (receiver_id) REFERENCES users (id),
                FOREIGN KEY (trade_id) REFERENCES trades (id)
            )
        """)
        
        # Create wants/wishlist table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                description TEXT,
                max_value REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Create notifications table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                related_id INTEGER,
                related_type TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Create user_sessions table for enhanced security
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Core application tables created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create core tables: {e}")
        return False

def create_performance_indexes(db_path):
    """Create performance indexes for all tables"""
    
    logger.info(f"📈 Creating performance indexes in {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # User indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC)")
        
        # Item indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_user_id ON items (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_category ON items (category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_is_available ON items (is_available)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_location ON items (latitude, longitude)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_value ON items (estimated_value)")
        
        # Trade indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trades_initiator_id ON trades (initiator_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trades_receiver_id ON trades (receiver_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades (created_at DESC)")
        
        # Message indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_trade_id ON messages (trade_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (sender_id, receiver_id, created_at)")
        
        # Wants indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wants_user_id ON wants (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wants_item_type ON wants (item_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wants_is_active ON wants (is_active)")
        
        # Notification indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC)")
        
        # Session indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (session_token)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at)")
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Performance indexes created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create performance indexes: {e}")
        return False

def apply_sqlite_optimizations(db_path):
    """Apply SQLite performance optimizations"""
    
    logger.info(f"⚡ Applying SQLite optimizations to {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Apply PRAGMA optimizations
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=10000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.execute("PRAGMA mmap_size=268435456")  # 256MB
        cursor.execute("PRAGMA optimize")
        
        conn.commit()
        conn.close()
        
        logger.info("✅ SQLite optimizations applied successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to apply SQLite optimizations: {e}")
        return False

def verify_database_completeness(db_path):
    """Verify that all tables and indexes are created"""
    
    logger.info("🔍 Verifying database completeness...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for all required tables
        expected_tables = {
            'users', 'items', 'trades', 'messages', 'wants', 'notifications',
            'user_sessions', 'batch_jobs', 'batch_items', 'user_two_factor', 
            'two_factor_attempts'
        }
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        actual_tables = {row[0] for row in cursor.fetchall()}
        
        missing_tables = expected_tables - actual_tables
        if missing_tables:
            logger.error(f"❌ Missing tables: {missing_tables}")
            return False
        
        logger.info(f"✅ All {len(expected_tables)} required tables present")
        
        # Check for indexes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
        indexes = cursor.fetchall()
        logger.info(f"✅ {len(indexes)} performance indexes created")
        
        # Check database size and row counts
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        total_rows = 0
        for (table_name,) in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                total_rows += row_count
                logger.info(f"   📊 {table_name}: {row_count} rows")
            except Exception as e:
                logger.warning(f"   ⚠️ Could not count rows in {table_name}: {e}")
        
        logger.info(f"📈 Total database rows: {total_rows}")
        
        # Get database file size
        db_size = os.path.getsize(db_path) / 1024  # KB
        logger.info(f"💾 Database size: {db_size:.2f} KB")
        
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Database verification failed: {e}")
        return False

def create_sample_data(db_path):
    """Create sample data for testing (optional)"""
    
    logger.info("🎯 Creating sample data for testing...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if users already exist
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        if user_count == 0:
            # Create sample users
            sample_users = [
                ('testuser1', 'test1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewvyQ5U4B0Oq4KPG'),  # password: test123
                ('testuser2', 'test2@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewvyQ5U4B0Oq4KPG'),  # password: test123
            ]
            
            for username, email, password in sample_users:
                cursor.execute("""
                    INSERT INTO users (username, email, hashed_password, bio, location)
                    VALUES (?, ?, ?, ?, ?)
                """, (username, email, password, f"Sample user {username}", "New York, NY"))
            
            logger.info(f"✅ Created {len(sample_users)} sample users")
            
            # Create sample items
            sample_items = [
                (1, "iPhone 13 Pro", "Excellent condition iPhone", "Electronics", 9, 800.0),
                (1, "MacBook Air M2", "Lightly used laptop", "Electronics", 8, 1200.0),
                (2, "Nike Air Max", "Size 10 sneakers", "Clothing", 7, 150.0),
                (2, "Vintage Guitar", "1980s electric guitar", "Music", 8, 500.0)
            ]
            
            for user_id, title, desc, category, condition, value in sample_items:
                cursor.execute("""
                    INSERT INTO items (user_id, title, description, category, condition_rating, estimated_value)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user_id, title, desc, category, condition, value))
            
            logger.info(f"✅ Created {len(sample_items)} sample items")
            
        else:
            logger.info(f"ℹ️ Database already has {user_count} users, skipping sample data creation")
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create sample data: {e}")
        return False

def main():
    """Main database initialization function"""
    
    logger.info("🚀 COMPLETE TRADING POST DATABASE INITIALIZATION")
    logger.info("=" * 70)
    logger.info(f"Initialization started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)
    
    # Get database path
    db_path = get_database_path()
    logger.info(f"📂 Database path: {db_path}")
    
    success = True
    
    # Create core application tables
    if not create_core_tables(db_path):
        success = False
    
    # Create performance indexes
    if not create_performance_indexes(db_path):
        success = False
    
    # Apply SQLite optimizations
    if not apply_sqlite_optimizations(db_path):
        success = False
    
    # Create sample data for testing
    if not create_sample_data(db_path):
        success = False
    
    # Verify database completeness
    if not verify_database_completeness(db_path):
        success = False
    
    # Summary
    logger.info("\n" + "=" * 70)
    if success:
        logger.info("✅ COMPLETE DATABASE INITIALIZATION SUCCESSFUL")
        logger.info("🎉 Trading Post database is fully ready!")
        logger.info("📊 All tables, indexes, and optimizations applied")
        logger.info("🔧 Sample data created for testing")
    else:
        logger.error("❌ DATABASE INITIALIZATION FAILED")
        logger.error("Some components may not have been created correctly")
    
    logger.info("=" * 70)
    logger.info(f"Initialization finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)