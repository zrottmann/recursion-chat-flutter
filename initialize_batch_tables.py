#!/usr/bin/env python3
"""
Initialize Batch Processing Database Tables
Creates the necessary tables for the batch processing system
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

def create_batch_processing_tables(db_path):
    """Create batch processing tables"""
    
    logger.info(f"🗄️  Creating batch processing tables in {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create batch_jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS batch_jobs (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                operation_type TEXT NOT NULL,
                status TEXT NOT NULL,
                total_items INTEGER NOT NULL,
                processed_items INTEGER DEFAULT 0,
                successful_items INTEGER DEFAULT 0,
                failed_items INTEGER DEFAULT 0,
                progress_percentage REAL DEFAULT 0.0,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                estimated_completion TIMESTAMP,
                error_message TEXT,
                result_data TEXT,
                options TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create batch_items table  
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS batch_items (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                item_index INTEGER NOT NULL,
                data TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                error_message TEXT,
                processed_at TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES batch_jobs (id)
            )
        """)
        
        # Create indexes for better performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id 
            ON batch_jobs (user_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_batch_jobs_status 
            ON batch_jobs (status)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at 
            ON batch_jobs (created_at DESC)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_batch_items_job_id 
            ON batch_items (job_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_batch_items_status 
            ON batch_items (status)
        """)
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Batch processing tables created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create batch processing tables: {e}")
        return False

def create_2fa_tables(db_path):
    """Create 2FA tables"""
    
    logger.info(f"🔐 Creating 2FA tables in {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create user_two_factor table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_two_factor (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                totp_secret TEXT,
                totp_enabled BOOLEAN DEFAULT FALSE,
                totp_verified BOOLEAN DEFAULT FALSE,
                backup_codes TEXT,
                backup_codes_used TEXT DEFAULT '[]',
                sms_enabled BOOLEAN DEFAULT FALSE,
                phone_number TEXT,
                phone_verified BOOLEAN DEFAULT FALSE,
                last_used_at TIMESTAMP,
                failed_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create two_factor_attempts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS two_factor_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                attempt_type TEXT NOT NULL,
                success BOOLEAN NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                error_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for 2FA tables
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_two_factor_user_id 
            ON user_two_factor (user_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_user_id 
            ON two_factor_attempts (user_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_created_at 
            ON two_factor_attempts (created_at DESC)
        """)
        
        conn.commit()
        conn.close()
        
        logger.info("✅ 2FA tables created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create 2FA tables: {e}")
        return False

def verify_tables(db_path):
    """Verify that all tables were created correctly"""
    
    logger.info("🔍 Verifying table creation...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for batch processing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'batch_%'")
        batch_tables = cursor.fetchall()
        
        # Check for 2FA tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_two_factor', 'two_factor_attempts')")
        tfa_tables = cursor.fetchall()
        
        # Check for indexes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
        indexes = cursor.fetchall()
        
        conn.close()
        
        logger.info(f"   📊 Batch processing tables: {len(batch_tables)}")
        for table in batch_tables:
            logger.info(f"      • {table[0]}")
        
        logger.info(f"   🔐 2FA tables: {len(tfa_tables)}")  
        for table in tfa_tables:
            logger.info(f"      • {table[0]}")
        
        logger.info(f"   📈 Indexes created: {len(indexes)}")
        for index in indexes:
            logger.info(f"      • {index[0]}")
        
        # Verify expected tables exist
        expected_batch_tables = {'batch_jobs', 'batch_items'}
        actual_batch_tables = {table[0] for table in batch_tables}
        
        expected_2fa_tables = {'user_two_factor', 'two_factor_attempts'}
        actual_2fa_tables = {table[0] for table in tfa_tables}
        
        batch_success = expected_batch_tables.issubset(actual_batch_tables)
        tfa_success = expected_2fa_tables.issubset(actual_2fa_tables)
        
        if batch_success and tfa_success:
            logger.info("✅ All tables verified successfully")
            return True
        else:
            if not batch_success:
                missing = expected_batch_tables - actual_batch_tables
                logger.error(f"❌ Missing batch tables: {missing}")
            if not tfa_success:
                missing = expected_2fa_tables - actual_2fa_tables
                logger.error(f"❌ Missing 2FA tables: {missing}")
            return False
        
    except Exception as e:
        logger.error(f"❌ Table verification failed: {e}")
        return False

def main():
    """Main initialization function"""
    
    logger.info("🚀 Initializing Trading Post Database Tables")
    logger.info("=" * 60)
    logger.info(f"Initialization started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)
    
    # Get database path
    db_path = get_database_path()
    logger.info(f"📂 Database path: {db_path}")
    
    success = True
    
    # Create batch processing tables
    if not create_batch_processing_tables(db_path):
        success = False
    
    # Create 2FA tables
    if not create_2fa_tables(db_path):
        success = False
    
    # Verify all tables
    if not verify_tables(db_path):
        success = False
    
    # Summary
    logger.info("\n" + "=" * 60)
    if success:
        logger.info("✅ DATABASE INITIALIZATION COMPLETED SUCCESSFULLY")
        logger.info("🎉 Trading Post is ready for batch processing and 2FA!")
    else:
        logger.error("❌ DATABASE INITIALIZATION FAILED")
        logger.error("Some tables may not have been created correctly")
    
    logger.info("=" * 60)
    logger.info(f"Initialization finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)