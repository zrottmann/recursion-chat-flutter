#!/usr/bin/env python3
"""
Test Script for Trading Post Error Monitoring System
Validates error tracking, performance monitoring, and alerting functionality
"""

import asyncio
import time
import random
import requests
import json
from datetime import datetime
from typing import Dict, Any

class ErrorMonitoringTester:
    """Test suite for error monitoring system"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.test_results = []
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_monitoring_endpoints(self):
        """Test monitoring API endpoints"""
        print("\n🔍 Testing Monitoring Endpoints")
        print("-" * 40)
        
        endpoints = [
            "/api/monitoring/system/health",
            "/api/monitoring/errors/summary",
            "/api/monitoring/performance/summary",
            "/api/monitoring/alerts/recent",
            "/api/monitoring/dashboard"
        ]
        
        for endpoint in endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success", True):  # Some endpoints don't have success field
                        self.log_test(f"Endpoint {endpoint}", True, f"Status: {response.status_code}")
                    else:
                        self.log_test(f"Endpoint {endpoint}", False, f"API returned error: {data.get('error', 'Unknown')}")
                else:
                    self.log_test(f"Endpoint {endpoint}", False, f"HTTP {response.status_code}: {response.text[:100]}")
                    
            except Exception as e:
                self.log_test(f"Endpoint {endpoint}", False, f"Request failed: {str(e)}")
    
    def test_error_tracking(self):
        """Test error tracking by causing intentional errors"""
        print("\n🚨 Testing Error Tracking")
        print("-" * 40)
        
        # Test 1: Invalid endpoint (404 error)
        try:
            response = self.session.get(f"{self.base_url}/api/nonexistent-endpoint")
            self.log_test("404 Error Generation", True, f"Generated 404 error, status: {response.status_code}")
        except Exception as e:
            self.log_test("404 Error Generation", False, f"Failed to generate 404: {e}")
        
        # Test 2: Invalid JSON payload (400 error)
        try:
            response = self.session.post(
                f"{self.base_url}/api/items",
                json={"invalid": "data", "missing": "required_fields"},
                headers={"Content-Type": "application/json"}
            )
            self.log_test("400 Error Generation", True, f"Generated 400 error, status: {response.status_code}")
        except Exception as e:
            self.log_test("400 Error Generation", False, f"Failed to generate 400: {e}")
        
        # Test 3: Unauthorized access (401 error)
        try:
            response = self.session.get(f"{self.base_url}/api/users/me")
            self.log_test("401 Error Generation", True, f"Generated 401 error, status: {response.status_code}")
        except Exception as e:
            self.log_test("401 Error Generation", False, f"Failed to generate 401: {e}")
    
    def test_performance_monitoring(self):
        """Test performance monitoring by making various requests"""
        print("\n⚡ Testing Performance Monitoring")
        print("-" * 40)
        
        # Test 1: Fast endpoint
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/health")
            end_time = time.time()
            
            response_time = end_time - start_time
            self.log_test("Fast Endpoint Performance", True, f"Health check: {response_time:.3f}s")
        except Exception as e:
            self.log_test("Fast Endpoint Performance", False, f"Health check failed: {e}")
        
        # Test 2: Multiple concurrent requests
        try:
            import threading
            
            def make_request():
                self.session.get(f"{self.base_url}/api")
            
            threads = []
            start_time = time.time()
            
            for i in range(5):
                thread = threading.Thread(target=make_request)
                threads.append(thread)
                thread.start()
            
            for thread in threads:
                thread.join()
            
            end_time = time.time()
            total_time = end_time - start_time
            
            self.log_test("Concurrent Requests", True, f"5 concurrent requests: {total_time:.3f}s")
        except Exception as e:
            self.log_test("Concurrent Requests", False, f"Concurrent test failed: {e}")
        
        # Test 3: Simulate slow request (if we had a test endpoint)
        try:
            # This would work if we had a /test-slow endpoint
            response = self.session.get(f"{self.base_url}/api", timeout=5)
            self.log_test("API Endpoint Access", True, f"API accessible, status: {response.status_code}")
        except Exception as e:
            self.log_test("API Endpoint Access", False, f"API access failed: {e}")
    
    def test_system_health_monitoring(self):
        """Test system health monitoring"""
        print("\n💊 Testing System Health Monitoring")
        print("-" * 40)
        
        try:
            response = self.session.get(f"{self.base_url}/api/monitoring/system/health")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    health_data = data.get("data", {})
                    
                    # Check required fields
                    required_fields = ["cpu_percent", "memory_percent", "disk_usage_percent"]
                    missing_fields = [field for field in required_fields if field not in health_data]
                    
                    if not missing_fields:
                        cpu = health_data.get("cpu_percent", 0)
                        memory = health_data.get("memory_percent", 0)
                        
                        self.log_test("System Health Data", True, 
                                    f"CPU: {cpu:.1f}%, Memory: {memory:.1f}%")
                        
                        # Test health status determination
                        status = health_data.get("status", "unknown")
                        expected_status = "healthy" if cpu < 80 and memory < 80 else "warning"
                        
                        status_correct = status == expected_status
                        self.log_test("Health Status Logic", status_correct,
                                    f"Status: {status} (expected: {expected_status})")
                    else:
                        self.log_test("System Health Data", False, 
                                    f"Missing fields: {missing_fields}")
                else:
                    self.log_test("System Health API", False, 
                                f"API error: {data.get('error', 'Unknown')}")
            else:
                self.log_test("System Health API", False, 
                            f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("System Health Monitoring", False, f"Test failed: {e}")
    
    def test_dashboard_data(self):
        """Test dashboard data aggregation"""
        print("\n📊 Testing Dashboard Data")
        print("-" * 40)
        
        try:
            response = self.session.get(f"{self.base_url}/api/monitoring/dashboard")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    dashboard_data = data.get("data", {})
                    
                    # Check dashboard structure
                    required_sections = ["summary", "trends", "alerts"]
                    missing_sections = [section for section in required_sections if section not in dashboard_data]
                    
                    if not missing_sections:
                        self.log_test("Dashboard Structure", True, 
                                    f"All required sections present: {required_sections}")
                        
                        # Check summary data
                        summary = dashboard_data.get("summary", {})
                        summary_fields = ["total_errors_24h", "current_cpu", "current_memory"]
                        
                        has_summary_data = any(field in summary for field in summary_fields)
                        self.log_test("Dashboard Summary", has_summary_data,
                                    f"Summary contains: {list(summary.keys())}")
                        
                        # Check if we have trends data
                        trends = dashboard_data.get("trends", {})
                        has_trends = len(trends) > 0
                        self.log_test("Dashboard Trends", has_trends,
                                    f"Trends sections: {list(trends.keys())}")
                    else:
                        self.log_test("Dashboard Structure", False,
                                    f"Missing sections: {missing_sections}")
                else:
                    self.log_test("Dashboard API", False,
                                f"API error: {data.get('error', 'Unknown')}")
            else:
                self.log_test("Dashboard API", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Dashboard Data", False, f"Test failed: {e}")
    
    def test_error_summary_accuracy(self):
        """Test error summary data accuracy"""
        print("\n📈 Testing Error Summary Accuracy")
        print("-" * 40)
        
        # First, generate some known errors
        known_errors = []
        
        for i in range(3):
            try:
                response = self.session.get(f"{self.base_url}/api/test-error-{i}")
                known_errors.append(response.status_code)
            except:
                pass
        
        # Wait a moment for monitoring to process
        time.sleep(1)
        
        # Get error summary
        try:
            response = self.session.get(f"{self.base_url}/api/monitoring/errors/summary?hours=1")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    summary = data.get("data", {})
                    total_errors = summary.get("total_errors", 0)
                    
                    # We should have at least the errors we just generated
                    self.log_test("Error Count Tracking", total_errors >= len(known_errors),
                                f"Found {total_errors} errors (generated at least {len(known_errors)})")
                    
                    # Check if we have error breakdown
                    by_type = summary.get("by_type", {})
                    by_level = summary.get("by_level", {})
                    
                    has_breakdown = len(by_type) > 0 or len(by_level) > 0
                    self.log_test("Error Categorization", has_breakdown,
                                f"Error types: {len(by_type)}, Error levels: {len(by_level)}")
                else:
                    self.log_test("Error Summary API", False,
                                f"API error: {data.get('error', 'Unknown')}")
            else:
                self.log_test("Error Summary API", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Summary Test", False, f"Test failed: {e}")
    
    def run_all_tests(self):
        """Run all monitoring tests"""
        print("🚀 Starting Error Monitoring System Tests")
        print("=" * 50)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_monitoring_endpoints()
        self.test_error_tracking()
        self.test_performance_monitoring()
        self.test_system_health_monitoring()
        self.test_dashboard_data()
        self.test_error_summary_accuracy()
        
        end_time = time.time()
        
        # Print summary
        self.print_test_summary(end_time - start_time)
    
    def print_test_summary(self, total_time: float):
        """Print test execution summary"""
        print("\n" + "=" * 50)
        print("📋 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⏱️ Total Time: {total_time:.2f}s")
        
        success_rate = (passed / len(self.test_results)) * 100 if self.test_results else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        # Overall status
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: Error monitoring system is working well!")
        elif success_rate >= 70:
            print("\n👍 GOOD: Error monitoring system is mostly functional")
        elif success_rate >= 50:
            print("\n⚠️ WARNING: Error monitoring system has some issues")
        else:
            print("\n🚨 CRITICAL: Error monitoring system needs attention")
        
        print("\n💡 To view live monitoring data, run:")
        print(f"   python monitoring_dashboard.py --url {self.base_url}")
        print("   python monitoring_dashboard.py --continuous")


def main():
    """Main test execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Trading Post Error Monitoring System")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Base URL of the Trading Post API"
    )
    
    args = parser.parse_args()
    
    tester = ErrorMonitoringTester(args.url)
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())