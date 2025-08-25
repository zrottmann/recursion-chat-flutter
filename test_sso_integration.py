"""
Comprehensive SSO Integration Test Suite for Trading Post
Tests all authentication flows and OAuth providers
"""

import os
import sys
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import requests
from dotenv import load_dotenv
import pytest
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.exception import AppwriteException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SSOIntegrationTester:
    """Comprehensive SSO Integration Tester"""
    
    def __init__(self, environment: str = 'development'):
        """Initialize tester with environment configuration"""
        self.environment = environment
        self.test_results = []
        self.load_configuration()
        self.initialize_clients()
        
    def load_configuration(self):
        """Load environment configuration"""
        env_file = f'.env.appwrite.{self.environment}'
        if os.path.exists(env_file):
            load_dotenv(env_file)
            logger.info(f"Loaded configuration from {env_file}")
        else:
            load_dotenv('.env')
            logger.warning(f"Environment file {env_file} not found, using default .env")
        
        self.config = {
            'endpoint': os.getenv('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'),
            'project_id': os.getenv('APPWRITE_PROJECT_ID'),
            'api_key': os.getenv('APPWRITE_API_KEY'),
            'backend_url': os.getenv('BACKEND_URL', 'http://localhost:8000'),
            'frontend_url': os.getenv('FRONTEND_URL', 'http://localhost:3000')
        }
        
    def initialize_clients(self):
        """Initialize Appwrite and HTTP clients"""
        self.client = Client()
        self.client.set_endpoint(self.config['endpoint'])
        
        if self.config['project_id']:
            self.client.set_project(self.config['project_id'])
            
        if self.config['api_key']:
            self.client.set_key(self.config['api_key'])
            
        self.account = Account(self.client)
        self.session = requests.Session()
        
    def test_appwrite_connection(self) -> Dict[str, Any]:
        """Test Appwrite connection and configuration"""
        test_name = "Appwrite Connection Test"
        try:
            # Test endpoint accessibility
            response = self.session.get(f"{self.config['endpoint']}/health")
            
            result = {
                'test': test_name,
                'status': 'passed' if response.status_code == 200 else 'failed',
                'endpoint': self.config['endpoint'],
                'project_id': self.config['project_id'],
                'api_key_configured': bool(self.config['api_key']),
                'response_code': response.status_code,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"{test_name}: {result['status']}")
            self.test_results.append(result)
            return result
            
        except Exception as e:
            result = {
                'test': test_name,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            logger.error(f"{test_name} failed: {e}")
            self.test_results.append(result)
            return result
    
    def test_backend_endpoints(self) -> Dict[str, Any]:
        """Test backend SSO endpoints"""
        test_name = "Backend SSO Endpoints Test"
        results = {
            'test': test_name,
            'endpoints': {},
            'timestamp': datetime.now().isoformat()
        }
        
        endpoints = [
            '/auth/health',
            '/auth/oauth/google',
            '/auth/oauth/github',
            '/auth/oauth/facebook',
            '/docs'
        ]
        
        for endpoint in endpoints:
            try:
                url = f"{self.config['backend_url']}{endpoint}"
                response = self.session.get(url, timeout=5)
                
                results['endpoints'][endpoint] = {
                    'url': url,
                    'status_code': response.status_code,
                    'accessible': response.status_code in [200, 302, 307],
                    'response_time': response.elapsed.total_seconds()
                }
                
                logger.info(f"Endpoint {endpoint}: {response.status_code}")
                
            except Exception as e:
                results['endpoints'][endpoint] = {
                    'url': f"{self.config['backend_url']}{endpoint}",
                    'accessible': False,
                    'error': str(e)
                }
                logger.error(f"Endpoint {endpoint} failed: {e}")
        
        # Determine overall status
        accessible_count = sum(1 for e in results['endpoints'].values() if e.get('accessible', False))
        results['status'] = 'passed' if accessible_count >= len(endpoints) * 0.7 else 'failed'
        results['summary'] = f"{accessible_count}/{len(endpoints)} endpoints accessible"
        
        self.test_results.append(results)
        return results
    
    def test_email_authentication(self) -> Dict[str, Any]:
        """Test email/password authentication flow"""
        test_name = "Email Authentication Test"
        test_email = f"test_{datetime.now().timestamp()}@example.com"
        test_password = "TestPassword123!"
        test_name_value = "Test User"
        
        results = {
            'test': test_name,
            'email': test_email,
            'steps': {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Step 1: Register new user
        try:
            register_url = f"{self.config['backend_url']}/auth/signup"
            register_data = {
                'email': test_email,
                'password': test_password,
                'name': test_name_value
            }
            
            response = self.session.post(register_url, json=register_data)
            
            results['steps']['registration'] = {
                'status_code': response.status_code,
                'success': response.status_code == 200
            }
            
            if response.status_code == 200:
                data = response.json()
                results['steps']['registration']['token_received'] = 'access_token' in data
                results['steps']['registration']['user_created'] = 'user' in data
                access_token = data.get('access_token')
            else:
                results['steps']['registration']['error'] = response.text
                
        except Exception as e:
            results['steps']['registration'] = {
                'success': False,
                'error': str(e)
            }
            access_token = None
        
        # Step 2: Login with credentials
        if access_token:
            try:
                login_url = f"{self.config['backend_url']}/auth/login"
                login_data = {
                    'email': test_email,
                    'password': test_password
                }
                
                response = self.session.post(login_url, json=login_data)
                
                results['steps']['login'] = {
                    'status_code': response.status_code,
                    'success': response.status_code == 200
                }
                
                if response.status_code == 200:
                    data = response.json()
                    results['steps']['login']['token_received'] = 'access_token' in data
                    access_token = data.get('access_token')
                else:
                    results['steps']['login']['error'] = response.text
                    
            except Exception as e:
                results['steps']['login'] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Step 3: Verify token with /auth/me
        if access_token:
            try:
                me_url = f"{self.config['backend_url']}/auth/me"
                headers = {'Authorization': f'Bearer {access_token}'}
                
                response = self.session.get(me_url, headers=headers)
                
                results['steps']['token_verification'] = {
                    'status_code': response.status_code,
                    'success': response.status_code == 200
                }
                
                if response.status_code == 200:
                    data = response.json()
                    results['steps']['token_verification']['user_data'] = {
                        'id': data.get('id'),
                        'email': data.get('email'),
                        'name': data.get('name')
                    }
                else:
                    results['steps']['token_verification']['error'] = response.text
                    
            except Exception as e:
                results['steps']['token_verification'] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Step 4: Logout
        if access_token:
            try:
                logout_url = f"{self.config['backend_url']}/auth/logout"
                headers = {'Authorization': f'Bearer {access_token}'}
                
                response = self.session.post(logout_url, headers=headers)
                
                results['steps']['logout'] = {
                    'status_code': response.status_code,
                    'success': response.status_code == 200
                }
                
            except Exception as e:
                results['steps']['logout'] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Determine overall status
        successful_steps = sum(1 for step in results['steps'].values() if step.get('success', False))
        results['status'] = 'passed' if successful_steps >= 3 else 'failed'
        results['summary'] = f"{successful_steps}/{len(results['steps'])} steps successful"
        
        logger.info(f"{test_name}: {results['status']} - {results['summary']}")
        self.test_results.append(results)
        return results
    
    def test_oauth_providers(self) -> Dict[str, Any]:
        """Test OAuth provider configurations"""
        test_name = "OAuth Providers Test"
        providers = ['google', 'github', 'facebook', 'microsoft', 'discord']
        
        results = {
            'test': test_name,
            'providers': {},
            'timestamp': datetime.now().isoformat()
        }
        
        for provider in providers:
            try:
                # Test OAuth initiation endpoint
                oauth_url = f"{self.config['backend_url']}/auth/oauth/{provider}"
                response = self.session.get(
                    oauth_url,
                    params={
                        'success_url': f"{self.config['frontend_url']}/auth/callback",
                        'failure_url': f"{self.config['frontend_url']}/auth/error"
                    },
                    allow_redirects=False
                )
                
                # OAuth endpoints should redirect (302/307) to provider
                is_redirect = response.status_code in [302, 307]
                has_location = 'Location' in response.headers
                
                results['providers'][provider] = {
                    'endpoint': oauth_url,
                    'status_code': response.status_code,
                    'configured': is_redirect and has_location,
                    'redirect_url': response.headers.get('Location', '')[:100] if has_location else None
                }
                
                logger.info(f"OAuth provider {provider}: {'configured' if results['providers'][provider]['configured'] else 'not configured'}")
                
            except Exception as e:
                results['providers'][provider] = {
                    'endpoint': f"{self.config['backend_url']}/auth/oauth/{provider}",
                    'configured': False,
                    'error': str(e)
                }
                logger.error(f"OAuth provider {provider} test failed: {e}")
        
        # Determine overall status
        configured_count = sum(1 for p in results['providers'].values() if p.get('configured', False))
        results['status'] = 'passed' if configured_count >= 3 else 'warning'  # At least 3 providers should be configured
        results['summary'] = f"{configured_count}/{len(providers)} providers configured"
        
        self.test_results.append(results)
        return results
    
    def test_security_headers(self) -> Dict[str, Any]:
        """Test security headers and CORS configuration"""
        test_name = "Security Headers Test"
        
        results = {
            'test': test_name,
            'headers': {},
            'cors': {},
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            # Test main endpoint
            response = self.session.get(f"{self.config['backend_url']}/health")
            
            # Check security headers
            security_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Strict-Transport-Security'
            ]
            
            for header in security_headers:
                results['headers'][header] = {
                    'present': header in response.headers,
                    'value': response.headers.get(header)
                }
            
            # Test CORS
            cors_response = self.session.options(
                f"{self.config['backend_url']}/auth/health",
                headers={
                    'Origin': self.config['frontend_url'],
                    'Access-Control-Request-Method': 'POST'
                }
            )
            
            results['cors'] = {
                'status_code': cors_response.status_code,
                'allow_origin': cors_response.headers.get('Access-Control-Allow-Origin'),
                'allow_methods': cors_response.headers.get('Access-Control-Allow-Methods'),
                'allow_headers': cors_response.headers.get('Access-Control-Allow-Headers'),
                'configured': cors_response.status_code == 200
            }
            
            # Determine status
            headers_present = sum(1 for h in results['headers'].values() if h.get('present', False))
            results['status'] = 'passed' if headers_present >= 2 and results['cors']['configured'] else 'warning'
            results['summary'] = f"{headers_present}/{len(security_headers)} security headers present, CORS: {'configured' if results['cors']['configured'] else 'not configured'}"
            
        except Exception as e:
            results['status'] = 'failed'
            results['error'] = str(e)
            results['summary'] = f"Security test failed: {e}"
        
        logger.info(f"{test_name}: {results['status']} - {results['summary']}")
        self.test_results.append(results)
        return results
    
    def test_frontend_integration(self) -> Dict[str, Any]:
        """Test frontend authentication components"""
        test_name = "Frontend Integration Test"
        
        results = {
            'test': test_name,
            'components': {},
            'environment': {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Check frontend environment files
        frontend_env_files = [
            'trading-app-frontend/.env',
            'trading-app-frontend/.env.development',
            'trading-app-frontend/.env.production'
        ]
        
        for env_file in frontend_env_files:
            file_path = os.path.join(os.path.dirname(__file__), env_file)
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    content = f.read()
                    results['environment'][env_file] = {
                        'exists': True,
                        'has_appwrite_config': 'REACT_APP_APPWRITE' in content,
                        'has_api_url': 'REACT_APP_API_URL' in content
                    }
            else:
                results['environment'][env_file] = {'exists': False}
        
        # Check key frontend components
        components = [
            'trading-app-frontend/src/components/AppwriteAuth.js',
            'trading-app-frontend/src/lib/appwrite.js',
            'trading-app-frontend/src/store/slices/userSlice.js'
        ]
        
        for component in components:
            file_path = os.path.join(os.path.dirname(__file__), component)
            results['components'][component] = {
                'exists': os.path.exists(file_path)
            }
        
        # Determine status
        env_configured = any(e.get('has_appwrite_config', False) for e in results['environment'].values())
        components_exist = sum(1 for c in results['components'].values() if c.get('exists', False))
        
        results['status'] = 'passed' if env_configured and components_exist >= 2 else 'warning'
        results['summary'] = f"Environment: {'configured' if env_configured else 'not configured'}, Components: {components_exist}/{len(components)} exist"
        
        logger.info(f"{test_name}: {results['status']} - {results['summary']}")
        self.test_results.append(results)
        return results
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        passed = sum(1 for t in self.test_results if t.get('status') == 'passed')
        failed = sum(1 for t in self.test_results if t.get('status') == 'failed')
        warnings = sum(1 for t in self.test_results if t.get('status') == 'warning')
        
        report = {
            'environment': self.environment,
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': len(self.test_results),
                'passed': passed,
                'failed': failed,
                'warnings': warnings,
                'success_rate': f"{(passed / len(self.test_results) * 100):.1f}%" if self.test_results else "0%"
            },
            'configuration': {
                'endpoint': self.config['endpoint'],
                'project_id': self.config['project_id'],
                'api_key_configured': bool(self.config['api_key']),
                'backend_url': self.config['backend_url'],
                'frontend_url': self.config['frontend_url']
            },
            'test_results': self.test_results,
            'recommendations': self.generate_recommendations()
        }
        
        return report
    
    def generate_recommendations(self) -> list:
        """Generate recommendations based on test results"""
        recommendations = []
        
        # Check connection test
        connection_test = next((t for t in self.test_results if t['test'] == 'Appwrite Connection Test'), None)
        if connection_test and connection_test['status'] == 'failed':
            recommendations.append({
                'priority': 'high',
                'issue': 'Appwrite connection failed',
                'action': 'Verify Appwrite endpoint URL and API key configuration'
            })
        
        # Check OAuth providers
        oauth_test = next((t for t in self.test_results if t['test'] == 'OAuth Providers Test'), None)
        if oauth_test:
            configured = sum(1 for p in oauth_test['providers'].values() if p.get('configured', False))
            if configured < 3:
                recommendations.append({
                    'priority': 'medium',
                    'issue': f'Only {configured} OAuth providers configured',
                    'action': 'Configure OAuth credentials in Appwrite Console for Google, GitHub, and Facebook'
                })
        
        # Check security headers
        security_test = next((t for t in self.test_results if t['test'] == 'Security Headers Test'), None)
        if security_test and security_test['status'] != 'passed':
            recommendations.append({
                'priority': 'medium',
                'issue': 'Security headers not fully configured',
                'action': 'Enable security headers in production environment'
            })
        
        # Check frontend integration
        frontend_test = next((t for t in self.test_results if t['test'] == 'Frontend Integration Test'), None)
        if frontend_test and frontend_test['status'] != 'passed':
            recommendations.append({
                'priority': 'high',
                'issue': 'Frontend not properly configured for Appwrite',
                'action': 'Update frontend environment variables with Appwrite configuration'
            })
        
        return recommendations
    
    def save_report(self, filename: str = None):
        """Save test report to file"""
        if not filename:
            filename = f"sso_test_report_{self.environment}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        report = self.generate_report()
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Test report saved to {filename}")
        return filename
    
    def print_summary(self):
        """Print test summary to console"""
        report = self.generate_report()
        
        print("\n" + "="*60)
        print(f"SSO Integration Test Report - {self.environment.upper()}")
        print("="*60)
        print(f"Timestamp: {report['timestamp']}")
        print(f"Endpoint: {report['configuration']['endpoint']}")
        print(f"Project ID: {report['configuration']['project_id']}")
        print("\nTest Summary:")
        print(f"  Total Tests: {report['summary']['total_tests']}")
        print(f"  Passed: {report['summary']['passed']}")
        print(f"  Failed: {report['summary']['failed']}")
        print(f"  Warnings: {report['summary']['warnings']}")
        print(f"  Success Rate: {report['summary']['success_rate']}")
        
        if report['recommendations']:
            print("\nRecommendations:")
            for i, rec in enumerate(report['recommendations'], 1):
                print(f"  {i}. [{rec['priority'].upper()}] {rec['issue']}")
                print(f"     Action: {rec['action']}")
        
        print("\nDetailed Results:")
        for test in self.test_results:
            status_icon = "✅" if test['status'] == 'passed' else "❌" if test['status'] == 'failed' else "⚠️"
            print(f"  {status_icon} {test['test']}: {test.get('summary', test['status'])}")
        
        print("="*60 + "\n")


def main():
    """Main test execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SSO Integration Test Suite')
    parser.add_argument('--environment', choices=['development', 'production'], 
                       default='development', help='Target environment')
    parser.add_argument('--save-report', action='store_true', 
                       help='Save test report to file')
    parser.add_argument('--report-file', type=str, 
                       help='Custom report filename')
    parser.add_argument('--verbose', action='store_true', 
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    print(f"Starting SSO Integration Tests for {args.environment} environment...")
    
    tester = SSOIntegrationTester(environment=args.environment)
    
    # Run all tests
    print("\n1. Testing Appwrite connection...")
    tester.test_appwrite_connection()
    
    print("2. Testing backend SSO endpoints...")
    tester.test_backend_endpoints()
    
    print("3. Testing email authentication flow...")
    tester.test_email_authentication()
    
    print("4. Testing OAuth provider configurations...")
    tester.test_oauth_providers()
    
    print("5. Testing security headers...")
    tester.test_security_headers()
    
    print("6. Testing frontend integration...")
    tester.test_frontend_integration()
    
    # Generate and display report
    tester.print_summary()
    
    if args.save_report:
        report_file = tester.save_report(args.report_file)
        print(f"Full report saved to: {report_file}")
    
    # Return exit code based on test results
    report = tester.generate_report()
    if report['summary']['failed'] > 0:
        sys.exit(1)
    elif report['summary']['warnings'] > 0:
        sys.exit(0)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()