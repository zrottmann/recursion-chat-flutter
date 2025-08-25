#!/usr/bin/env python3
"""
Test Live SSO Integration
Tests the live Trading Post app for SSO functionality
"""

import requests
import json
import time
from datetime import datetime

def test_live_sso():
    base_url = "https://tradingpost-2tq2f.ondigitalocean.app"
    
    print("Testing Live SSO Integration")
    print("=" * 50)
    print(f"App URL: {base_url}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 50)
    
    tests = []
    
    # Test 1: Frontend loads
    try:
        response = requests.get(base_url, timeout=30)
        passed = response.status_code == 200
        tests.append(("Frontend loads", passed, f"Status: {response.status_code}"))
        print(f"{'PASS' if passed else 'FAIL'} Frontend loads: {response.status_code}")
    except Exception as e:
        tests.append(("Frontend loads", False, f"Error: {e}"))
        print(f"FAIL Frontend loads: Error - {e}")
    
    # Test 2: Login page loads
    try:
        response = requests.get(f"{base_url}/login", timeout=30)
        passed = response.status_code == 200
        tests.append(("Login page loads", passed, f"Status: {response.status_code}"))
        print(f"{'PASS' if passed else 'FAIL'} Login page loads: {response.status_code}")
    except Exception as e:
        tests.append(("Login page loads", False, f"Error: {e}"))
        print(f"FAIL Login page loads: Error - {e}")
    
    # Test 3: Backend health check
    try:
        response = requests.get(f"{base_url}/health", timeout=30)
        passed = response.status_code == 200
        tests.append(("Backend health", passed, f"Status: {response.status_code}"))
        print(f"{'PASS' if passed else 'FAIL'} Backend health: {response.status_code}")
    except Exception as e:
        tests.append(("Backend health", False, f"Error: {e}"))
        print(f"FAIL Backend health: Error - {e}")
    
    # Test 4: Auth service health
    try:
        response = requests.get(f"{base_url}/auth/health", timeout=30)
        passed = response.status_code == 200
        if passed:
            data = response.json()
            service = data.get('service', 'unknown')
            project = data.get('project', 'unknown')
            tests.append(("Auth service health", True, f"Service: {service}, Project: {project}"))
            print(f"PASS Auth service health: Service={service}, Project={project}")
        else:
            tests.append(("Auth service health", False, f"Status: {response.status_code}"))
            print(f"FAIL Auth service health: {response.status_code}")
    except Exception as e:
        tests.append(("Auth service health", False, f"Error: {e}"))
        print(f"FAIL Auth service health: Error - {e}")
    
    # Test 5: OAuth endpoints available
    oauth_providers = ['google', 'github', 'facebook']
    for provider in oauth_providers:
        try:
            response = requests.get(f"{base_url}/auth/oauth/{provider}", timeout=10, allow_redirects=False)
            # OAuth endpoints should redirect (302) or return 400 for missing params
            passed = response.status_code in [200, 302, 400]
            tests.append((f"OAuth {provider}", passed, f"Status: {response.status_code}"))
            print(f"{'PASS' if passed else 'FAIL'} OAuth {provider}: {response.status_code}")
        except Exception as e:
            tests.append((f"OAuth {provider}", False, f"Error: {e}"))
            print(f"FAIL OAuth {provider}: Error - {e}")
    
    # Test 6: Check if frontend includes SSO elements
    try:
        response = requests.get(f"{base_url}/login", timeout=30)
        if response.status_code == 200:
            content = response.text.lower()
            # Look for indicators that SSO is enabled
            sso_indicators = ['google', 'github', 'facebook', 'oauth', 'continue with']
            found_indicators = [indicator for indicator in sso_indicators if indicator in content]
            passed = len(found_indicators) >= 2  # At least 2 SSO indicators found
            tests.append(("SSO elements in frontend", passed, f"Found: {found_indicators}"))
            print(f"{'PASS' if passed else 'FAIL'} SSO elements in frontend: Found {found_indicators}")
        else:
            tests.append(("SSO elements in frontend", False, f"Login page not accessible: {response.status_code}"))
            print(f"FAIL SSO elements in frontend: Login page not accessible")
    except Exception as e:
        tests.append(("SSO elements in frontend", False, f"Error: {e}"))
        print(f"FAIL SSO elements in frontend: Error - {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed_tests = sum(1 for test in tests if test[1])
    total_tests = len(tests)
    
    print(f"PASSED: {passed_tests}/{total_tests}")
    print(f"FAILED: {total_tests - passed_tests}/{total_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("\nALL TESTS PASSED! SSO is working on the live site!")
        print(f"Try SSO at: {base_url}/login")
    else:
        print(f"\nSome tests failed. Check the deployment status.")
        print("Failed tests:")
        for test_name, passed, message in tests:
            if not passed:
                print(f"   • {test_name}: {message}")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = test_live_sso()
    exit(0 if success else 1)