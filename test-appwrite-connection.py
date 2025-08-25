#!/usr/bin/env python3
"""
Test script to validate Appwrite configuration and connection
Tests the fix for the persistent project ID issue
"""

import os
import sys
from pathlib import Path
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_environment_loading():
    """Test environment variable loading"""
    logger.info("🧪 Testing environment variable loading...")
    
    # Load from .env.appwrite
    env_file = Path(".env.appwrite")
    if env_file.exists():
        load_dotenv(env_file)
        logger.info(f"✅ Loaded environment from {env_file}")
    else:
        logger.error(f"❌ Environment file {env_file} not found")
        return False
    
    # Check critical variables
    required_vars = {
        'APPWRITE_PROJECT_ID': '689bdee000098bd9d55c',
        'APPWRITE_ENDPOINT': 'https://nyc.cloud.appwrite.io/v1'
    }
    
    all_correct = True
    for var_name, expected_value in required_vars.items():
        actual_value = os.getenv(var_name)
        if actual_value == expected_value:
            logger.info(f"✅ {var_name}: {actual_value}")
        else:
            logger.error(f"❌ {var_name}: expected '{expected_value}', got '{actual_value}'")
            all_correct = False
    
    return all_correct

def test_function_initialization():
    """Test function initialization code"""
    logger.info("🧪 Testing function initialization...")
    
    try:
        # Add the functions directory to Python path
        functions_api_path = Path("functions/api")
        if functions_api_path.exists():
            sys.path.insert(0, str(functions_api_path))
            
            # Import the initialization module
            from appwrite_init import get_appwrite
            
            # Test initialization
            appwrite = get_appwrite()
            config = appwrite.get_configuration_summary()
            
            logger.info("✅ Function initialization successful")
            logger.info(f"   Project ID: {config['project_id']}")
            logger.info(f"   Endpoint: {config['endpoint']}")
            logger.info(f"   Client initialized: {config['client_initialized']}")
            
            # Validate project ID
            if config['project_id'] == '689bdee000098bd9d55c':
                logger.info("✅ Project ID is correct")
                return True
            else:
                logger.error(f"❌ Project ID mismatch: {config['project_id']}")
                return False
                
        else:
            logger.error("❌ Functions API directory not found")
            return False
            
    except Exception as e:
        logger.error(f"❌ Function initialization failed: {e}")
        return False

def test_connection_validation():
    """Test actual connection to Appwrite"""
    logger.info("🧪 Testing Appwrite connection...")
    
    try:
        sys.path.insert(0, str(Path("functions/api")))
        from appwrite_init import get_appwrite
        
        appwrite = get_appwrite()
        connected = appwrite.validate_connection()
        
        if connected:
            logger.info("✅ Appwrite connection successful")
            return True
        else:
            logger.error("❌ Appwrite connection failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Connection test failed: {e}")
        return False

def run_comprehensive_test():
    """Run all tests"""
    logger.info("🚀 Starting comprehensive Appwrite configuration test...")
    
    tests = [
        ("Environment Loading", test_environment_loading),
        ("Function Initialization", test_function_initialization), 
        ("Connection Validation", test_connection_validation)
    ]
    
    results = {}
    for test_name, test_func in tests:
        logger.info(f"\n--- {test_name} ---")
        try:
            results[test_name] = test_func()
        except Exception as e:
            logger.error(f"❌ Test {test_name} crashed: {e}")
            results[test_name] = False
    
    # Summary
    logger.info("\n" + "="*50)
    logger.info("📊 TEST SUMMARY")
    logger.info("="*50)
    
    all_passed = True
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{test_name}: {status}")
        if not result:
            all_passed = False
    
    logger.info("="*50)
    if all_passed:
        logger.info("🎉 ALL TESTS PASSED! The project ID issue has been fixed!")
        return True
    else:
        logger.error("❌ SOME TESTS FAILED! Configuration needs attention.")
        return False

def main():
    """Main test function"""
    success = run_comprehensive_test()
    
    if success:
        logger.info("\n✅ Configuration test completed successfully!")
        sys.exit(0)
    else:
        logger.error("\n❌ Configuration test failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()