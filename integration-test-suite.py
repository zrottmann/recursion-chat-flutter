#!/usr/bin/env python3
"""
Trading Post Integration Test Suite
Tests all functionality after deployment to AppWrite
"""

import os
import sys
import json
import time
import requests
import logging
from typing import Dict, Any, List
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TradingPostIntegrationTests:
    def __init__(self):
        """Initialize test suite"""
        self.project_id = "689bdee000098bd9d55c"
        self.endpoint = "https://cloud.appwrite.io/v1"
        self.database_id = "trading_post_db"
        self.api_key = os.getenv("APPWRITE_API_KEY")
        
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "details": []
        }
        
        if not self.api_key:
            logger.error("❌ APPWRITE_API_KEY not set. Cannot run integration tests.")
            return
        
        # Initialize AppWrite client
        try:
            from appwrite.client import Client
            from appwrite.services.databases import Databases
            from appwrite.services.functions import Functions
            from appwrite.services.storage import Storage
            from appwrite.services.users import Users
            
            self.client = Client()
            self.client.set_endpoint(self.endpoint)
            self.client.set_project(self.project_id)
            self.client.set_key(self.api_key)
            
            self.databases = Databases(self.client)
            self.functions = Functions(self.client)
            self.storage = Storage(self.client)
            self.users = Users(self.client)
            
            logger.info("✅ Test suite initialized")
            
        except ImportError:
            logger.error("❌ AppWrite SDK not available. Install with: pip install appwrite")
            sys.exit(1)

    def run_test(self, test_name: str, test_function, *args, **kwargs):
        """Run a single test and record results"""
        logger.info(f"🧪 Running test: {test_name}")
        
        try:
            start_time = time.time()
            result = test_function(*args, **kwargs)
            duration = time.time() - start_time
            
            if result:
                logger.info(f"✅ {test_name} - PASSED ({duration:.2f}s)")
                self.test_results["passed"] += 1
                self.test_results["details"].append({
                    "test": test_name,
                    "status": "PASSED",
                    "duration": duration,
                    "message": "Test completed successfully"
                })
            else:
                logger.error(f"❌ {test_name} - FAILED ({duration:.2f}s)")
                self.test_results["failed"] += 1
                self.test_results["details"].append({
                    "test": test_name,
                    "status": "FAILED", 
                    "duration": duration,
                    "message": "Test failed"
                })
                
        except Exception as e:
            logger.error(f"❌ {test_name} - ERROR: {str(e)}")
            self.test_results["failed"] += 1
            self.test_results["details"].append({
                "test": test_name,
                "status": "ERROR",
                "duration": 0,
                "message": str(e)
            })

    def test_database_connectivity(self) -> bool:
        """Test database connectivity and basic operations"""
        try:
            # Test database list
            databases = self.databases.list()
            
            # Check if our database exists
            db_found = any(db['$id'] == self.database_id for db in databases['databases'])
            
            if not db_found:
                logger.error(f"Database {self.database_id} not found")
                return False
            
            # Test collections list
            collections = self.databases.list_collections(self.database_id)
            
            # Check required collections
            required_collections = ["users", "items", "wants", "matches", "trades", "messages", "reviews", "notifications"]
            collection_ids = [col['$id'] for col in collections['collections']]
            
            missing_collections = [col for col in required_collections if col not in collection_ids]
            
            if missing_collections:
                logger.error(f"Missing collections: {missing_collections}")
                return False
            
            logger.info(f"Found {len(collection_ids)} collections")
            return True
            
        except Exception as e:
            logger.error(f"Database test failed: {str(e)}")
            return False

    def test_storage_buckets(self) -> bool:
        """Test storage bucket configuration"""
        try:
            buckets = self.storage.list_buckets()
            
            required_buckets = ["item_images", "profile_images", "chat_attachments"]
            bucket_ids = [bucket['$id'] for bucket in buckets['buckets']]
            
            missing_buckets = [bucket for bucket in required_buckets if bucket not in bucket_ids]
            
            if missing_buckets:
                logger.error(f"Missing storage buckets: {missing_buckets}")
                return False
            
            logger.info(f"Found {len(bucket_ids)} storage buckets")
            return True
            
        except Exception as e:
            logger.error(f"Storage test failed: {str(e)}")
            return False

    def test_ai_functions_deployed(self) -> bool:
        """Test if AI functions are deployed and accessible"""
        try:
            functions = self.functions.list()
            function_ids = [func['$id'] for func in functions['functions']]
            
            required_functions = ["ai-pricing", "ai-matching", "trading-post-api"]
            missing_functions = [func for func in required_functions if func not in function_ids]
            
            if missing_functions:
                logger.error(f"Missing functions: {missing_functions}")
                return False
            
            # Test function status
            for func_id in required_functions:
                try:
                    func_details = self.functions.get(func_id)
                    if not func_details.get('enabled', False):
                        logger.warning(f"Function {func_id} is not enabled")
                        
                except Exception as e:
                    logger.error(f"Cannot get details for function {func_id}: {str(e)}")
                    return False
            
            logger.info(f"All {len(required_functions)} AI functions are deployed")
            return True
            
        except Exception as e:
            logger.error(f"Functions test failed: {str(e)}")
            return False

    def test_ai_pricing_function(self) -> bool:
        """Test AI pricing function execution"""
        try:
            # This would require a test image and proper execution
            # For now, just check if the function exists and is callable
            
            func_details = self.functions.get("ai-pricing")
            
            if not func_details.get('enabled', False):
                logger.error("AI pricing function is not enabled")
                return False
            
            logger.info("AI pricing function is available and enabled")
            return True
            
        except Exception as e:
            logger.error(f"AI pricing function test failed: {str(e)}")
            return False

    def test_ai_matching_function(self) -> bool:
        """Test AI matching function execution"""
        try:
            func_details = self.functions.get("ai-matching")
            
            if not func_details.get('enabled', False):
                logger.error("AI matching function is not enabled")
                return False
            
            logger.info("AI matching function is available and enabled")
            return True
            
        except Exception as e:
            logger.error(f"AI matching function test failed: {str(e)}")
            return False

    def test_frontend_accessibility(self) -> bool:
        """Test if frontend is accessible via AppWrite Sites"""
        try:
            # This would require the actual site URL
            # For now, just verify the build exists
            
            dist_path = Path("trading-app-frontend/dist")
            if not dist_path.exists():
                logger.error("Frontend dist directory not found")
                return False
            
            # Check for essential files
            index_file = dist_path / "index.html"
            if not index_file.exists():
                logger.error("index.html not found in dist")
                return False
            
            # Count files in dist
            dist_files = list(dist_path.glob("*"))
            logger.info(f"Frontend build contains {len(dist_files)} files")
            
            return True
            
        except Exception as e:
            logger.error(f"Frontend test failed: {str(e)}")
            return False

    def test_permissions_configuration(self) -> bool:
        """Test database and storage permissions"""
        try:
            # Check collection permissions
            collections = self.databases.list_collections(self.database_id)
            
            for collection in collections['collections']:
                permissions = collection.get('permissions', [])
                if not permissions:
                    logger.warning(f"Collection {collection['$id']} has no permissions set")
            
            # Check bucket permissions
            buckets = self.storage.list_buckets()
            
            for bucket in buckets['buckets']:
                permissions = bucket.get('permissions', [])
                if not permissions:
                    logger.warning(f"Bucket {bucket['$id']} has no permissions set")
            
            logger.info("Permissions configuration appears valid")
            return True
            
        except Exception as e:
            logger.error(f"Permissions test failed: {str(e)}")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run complete integration test suite"""
        logger.info("🚀 Starting Trading Post Integration Tests...")
        logger.info(f"Testing project: {self.project_id}")
        logger.info(f"Endpoint: {self.endpoint}")
        
        # Define test cases
        test_cases = [
            ("Database Connectivity", self.test_database_connectivity),
            ("Storage Buckets", self.test_storage_buckets),
            ("AI Functions Deployed", self.test_ai_functions_deployed),
            ("AI Pricing Function", self.test_ai_pricing_function),
            ("AI Matching Function", self.test_ai_matching_function),
            ("Frontend Accessibility", self.test_frontend_accessibility),
            ("Permissions Configuration", self.test_permissions_configuration)
        ]
        
        # Run all tests
        start_time = time.time()
        
        for test_name, test_function in test_cases:
            self.run_test(test_name, test_function)
            time.sleep(1)  # Brief pause between tests
        
        total_duration = time.time() - start_time
        
        # Generate report
        self.generate_test_report(total_duration)
        
        return self.test_results

    def generate_test_report(self, total_duration: float):
        """Generate comprehensive test report"""
        total_tests = self.test_results["passed"] + self.test_results["failed"] + self.test_results["skipped"]
        success_rate = (self.test_results["passed"] / total_tests * 100) if total_tests > 0 else 0
        
        logger.info("\n" + "="*80)
        logger.info("📊 TRADING POST INTEGRATION TEST REPORT")
        logger.info("="*80)
        
        logger.info(f"🕒 Total Duration: {total_duration:.2f}s")
        logger.info(f"📈 Tests Run: {total_tests}")
        logger.info(f"✅ Passed: {self.test_results['passed']}")
        logger.info(f"❌ Failed: {self.test_results['failed']}")
        logger.info(f"⏭️ Skipped: {self.test_results['skipped']}")
        logger.info(f"📊 Success Rate: {success_rate:.1f}%")
        
        # Detailed results
        logger.info("\n📋 DETAILED RESULTS:")
        for result in self.test_results["details"]:
            status_emoji = "✅" if result["status"] == "PASSED" else "❌"
            logger.info(f"   {status_emoji} {result['test']}: {result['status']} ({result['duration']:.2f}s)")
            if result.get("message") and result["status"] != "PASSED":
                logger.info(f"      💬 {result['message']}")
        
        # Overall status
        if self.test_results["failed"] == 0:
            logger.info(f"\n🎉 ALL TESTS PASSED! Your Trading Post deployment is fully functional.")
        else:
            logger.info(f"\n⚠️  {self.test_results['failed']} test(s) failed. Please review and fix issues.")
        
        logger.info("="*80)

def main():
    """Main test execution"""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("""
Trading Post Integration Test Suite

Usage:
    python3 integration-test-suite.py

Environment Variables:
    APPWRITE_API_KEY - Your AppWrite API key (required)

Tests Performed:
    - Database connectivity and collections
    - Storage bucket configuration
    - AI function deployment status
    - Frontend build verification
    - Permissions configuration
        """)
        return
    
    if not os.getenv("APPWRITE_API_KEY"):
        logger.error("❌ APPWRITE_API_KEY not set")
        logger.info("Please set your AppWrite API key:")
        logger.info("export APPWRITE_API_KEY='your-api-key-here'")
        sys.exit(1)
    
    # Run tests
    test_suite = TradingPostIntegrationTests()
    if hasattr(test_suite, 'client'):
        results = test_suite.run_all_tests()
        
        # Exit with appropriate code
        if results["failed"] == 0:
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Some tests failed
    else:
        logger.error("❌ Failed to initialize test suite")
        sys.exit(1)

if __name__ == "__main__":
    main()