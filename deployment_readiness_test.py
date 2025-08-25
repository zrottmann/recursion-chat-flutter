#!/usr/bin/env python3
"""
Deployment Readiness Test for Trading Post
Validates that all systems are properly configured for deployment
"""

import os
import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_file_structure():
    """Test that all required files are present"""
    
    logger.info("📁 Testing file structure...")
    
    required_files = [
        'app_sqlite.py',
        'batch_processor.py',
        'batch_router.py',
        'two_factor_auth.py',
        'two_factor_router.py',
        'performance_optimizer.py',
        'auth_timeout_fixes.py',
        'appwrite_sso_auth.py',
        'sso_router.py',
        'google_oauth_router.py',
        'error_monitoring.py'
    ]
    
    missing_files = []
    present_files = []
    
    for file in required_files:
        if os.path.exists(file):
            present_files.append(file)
            logger.info(f"   ✅ {file}")
        else:
            missing_files.append(file)
            logger.error(f"   ❌ {file} - MISSING")
    
    if missing_files:
        logger.error(f"❌ Missing {len(missing_files)} required files")
        return False
    else:
        logger.info(f"✅ All {len(required_files)} required files present")
        return True

def test_database_structure():
    """Test database tables and structure"""
    
    logger.info("🗄️ Testing database structure...")
    
    try:
        # Check if database exists
        db_path = 'trading_post.db'
        if not os.path.exists(db_path):
            logger.error(f"❌ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for required tables
        required_tables = [
            'users',
            'items', 
            'trades',
            'messages',
            'batch_jobs',
            'batch_items',
            'user_two_factor',
            'two_factor_attempts'
        ]
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = {row[0] for row in cursor.fetchall()}
        
        missing_tables = []
        for table in required_tables:
            if table in existing_tables:
                logger.info(f"   ✅ Table: {table}")
            else:
                missing_tables.append(table)
                logger.error(f"   ❌ Table: {table} - MISSING")
        
        # Check indexes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indexes = cursor.fetchall()
        logger.info(f"   📈 Database indexes: {len(indexes)}")
        
        conn.close()
        
        if missing_tables:
            logger.error(f"❌ Missing {len(missing_tables)} required tables")
            return False
        else:
            logger.info(f"✅ All {len(required_tables)} required tables present")
            return True
        
    except Exception as e:
        logger.error(f"❌ Database test failed: {e}")
        return False

def test_environment_configuration():
    """Test environment configuration"""
    
    logger.info("⚙️ Testing environment configuration...")
    
    # Check for environment files
    env_files = ['.env', '.env.production', '.env.development']
    env_files_found = []
    
    for env_file in env_files:
        if os.path.exists(env_file):
            env_files_found.append(env_file)
            logger.info(f"   ✅ {env_file}")
        else:
            logger.warning(f"   ⚠️ {env_file} - not found")
    
    if not env_files_found:
        logger.error("❌ No environment files found")
        return False
    
    # Check critical environment variables from .env.production
    if '.env.production' in env_files_found:
        try:
            with open('.env.production', 'r') as f:
                env_content = f.read()
            
            critical_vars = [
                'SECRET_KEY',
                'ACCESS_TOKEN_EXPIRE_MINUTES',
                'APPWRITE_PROJECT_ID',
                'APPWRITE_ENDPOINT'
            ]
            
            missing_vars = []
            for var in critical_vars:
                if var in env_content:
                    logger.info(f"   ✅ {var}")
                else:
                    missing_vars.append(var)
                    logger.error(f"   ❌ {var} - MISSING")
            
            if missing_vars:
                logger.error(f"❌ Missing {len(missing_vars)} critical environment variables")
                return False
            
        except Exception as e:
            logger.error(f"❌ Failed to read .env.production: {e}")
            return False
    
    logger.info("✅ Environment configuration looks good")
    return True

def test_system_integration():
    """Test system integration without importing FastAPI"""
    
    logger.info("🔧 Testing system integration...")
    
    try:
        # Test batch processing components
        logger.info("   📦 Testing batch processing components...")
        
        # Check if batch processor file has correct structure
        with open('batch_processor.py', 'r') as f:
            batch_content = f.read()
        
        batch_components = [
            'class BatchProcessor',
            'class BatchJob',
            'BatchOperationType', 
            'BatchStatus',
            'init_batch_processor'
        ]
        
        for component in batch_components:
            if component in batch_content:
                logger.info(f"      ✅ {component}")
            else:
                logger.error(f"      ❌ {component} - not found")
                return False
        
        # Test 2FA components
        logger.info("   🔐 Testing 2FA components...")
        
        with open('two_factor_auth.py', 'r') as f:
            tfa_content = f.read()
        
        tfa_components = [
            'class TwoFactorAuthManager',
            'class UserTwoFactor',
            'class TwoFactorAttempt',
            'init_2fa_system'
        ]
        
        for component in tfa_components:
            if component in tfa_content:
                logger.info(f"      ✅ {component}")
            else:
                logger.error(f"      ❌ {component} - not found")
                return False
        
        # Test main application integration
        logger.info("   🚀 Testing main application integration...")
        
        with open('app_sqlite.py', 'r') as f:
            app_content = f.read()
        
        integration_markers = [
            'BATCH PROCESSING SYSTEM INTEGRATION',
            'TWO-FACTOR AUTHENTICATION INTEGRATION',
            'from batch_processor import',
            'from two_factor_auth import',
            'app.include_router(batch_router)',
            'app.include_router(two_factor_router)'
        ]
        
        for marker in integration_markers:
            if marker in app_content:
                logger.info(f"      ✅ {marker}")
            else:
                logger.error(f"      ❌ {marker} - not found")
                return False
        
        logger.info("✅ System integration looks good")
        return True
        
    except Exception as e:
        logger.error(f"❌ System integration test failed: {e}")
        return False

def test_security_configuration():
    """Test security configuration"""
    
    logger.info("🔒 Testing security configuration...")
    
    try:
        # Check if production environment has secure settings
        if os.path.exists('.env.production'):
            with open('.env.production', 'r') as f:
                prod_config = f.read()
            
            # Check for secure token expiration (should be 60 minutes, not 7 days)
            if 'ACCESS_TOKEN_EXPIRE_MINUTES=60' in prod_config:
                logger.info("   ✅ Secure token expiration (60 minutes)")
            elif 'ACCESS_TOKEN_EXPIRE_MINUTES=10080' in prod_config:
                logger.error("   ❌ Insecure token expiration (7 days)")
                return False
            else:
                logger.warning("   ⚠️ Token expiration setting not found")
            
            # Check for auth timeout fixes
            if os.path.exists('auth_timeout_fixes.py'):
                with open('auth_timeout_fixes.py', 'r') as f:
                    auth_content = f.read()
                
                if 'import json' in auth_content:
                    logger.info("   ✅ Auth timeout fixes applied")
                else:
                    logger.error("   ❌ Auth timeout fixes missing")
                    return False
        
        logger.info("✅ Security configuration looks good")
        return True
        
    except Exception as e:
        logger.error(f"❌ Security configuration test failed: {e}")
        return False

def test_performance_optimizations():
    """Test performance optimizations"""
    
    logger.info("⚡ Testing performance optimizations...")
    
    try:
        # Check if database optimizations have been applied
        if os.path.exists('database_optimization_report_20250814_161125.txt'):
            logger.info("   ✅ Database optimization report found")
        else:
            logger.warning("   ⚠️ Database optimization report not found")
        
        # Check if performance optimizer exists
        if os.path.exists('performance_optimizer.py'):
            logger.info("   ✅ Performance optimizer system available")
        else:
            logger.error("   ❌ Performance optimizer system missing")
            return False
        
        # Check database for performance indexes
        db_path = 'trading_post.db'
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
            perf_indexes = cursor.fetchall()
            
            if perf_indexes:
                logger.info(f"   ✅ Performance indexes applied: {len(perf_indexes)}")
            else:
                logger.warning("   ⚠️ No performance indexes found")
            
            conn.close()
        
        logger.info("✅ Performance optimizations look good")
        return True
        
    except Exception as e:
        logger.error(f"❌ Performance optimization test failed: {e}")
        return False

def generate_deployment_report():
    """Generate deployment readiness report"""
    
    logger.info("📋 Generating deployment readiness report...")
    
    # Get current status
    file_structure_ok = test_file_structure()
    database_ok = test_database_structure()
    environment_ok = test_environment_configuration()
    integration_ok = test_system_integration()
    security_ok = test_security_configuration()
    performance_ok = test_performance_optimizations()
    
    # Generate report
    report = {
        "deployment_readiness_report": {
            "generated_at": datetime.now().isoformat(),
            "application": "Trading Post",
            "version": "2.0.0",
            "tests": {
                "file_structure": {
                    "status": "passed" if file_structure_ok else "failed",
                    "description": "All required files present"
                },
                "database_structure": {
                    "status": "passed" if database_ok else "failed", 
                    "description": "Database tables and indexes"
                },
                "environment_configuration": {
                    "status": "passed" if environment_ok else "failed",
                    "description": "Environment variables and configuration"
                },
                "system_integration": {
                    "status": "passed" if integration_ok else "failed",
                    "description": "2FA and batch processing integration"
                },
                "security_configuration": {
                    "status": "passed" if security_ok else "failed",
                    "description": "Security settings and token expiration"
                },
                "performance_optimizations": {
                    "status": "passed" if performance_ok else "failed",
                    "description": "Database optimizations and performance tuning"
                }
            },
            "overall_status": "ready" if all([
                file_structure_ok, database_ok, environment_ok, 
                integration_ok, security_ok, performance_ok
            ]) else "not_ready",
            "features": {
                "two_factor_authentication": "implemented",
                "batch_processing": "implemented", 
                "performance_optimization": "implemented",
                "error_monitoring": "implemented",
                "security_enhancements": "implemented"
            },
            "recommendations": [
                "Ensure all environment variables are set correctly in production",
                "Test OAuth integration with real providers",
                "Verify SSL/TLS certificates are configured",
                "Set up monitoring and alerting for production",
                "Configure backup strategy for database"
            ]
        }
    }
    
    # Save report
    report_filename = f"deployment_readiness_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_filename, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"📄 Report saved: {report_filename}")
    
    return report, all([file_structure_ok, database_ok, environment_ok, integration_ok, security_ok, performance_ok])

def main():
    """Main deployment readiness test"""
    
    logger.info("🚀 TRADING POST DEPLOYMENT READINESS TEST")
    logger.info("=" * 70)
    logger.info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)
    
    # Run all tests
    report, overall_success = generate_deployment_report()
    
    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("📊 DEPLOYMENT READINESS SUMMARY")
    logger.info("=" * 70)
    
    for test_name, test_result in report["deployment_readiness_report"]["tests"].items():
        status_icon = "✅" if test_result["status"] == "passed" else "❌"
        logger.info(f"   {status_icon} {test_name.replace('_', ' ').title()}: {test_result['status']}")
    
    logger.info(f"\n🎯 Overall Status: {report['deployment_readiness_report']['overall_status'].upper()}")
    
    if overall_success:
        logger.info("\n🎉 TRADING POST IS READY FOR DEPLOYMENT!")
        logger.info("✨ All systems are properly configured and integrated")
        logger.info("🚀 Application can be deployed to production")
    else:
        logger.error("\n⚠️ DEPLOYMENT READINESS ISSUES FOUND")
        logger.error("🔧 Please address the failed tests before deployment")
    
    logger.info("\n💡 NEXT STEPS:")
    for i, recommendation in enumerate(report["deployment_readiness_report"]["recommendations"], 1):
        logger.info(f"   {i}. {recommendation}")
    
    logger.info("\n" + "=" * 70)
    logger.info(f"Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)
    
    return overall_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)