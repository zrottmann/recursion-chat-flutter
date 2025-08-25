#!/usr/bin/env python3
"""
Database Performance Optimization Script for Trading Post
Applies critical database optimizations to improve query performance
"""

import os
import sys
import sqlite3
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_database_path():
    """Get the database file path"""
    # Check common locations
    possible_paths = [
        "trading_post.db",
        "tradingpost.db",
        os.path.join(os.path.dirname(__file__), "trading_post.db"),
        os.path.join(os.path.dirname(__file__), "tradingpost.db")
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # If no database exists, use the default name
    return "trading_post.db"

def analyze_database_structure(db_path):
    """Analyze current database structure"""
    logger.info("🔍 Analyzing database structure...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        analysis = {
            "tables": [],
            "total_rows": 0,
            "indexes": []
        }
        
        for (table_name,) in tables:
            try:
                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                
                # Get table info
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                
                # Get indexes for this table
                cursor.execute(f"PRAGMA index_list({table_name})")
                table_indexes = cursor.fetchall()
                
                table_info = {
                    "name": table_name,
                    "row_count": row_count,
                    "column_count": len(columns),
                    "index_count": len(table_indexes),
                    "columns": [col[1] for col in columns],  # Column names
                    "indexes": [idx[1] for idx in table_indexes]  # Index names
                }
                
                analysis["tables"].append(table_info)
                analysis["total_rows"] += row_count
                
                logger.info(f"   📊 Table '{table_name}': {row_count} rows, {len(columns)} columns, {len(table_indexes)} indexes")
                
            except Exception as e:
                logger.warning(f"   ⚠️  Could not analyze table '{table_name}': {e}")
        
        # Get all indexes in database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index';")
        all_indexes = cursor.fetchall()
        analysis["indexes"] = [idx[0] for idx in all_indexes]
        
        conn.close()
        return analysis
        
    except Exception as e:
        logger.error(f"❌ Database analysis failed: {e}")
        return None

def apply_performance_indexes(db_path):
    """Apply performance-critical database indexes"""
    logger.info("🔧 Applying performance optimization indexes...")
    
    # Critical indexes for Trading Post performance
    optimization_indexes = [
        {
            "name": "idx_items_created_at",
            "sql": "CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);",
            "description": "Speed up item sorting by creation date"
        },
        {
            "name": "idx_items_user_id",
            "sql": "CREATE INDEX IF NOT EXISTS idx_items_user_id ON items (user_id);",
            "description": "Speed up user's item lookups"
        },
        {
            "name": "idx_items_category",
            "sql": "CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);",
            "description": "Speed up category-based item searches"
        },
        {
            "name": "idx_items_is_available",
            "sql": "CREATE INDEX IF NOT EXISTS idx_items_is_available ON items (is_available);",
            "description": "Speed up available item filtering"
        },
        {
            "name": "idx_items_location",
            "sql": "CREATE INDEX IF NOT EXISTS idx_items_location ON items (latitude, longitude);",
            "description": "Speed up location-based searches"
        },
        {
            "name": "idx_trades_status",
            "sql": "CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status);",
            "description": "Speed up trade status filtering"
        },
        {
            "name": "idx_trades_created_at",
            "sql": "CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades (created_at DESC);",
            "description": "Speed up trade history queries"
        },
        {
            "name": "idx_trades_initiator_id",
            "sql": "CREATE INDEX IF NOT EXISTS idx_trades_initiator_id ON trades (initiator_id);",
            "description": "Speed up user trade lookups"
        },
        {
            "name": "idx_trades_receiver_id",
            "sql": "CREATE INDEX IF NOT EXISTS idx_trades_receiver_id ON trades (receiver_id);",
            "description": "Speed up received trade lookups"
        },
        {
            "name": "idx_messages_conversation",
            "sql": "CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (sender_id, receiver_id, created_at);",
            "description": "Speed up conversation queries"
        },
        {
            "name": "idx_users_email",
            "sql": "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);",
            "description": "Speed up user authentication"
        },
        {
            "name": "idx_users_username",
            "sql": "CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);",
            "description": "Speed up username lookups"
        },
        {
            "name": "idx_wants_user_id",
            "sql": "CREATE INDEX IF NOT EXISTS idx_wants_user_id ON wants (user_id);",
            "description": "Speed up user wants/wishlist queries"
        },
        {
            "name": "idx_wants_item_type",
            "sql": "CREATE INDEX IF NOT EXISTS idx_wants_item_type ON wants (item_type);",
            "description": "Speed up wants matching by item type"
        }
    ]
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        applied_optimizations = []
        failed_optimizations = []
        
        for optimization in optimization_indexes:
            try:
                cursor.execute(optimization["sql"])
                applied_optimizations.append(optimization)
                logger.info(f"   ✅ Created index: {optimization['name']} - {optimization['description']}")
                
            except Exception as e:
                failed_optimizations.append({
                    "optimization": optimization,
                    "error": str(e)
                })
                logger.warning(f"   ⚠️  Failed to create index {optimization['name']}: {e}")
        
        conn.commit()
        conn.close()
        
        return {
            "applied": applied_optimizations,
            "failed": failed_optimizations,
            "success_count": len(applied_optimizations),
            "total_count": len(optimization_indexes)
        }
        
    except Exception as e:
        logger.error(f"❌ Index optimization failed: {e}")
        return None

def analyze_query_patterns(db_path):
    """Analyze common query patterns for optimization opportunities"""
    logger.info("📈 Analyzing query patterns...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        patterns = []
        
        # Check for tables that might need optimization
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        for (table_name,) in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                
                if row_count > 1000:  # Large table that might benefit from optimization
                    patterns.append({
                        "table": table_name,
                        "row_count": row_count,
                        "recommendation": f"Large table with {row_count} rows - ensure proper indexing"
                    })
                    
            except Exception as e:
                logger.warning(f"Could not analyze {table_name}: {e}")
        
        conn.close()
        return patterns
        
    except Exception as e:
        logger.error(f"Query pattern analysis failed: {e}")
        return []

def run_pragma_optimizations(db_path):
    """Apply SQLite PRAGMA optimizations"""
    logger.info("⚙️ Applying SQLite performance optimizations...")
    
    pragma_optimizations = [
        {
            "name": "WAL Mode",
            "sql": "PRAGMA journal_mode=WAL;",
            "description": "Enable Write-Ahead Logging for better concurrency"
        },
        {
            "name": "Synchronous Normal",
            "sql": "PRAGMA synchronous=NORMAL;",
            "description": "Balance between safety and performance"
        },
        {
            "name": "Cache Size",
            "sql": "PRAGMA cache_size=10000;",
            "description": "Increase cache size for better performance"
        },
        {
            "name": "Temp Store Memory",
            "sql": "PRAGMA temp_store=MEMORY;",
            "description": "Store temporary tables in memory"
        },
        {
            "name": "Optimize",
            "sql": "PRAGMA optimize;",
            "description": "Analyze and optimize query planner statistics"
        }
    ]
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        applied = []
        
        for pragma in pragma_optimizations:
            try:
                cursor.execute(pragma["sql"])
                applied.append(pragma)
                logger.info(f"   ✅ Applied: {pragma['name']} - {pragma['description']}")
                
            except Exception as e:
                logger.warning(f"   ⚠️  Failed to apply {pragma['name']}: {e}")
        
        conn.commit()
        conn.close()
        
        return applied
        
    except Exception as e:
        logger.error(f"PRAGMA optimization failed: {e}")
        return []

def main():
    """Main optimization routine"""
    logger.info("🚀 Starting Trading Post Database Optimization...")
    logger.info("=" * 60)
    
    # Get database path
    db_path = get_database_path()
    logger.info(f"📂 Database path: {db_path}")
    
    if not os.path.exists(db_path):
        logger.warning(f"⚠️  Database file not found at {db_path}")
        logger.info("This script should be run after the database has been created.")
        return
    
    # Step 1: Analyze current database structure
    analysis = analyze_database_structure(db_path)
    
    if analysis:
        print("\n📊 DATABASE ANALYSIS RESULTS:")
        print(f"   Total tables: {len(analysis['tables'])}")
        print(f"   Total rows: {analysis['total_rows']:,}")
        print(f"   Existing indexes: {len(analysis['indexes'])}")
        
        # Show large tables that need attention
        large_tables = [t for t in analysis['tables'] if t['row_count'] > 1000]
        if large_tables:
            print(f"\n📈 Large tables requiring optimization:")
            for table in large_tables:
                print(f"   • {table['name']}: {table['row_count']:,} rows, {table['index_count']} indexes")
    
    # Step 2: Apply performance indexes
    index_results = apply_performance_indexes(db_path)
    
    if index_results:
        print(f"\n🔧 INDEX OPTIMIZATION RESULTS:")
        print(f"   Indexes applied: {index_results['success_count']}/{index_results['total_count']}")
        
        if index_results['failed']:
            print(f"   Failed optimizations: {len(index_results['failed'])}")
            for failed in index_results['failed']:
                print(f"   ❌ {failed['optimization']['name']}: {failed['error']}")
    
    # Step 3: Apply PRAGMA optimizations
    pragma_results = run_pragma_optimizations(db_path)
    
    if pragma_results:
        print(f"\n⚙️ PRAGMA OPTIMIZATIONS APPLIED: {len(pragma_results)}")
    
    # Step 4: Analyze query patterns
    patterns = analyze_query_patterns(db_path)
    
    if patterns:
        print(f"\n📈 QUERY PATTERN ANALYSIS:")
        for pattern in patterns:
            print(f"   • {pattern['table']}: {pattern['recommendation']}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 OPTIMIZATION SUMMARY")
    print("=" * 60)
    
    total_optimizations = len(index_results.get('applied', [])) + len(pragma_results)
    print(f"   🔧 Total optimizations applied: {total_optimizations}")
    print(f"   📊 Database tables analyzed: {len(analysis.get('tables', []))}")
    print(f"   📈 Query patterns identified: {len(patterns)}")
    
    print("\n💡 RECOMMENDATIONS:")
    print("   1. Monitor query performance after these optimizations")
    print("   2. Consider adding application-level caching for frequently accessed data")
    print("   3. Regularly run PRAGMA optimize; to maintain performance")
    print("   4. Monitor database growth and add indexes as needed")
    
    # Save optimization report
    report_filename = f"database_optimization_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    with open(report_filename, 'w') as f:
        f.write(f"Trading Post Database Optimization Report\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Database: {db_path}\n\n")
        
        f.write(f"Indexes Applied: {index_results.get('success_count', 0)}\n")
        for opt in index_results.get('applied', []):
            f.write(f"  - {opt['name']}: {opt['description']}\n")
        
        f.write(f"\nPRAGMA Optimizations: {len(pragma_results)}\n")
        for pragma in pragma_results:
            f.write(f"  - {pragma['name']}: {pragma['description']}\n")
        
        f.write(f"\nAnalysis Results:\n")
        f.write(f"  Tables: {len(analysis.get('tables', []))}\n")
        f.write(f"  Total Rows: {analysis.get('total_rows', 0):,}\n")
        f.write(f"  Large Tables: {len([t for t in analysis.get('tables', []) if t['row_count'] > 1000])}\n")
    
    print(f"\n💾 Optimization report saved: {report_filename}")
    
    logger.info("✅ Database optimization completed successfully!")

if __name__ == "__main__":
    main()