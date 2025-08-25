#!/usr/bin/env python3
"""
OAuth Provider Testing Script
Tests the configured OAuth providers in Appwrite
"""

import os
import sys
import json
import requests
import argparse
from typing import Dict, Any, List
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

class CallbackHandler(BaseHTTPRequestHandler):
    """HTTP handler for OAuth callback"""
    
    def do_GET(self):
        """Handle GET request for OAuth callback"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        # Parse the query parameters
        query = urlparse(self.path).query
        params = parse_qs(query)
        
        # Check for success or error
        if 'userId' in params and 'secret' in params:
            html = """
            <html>
            <head><title>OAuth Success</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: green;">✅ Authentication Successful!</h1>
                <p>You can close this window now.</p>
                <script>setTimeout(() => window.close(), 3000);</script>
            </body>
            </html>
            """
            # Store the credentials for processing
            self.server.oauth_result = {
                'success': True,
                'userId': params['userId'][0],
                'secret': params['secret'][0]
            }
        else:
            error_msg = params.get('error', ['Unknown error'])[0]
            html = f"""
            <html>
            <head><title>OAuth Error</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: red;">❌ Authentication Failed</h1>
                <p>Error: {error_msg}</p>
                <p>You can close this window now.</p>
            </body>
            </html>
            """
            self.server.oauth_result = {
                'success': False,
                'error': error_msg
            }
        
        self.wfile.write(html.encode())
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

class OAuthProviderTester:
    """Test OAuth provider configurations"""
    
    def __init__(self, endpoint: str, project_id: str, api_key: str):
        self.endpoint = endpoint
        self.project_id = project_id
        self.api_key = api_key
        self.base_url = f"{endpoint}/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'X-Appwrite-Project': project_id,
            'X-Appwrite-Key': api_key,
            'Content-Type': 'application/json'
        })
    
    def get_configured_providers(self) -> List[Dict[str, Any]]:
        """Get list of configured OAuth providers"""
        try:
            response = self.session.get(
                f"{self.base_url}/projects/{self.project_id}/oauth2"
            )
            if response.status_code == 200:
                data = response.json()
                providers = data.get('providers', [])
                # Filter only enabled providers
                return [p for p in providers if p.get('enabled', False)]
            else:
                print(f"Failed to get providers: {response.status_code}")
                return []
        except Exception as e:
            print(f"Error getting providers: {e}")
            return []
    
    def test_provider_endpoint(self, provider_key: str) -> Dict[str, Any]:
        """Test if provider OAuth endpoint is accessible"""
        results = {
            'provider': provider_key,
            'endpoint_accessible': False,
            'configuration_valid': False,
            'error': None
        }
        
        try:
            # Test if we can initiate OAuth flow
            callback_url = "http://localhost:8080/callback"
            
            # Create OAuth session URL
            oauth_url = f"{self.base_url}/account/sessions/oauth2/{provider_key}"
            
            response = self.session.get(oauth_url, params={
                'success': callback_url,
                'failure': callback_url
            }, allow_redirects=False)
            
            if response.status_code == 302:  # Redirect response expected
                results['endpoint_accessible'] = True
                redirect_url = response.headers.get('Location', '')
                
                # Check if redirect URL contains provider domain
                if provider_key in redirect_url or self._check_provider_url(provider_key, redirect_url):
                    results['configuration_valid'] = True
                else:
                    results['error'] = "Invalid redirect URL"
            else:
                results['error'] = f"Unexpected response: {response.status_code}"
                
        except Exception as e:
            results['error'] = str(e)
        
        return results
    
    def _check_provider_url(self, provider: str, url: str) -> bool:
        """Check if URL belongs to the expected provider"""
        provider_domains = {
            'google': ['accounts.google.com', 'google.com'],
            'github': ['github.com'],
            'facebook': ['facebook.com', 'fb.com'],
            'microsoft': ['login.microsoftonline.com', 'microsoft.com'],
            'discord': ['discord.com', 'discordapp.com']
        }
        
        domains = provider_domains.get(provider, [])
        parsed_url = urlparse(url)
        
        return any(domain in parsed_url.netloc for domain in domains)
    
    def interactive_test(self, provider_key: str) -> bool:
        """Perform interactive OAuth test with local callback server"""
        print(f"\n🧪 Starting interactive test for {provider_key}...")
        
        # Start local callback server
        server = HTTPServer(('localhost', 8080), CallbackHandler)
        server.oauth_result = None
        
        # Run server in background thread
        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.daemon = True
        server_thread.start()
        
        try:
            # Generate OAuth URL
            callback_url = "http://localhost:8080/callback"
            oauth_url = f"{self.base_url}/account/sessions/oauth2/{provider_key}"
            
            full_url = f"{oauth_url}?success={callback_url}&failure={callback_url}"
            
            print(f"Opening browser for {provider_key} authentication...")
            print(f"URL: {full_url}")
            
            # Open browser
            webbrowser.open(full_url)
            
            # Wait for callback (timeout after 60 seconds)
            timeout = 60
            start_time = time.time()
            
            print("Waiting for authentication callback...")
            print("(Complete the authentication in your browser)")
            
            while server.oauth_result is None and (time.time() - start_time) < timeout:
                time.sleep(1)
            
            if server.oauth_result:
                if server.oauth_result['success']:
                    print(f"✅ {provider_key} authentication successful!")
                    return True
                else:
                    print(f"❌ {provider_key} authentication failed: {server.oauth_result.get('error')}")
                    return False
            else:
                print(f"⏱️ Authentication timeout for {provider_key}")
                return False
                
        finally:
            server.shutdown()
    
    def test_all_providers(self, interactive: bool = False) -> Dict[str, Dict[str, Any]]:
        """Test all configured providers"""
        results = {}
        providers = self.get_configured_providers()
        
        if not providers:
            print("No enabled OAuth providers found.")
            return results
        
        print(f"\nFound {len(providers)} enabled provider(s)")
        
        for provider in providers:
            provider_key = provider.get('key', provider.get('provider'))
            provider_name = provider.get('name', provider_key)
            
            print(f"\n📋 Testing {provider_name} ({provider_key})...")
            
            # Basic endpoint test
            test_result = self.test_provider_endpoint(provider_key)
            
            # Interactive test if requested
            if interactive and test_result['configuration_valid']:
                test_result['interactive_test'] = self.interactive_test(provider_key)
            
            results[provider_key] = test_result
            
            # Display results
            if test_result['endpoint_accessible']:
                print(f"  ✅ Endpoint accessible")
            else:
                print(f"  ❌ Endpoint not accessible")
            
            if test_result['configuration_valid']:
                print(f"  ✅ Configuration appears valid")
            else:
                print(f"  ❌ Configuration issues detected")
            
            if test_result.get('error'):
                print(f"  ⚠️  Error: {test_result['error']}")
        
        return results

def display_test_report(results: Dict[str, Dict[str, Any]]):
    """Display comprehensive test report"""
    print("\n" + "="*60)
    print("OAUTH PROVIDER TEST REPORT")
    print("="*60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-"*60)
    
    if not results:
        print("No test results available.")
        return
    
    # Summary
    total = len(results)
    accessible = sum(1 for r in results.values() if r['endpoint_accessible'])
    valid = sum(1 for r in results.values() if r['configuration_valid'])
    
    print(f"\nSummary:")
    print(f"  Total Providers Tested: {total}")
    print(f"  Endpoints Accessible: {accessible}/{total}")
    print(f"  Configurations Valid: {valid}/{total}")
    
    # Detailed results
    print(f"\nDetailed Results:")
    for provider, result in results.items():
        status = "✅" if result['configuration_valid'] else "⚠️"
        print(f"\n{status} {provider.upper()}")
        print(f"  - Endpoint: {'✅ Accessible' if result['endpoint_accessible'] else '❌ Not Accessible'}")
        print(f"  - Config: {'✅ Valid' if result['configuration_valid'] else '❌ Invalid'}")
        if result.get('interactive_test') is not None:
            print(f"  - Interactive: {'✅ Passed' if result['interactive_test'] else '❌ Failed'}")
        if result.get('error'):
            print(f"  - Error: {result['error']}")
    
    # Recommendations
    print(f"\n" + "-"*60)
    print("Recommendations:")
    
    for provider, result in results.items():
        if not result['configuration_valid']:
            print(f"\n⚠️  {provider.upper()} needs attention:")
            print(f"  1. Verify OAuth credentials are correct")
            print(f"  2. Check redirect URLs match exactly")
            print(f"  3. Ensure provider app is not in restricted mode")
            print(f"  4. Verify API keys have proper permissions")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Test Appwrite OAuth provider configurations"
    )
    parser.add_argument(
        "--endpoint",
        type=str,
        default=os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io"),
        help="Appwrite endpoint URL"
    )
    parser.add_argument(
        "--project-id",
        type=str,
        default=os.getenv("APPWRITE_PROJECT_ID"),
        help="Appwrite project ID"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=os.getenv("APPWRITE_API_KEY"),
        help="Appwrite API key"
    )
    parser.add_argument(
        "--provider",
        type=str,
        help="Test specific provider only"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Run interactive authentication test"
    )
    parser.add_argument(
        "--report",
        type=str,
        help="Save test report to file"
    )
    
    args = parser.parse_args()
    
    # Validate configuration
    if not args.project_id:
        print("❌ Error: Project ID is required")
        print("Set APPWRITE_PROJECT_ID environment variable or use --project-id")
        return
    
    if not args.api_key:
        print("❌ Error: API key is required")
        print("Set APPWRITE_API_KEY environment variable or use --api-key")
        return
    
    print("🧪 Appwrite OAuth Provider Testing Tool")
    print("="*60)
    print(f"Endpoint: {args.endpoint}")
    print(f"Project: {args.project_id}")
    
    # Initialize tester
    tester = OAuthProviderTester(
        endpoint=args.endpoint,
        project_id=args.project_id,
        api_key=args.api_key
    )
    
    # Run tests
    if args.provider:
        # Test specific provider
        print(f"\nTesting provider: {args.provider}")
        result = tester.test_provider_endpoint(args.provider)
        if args.interactive and result['configuration_valid']:
            result['interactive_test'] = tester.interactive_test(args.provider)
        results = {args.provider: result}
    else:
        # Test all providers
        results = tester.test_all_providers(interactive=args.interactive)
    
    # Display report
    display_test_report(results)
    
    # Save report if requested
    if args.report:
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': args.endpoint,
            'project_id': args.project_id,
            'results': results
        }
        
        with open(args.report, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n✅ Report saved to {args.report}")
    
    # Exit code based on results
    if results:
        all_valid = all(r['configuration_valid'] for r in results.values())
        sys.exit(0 if all_valid else 1)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()