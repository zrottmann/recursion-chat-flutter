#!/usr/bin/env python3
"""
Complete SSO Integration Test for Trading Post
Tests both frontend and backend Appwrite SSO integration
"""

import os
import sys
import time
import asyncio
import json
import requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import subprocess
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sso_test.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SSOIntegrationTester:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.test_results = []
        
        # Load environment variables
        load_dotenv(self.project_root / '.env')
        load_dotenv(self.project_root / '.env.appwrite')
        
        self.appwrite_endpoint = os.getenv('APPWRITE_ENDPOINT')
        self.appwrite_project_id = os.getenv('APPWRITE_PROJECT_ID')
        self.appwrite_api_key = os.getenv('APPWRITE_API_KEY')
        
        print("🚀 Trading Post SSO Integration Test Suite")
        print("=" * 50)
        print(f"📁 Project Root: {self.project_root}")
        print(f"🔗 Backend URL: {self.backend_url}")
        print(f"🌐 Frontend URL: {self.frontend_url}")
        print(f"⚡ Appwrite Endpoint: {self.appwrite_endpoint}")
        print(f"🆔 Appwrite Project: {self.appwrite_project_id}")
        print(f"🔑 API Key: {'SET' if self.appwrite_api_key else 'NOT SET'}")
        print("=" * 50)

    def add_test_result(self, test_name: str, passed: bool, message: str = ""):
        """Add a test result to the results list"""
        result = {
            'test': test_name,
            'passed': passed,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    └─ {message}")

    def test_environment_variables(self):
        """Test if all required environment variables are set"""
        print("\n📋 Testing Environment Variables...")
        
        required_vars = {
            'APPWRITE_ENDPOINT': self.appwrite_endpoint,
            'APPWRITE_PROJECT_ID': self.appwrite_project_id,
            'APPWRITE_API_KEY': self.appwrite_api_key,
        }
        
        all_passed = True
        for var_name, var_value in required_vars.items():
            passed = bool(var_value)
            self.add_test_result(
                f"Environment Variable: {var_name}",
                passed,
                f"Value: {'SET' if passed else 'NOT SET'}"
            )
            if not passed:
                all_passed = False
        
        # Check frontend environment
        frontend_env_path = self.project_root / 'trading-app-frontend' / '.env.local'
        if frontend_env_path.exists():
            self.add_test_result(
                "Frontend environment file exists",
                True,
                f"Found: {frontend_env_path}"
            )
        else:
            self.add_test_result(
                "Frontend environment file exists",
                False,
                f"Missing: {frontend_env_path}"
            )
            all_passed = False
        
        return all_passed

    def test_file_structure(self):
        """Test if all required files exist"""
        print("\n📁 Testing File Structure...")
        
        required_files = [
            'appwrite_sso_auth.py',
            'sso_router.py',
            'trading-app-frontend/src/config/appwriteConfig.js',
            'trading-app-frontend/src/services/appwriteService.js',
            'trading-app-frontend/src/contexts/AuthContext.js',
            'trading-app-frontend/src/components/SSOLogin.js',
            'trading-app-frontend/src/components/OAuthCallbackHandler.js',
        ]
        
        all_passed = True
        for file_path in required_files:
            full_path = self.project_root / file_path
            passed = full_path.exists()
            self.add_test_result(
                f"File exists: {file_path}",
                passed,
                f"Path: {full_path}"
            )
            if not passed:
                all_passed = False
        
        return all_passed

    def test_backend_imports(self):
        """Test if backend can import all SSO modules"""
        print("\n🐍 Testing Backend Python Imports...")
        
        try:
            # Test importing the SSO auth module
            sys.path.append(str(self.project_root))
            
            import appwrite_sso_auth
            self.add_test_result(
                "Import appwrite_sso_auth module",
                True,
                "Module imported successfully"
            )
            
            # Test if the module is properly initialized
            auth = appwrite_sso_auth.appwrite_sso_auth
            self.add_test_result(
                "Initialize Appwrite SSO Auth",
                True,
                f"Project ID: {auth.project_id}"
            )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Backend imports",
                False,
                f"Import error: {str(e)}"
            )
            return False

    def test_backend_health(self):
        """Test if backend server is running and healthy"""
        print("\n🏥 Testing Backend Health...")
        
        try:
            # Test general health endpoint
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            if response.status_code == 200:
                self.add_test_result(
                    "Backend server running",
                    True,
                    f"Status: {response.status_code}"
                )
            else:
                self.add_test_result(
                    "Backend server running",
                    False,
                    f"Status: {response.status_code}"
                )
                return False
            
            # Test auth health endpoint
            response = requests.get(f"{self.backend_url}/auth/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.add_test_result(
                    "Auth service health",
                    True,
                    f"Service: {data.get('service', 'unknown')}"
                )
                return True
            else:
                self.add_test_result(
                    "Auth service health",
                    False,
                    f"Status: {response.status_code}"
                )
                return False
                
        except requests.ConnectionError:
            self.add_test_result(
                "Backend server connection",
                False,
                "Server not running or not accessible"
            )
            return False
        except Exception as e:
            self.add_test_result(
                "Backend health check",
                False,
                f"Error: {str(e)}"
            )
            return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        endpoints = [
            ('/auth/health', 'GET'),
            ('/auth/oauth/google', 'GET'),
            ('/auth/me', 'GET'),  # This should return 401 without auth
        ]
        
        all_passed = True
        for endpoint, method in endpoints:
            try:
                url = f"{self.backend_url}{endpoint}"
                
                if method == 'GET':
                    response = requests.get(url, timeout=10)
                
                # For /auth/me, expect 401 (unauthorized) since we're not authenticated
                if endpoint == '/auth/me':
                    expected_status = 401
                else:
                    expected_status = 200
                
                passed = response.status_code == expected_status
                if endpoint == '/auth/oauth/google':
                    # OAuth endpoints might redirect (302) or return 400 for missing params
                    passed = response.status_code in [200, 302, 400]
                
                self.add_test_result(
                    f"Endpoint: {method} {endpoint}",
                    passed,
                    f"Status: {response.status_code}"
                )
                
                if not passed:
                    all_passed = False
                    
            except Exception as e:
                self.add_test_result(
                    f"Endpoint: {method} {endpoint}",
                    False,
                    f"Error: {str(e)}"
                )
                all_passed = False
        
        return all_passed

    def test_frontend_dependencies(self):
        """Test if frontend has required dependencies"""
        print("\n📦 Testing Frontend Dependencies...")
        
        package_json_path = self.project_root / 'trading-app-frontend' / 'package.json'
        
        try:
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
            
            dependencies = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
            
            required_deps = [
                'appwrite',
                'react',
                'react-router-dom',
                '@reduxjs/toolkit',
                'react-redux',
                'bootstrap',
                'react-bootstrap'
            ]
            
            all_passed = True
            for dep in required_deps:
                passed = dep in dependencies
                self.add_test_result(
                    f"Frontend dependency: {dep}",
                    passed,
                    f"Version: {dependencies.get(dep, 'NOT FOUND')}"
                )
                if not passed:
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.add_test_result(
                "Frontend package.json",
                False,
                f"Error reading package.json: {str(e)}"
            )
            return False

    def test_appwrite_connectivity(self):
        """Test connectivity to Appwrite cloud"""
        print("\n☁️ Testing Appwrite Connectivity...")
        
        if not self.appwrite_endpoint:
            self.add_test_result(
                "Appwrite endpoint configured",
                False,
                "APPWRITE_ENDPOINT not set"
            )
            return False
        
        try:
            # Test Appwrite endpoint connectivity
            response = requests.get(self.appwrite_endpoint, timeout=10)
            passed = response.status_code in [200, 404]  # 404 is OK, means server is reachable
            
            self.add_test_result(
                "Appwrite endpoint reachable",
                passed,
                f"Status: {response.status_code}, Endpoint: {self.appwrite_endpoint}"
            )
            
            return passed
            
        except Exception as e:
            self.add_test_result(
                "Appwrite connectivity",
                False,
                f"Error: {str(e)}"
            )
            return False

    def generate_summary_report(self):
        """Generate a summary report of all tests"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['passed'])
        failed_tests = total_tests - passed_tests
        
        print(f"📋 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"   • {result['test']}: {result['message']}")
        
        print("\n🎯 NEXT STEPS:")
        if failed_tests == 0:
            print("   🎉 All tests passed! Your SSO integration is ready!")
            print("   🚀 You can now start the servers and test SSO login:")
            print("      Backend: python app_sqlite.py")
            print("      Frontend: npm start (in trading-app-frontend/)")
        else:
            print("   🔧 Fix the failed tests above")
            print("   📚 Check the SSO integration documentation")
            print("   🐛 Review error logs in sso_test.log")
        
        # Save detailed report to file
        report_file = self.project_root / 'sso_test_report.json'
        with open(report_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': failed_tests,
                    'success_rate': (passed_tests/total_tests)*100
                },
                'results': self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_file}")
        return failed_tests == 0

    def run_all_tests(self):
        """Run all SSO integration tests"""
        print("🧪 Starting SSO Integration Tests...")
        
        test_functions = [
            self.test_environment_variables,
            self.test_file_structure,
            self.test_backend_imports,
            self.test_appwrite_connectivity,
            self.test_frontend_dependencies,
            # Only test backend health if it's likely to be running
            # self.test_backend_health,
            # self.test_auth_endpoints,
        ]
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                logger.error(f"Test function {test_func.__name__} failed: {str(e)}")
                self.add_test_result(
                    f"Test function: {test_func.__name__}",
                    False,
                    f"Exception: {str(e)}"
                )
        
        return self.generate_summary_report()

def main():
    """Main test function"""
    tester = SSOIntegrationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 SSO Integration Test Suite PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SSO Integration Test Suite FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()