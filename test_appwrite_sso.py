"""
Test script for Appwrite SSO Integration
Tests authentication flow and API endpoints
"""

import os
import sys
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_file = Path(__file__).parent / ".env.development"
if env_file.exists():
    load_dotenv(env_file)
    print(f"✅ Loaded environment from {env_file}")
else:
    print(f"❌ Environment file not found: {env_file}")
    sys.exit(1)

# Configuration
API_URL = "http://localhost:8000"
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")

def test_health_check():
    """Test if the API is running and SSO is configured"""
    print("\n🔍 Testing Health Check...")
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API is healthy")
            print(f"   - Environment: {data.get('environment')}")
            print(f"   - Appwrite Project: {data['appwrite'].get('project')}")
            print(f"   - Appwrite Configured: {data['appwrite'].get('configured')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Could not connect to API: {e}")
        return False

def test_sso_health():
    """Test SSO specific health endpoint"""
    print("\n🔍 Testing SSO Health...")
    try:
        response = requests.get(f"{API_URL}/auth/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SSO service is healthy")
            print(f"   - Service: {data.get('service')}")
            print(f"   - Endpoint: {data.get('endpoint')}")
            print(f"   - Project: {data.get('project')}")
            return True
        else:
            print(f"❌ SSO health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ SSO service error: {e}")
        return False

def test_email_signup():
    """Test email signup"""
    print("\n🔍 Testing Email Signup...")
    
    import random
    import string
    
    # Generate random test user
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    test_email = f"test_{random_suffix}@tradingpost.local"
    test_password = "TestPassword123!"
    test_name = f"Test User {random_suffix}"
    
    try:
        response = requests.post(
            f"{API_URL}/auth/signup",
            json={
                "email": test_email,
                "password": test_password,
                "name": test_name
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Signup successful")
            print(f"   - User ID: {data['user'].get('id')}")
            print(f"   - Email: {data['user'].get('email')}")
            print(f"   - Token received: {'access_token' in data}")
            return data.get('access_token')
        elif response.status_code == 409:
            print(f"⚠️  Email already registered (expected for repeated tests)")
            return None
        else:
            print(f"❌ Signup failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Signup error: {e}")
        return None

def test_email_login():
    """Test email login with known test account"""
    print("\n🔍 Testing Email Login...")
    
    # Use a known test account or create one first
    test_email = "test@tradingpost.local"
    test_password = "TestPassword123!"
    
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful")
            print(f"   - User ID: {data['user'].get('id')}")
            print(f"   - Token received: {'access_token' in data}")
            return data.get('access_token')
        elif response.status_code == 401:
            print(f"⚠️  Invalid credentials (create test account first)")
            return None
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_protected_endpoint(token):
    """Test accessing protected endpoint with token"""
    print("\n🔍 Testing Protected Endpoint...")
    
    if not token:
        print("⚠️  No token available, skipping protected endpoint test")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Protected endpoint accessible")
            print(f"   - User ID: {data.get('id')}")
            print(f"   - Email: {data.get('email')}")
            return True
        elif response.status_code == 401:
            print(f"❌ Authentication failed (invalid token)")
            return False
        else:
            print(f"❌ Protected endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")
        return False

def test_oauth_providers():
    """Test OAuth provider endpoints"""
    print("\n🔍 Testing OAuth Providers...")
    
    providers = ["google", "github", "facebook"]
    results = []
    
    for provider in providers:
        try:
            # We can't fully test OAuth without browser interaction,
            # but we can check if the endpoints are configured
            response = requests.get(
                f"{API_URL}/auth/oauth/{provider}",
                allow_redirects=False
            )
            
            if response.status_code in [302, 303, 307]:  # Redirect status codes
                print(f"✅ {provider.capitalize()} OAuth configured")
                results.append(True)
            else:
                print(f"❌ {provider.capitalize()} OAuth not configured: {response.status_code}")
                results.append(False)
        except Exception as e:
            print(f"❌ {provider.capitalize()} OAuth error: {e}")
            results.append(False)
    
    return all(results)

def main():
    """Run all tests"""
    print("=" * 60)
    print("Trading Post Appwrite SSO Integration Tests")
    print("=" * 60)
    
    # Check environment
    print(f"\n📋 Environment Check:")
    print(f"   - API URL: {API_URL}")
    print(f"   - Appwrite Project: {APPWRITE_PROJECT_ID or 'NOT SET'}")
    print(f"   - Appwrite Key: {'SET' if APPWRITE_API_KEY else 'NOT SET'}")
    
    if not APPWRITE_PROJECT_ID or not APPWRITE_API_KEY:
        print("\n❌ Appwrite credentials not configured in .env.development")
        print("   Please set APPWRITE_PROJECT_ID and APPWRITE_API_KEY")
        return
    
    # Run tests
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Health Check
    tests_total += 1
    if test_health_check():
        tests_passed += 1
    
    # Test 2: SSO Health
    tests_total += 1
    if test_sso_health():
        tests_passed += 1
    
    # Test 3: Email Signup
    tests_total += 1
    token = test_email_signup()
    if token:
        tests_passed += 1
    
    # Test 4: Email Login
    tests_total += 1
    if not token:
        token = test_email_login()
    if token:
        tests_passed += 1
    
    # Test 5: Protected Endpoint
    tests_total += 1
    if test_protected_endpoint(token):
        tests_passed += 1
    
    # Test 6: OAuth Providers
    tests_total += 1
    if test_oauth_providers():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Tests Passed: {tests_passed}/{tests_total}")
    
    if tests_passed == tests_total:
        print("✅ All tests passed! SSO integration is working correctly.")
    elif tests_passed > tests_total / 2:
        print("⚠️  Some tests failed. Please check the configuration.")
    else:
        print("❌ Most tests failed. Please verify the setup.")

if __name__ == "__main__":
    main()