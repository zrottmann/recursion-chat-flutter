#!/usr/bin/env python3
"""
Appwrite OAuth Provider Configuration Script
Configures OAuth providers programmatically using Appwrite Management API

This script sets up OAuth providers for both development and production environments
using the Appwrite Management API with provided API keys.
"""

import os
import sys
import json
import requests
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum
import argparse
from datetime import datetime

# Configuration Classes
@dataclass
class AppwriteConfig:
    """Appwrite instance configuration"""
    endpoint: str
    project_id: str
    api_key: str
    environment: str

@dataclass 
class OAuthProvider:
    """OAuth provider configuration"""
    key: str
    name: str
    app_id: str
    secret: str
    enabled: bool = True
    scopes: List[str] = None

class Environment(Enum):
    """Environment types"""
    DEVELOPMENT = "development"
    PRODUCTION = "production"

class AppwriteOAuthConfigurator:
    """Main configurator class for Appwrite OAuth providers"""
    
    def __init__(self, config: AppwriteConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'X-Appwrite-Project': config.project_id,
            'X-Appwrite-Key': config.api_key,
            'Content-Type': 'application/json'
        })
        self.base_url = f"{config.endpoint}/v1"
        
    def get_redirect_urls(self, provider: str) -> Dict[str, str]:
        """Generate redirect URLs for a provider based on environment"""
        if self.config.environment == Environment.DEVELOPMENT.value:
            base_url = "http://localhost:3000"
        else:
            base_url = "https://tradingpost-2tq2f.ondigitalocean.app"
            
        return {
            "success": f"{base_url}/auth/callback/{provider}",
            "failure": f"{base_url}/auth/error"
        }
    
    def test_connection(self) -> bool:
        """Test connection to Appwrite API"""
        try:
            print(f"Testing connection to {self.config.endpoint}...")
            response = self.session.get(f"{self.base_url}/projects/{self.config.project_id}")
            if response.status_code == 200:
                project = response.json()
                print(f"✅ Connected successfully to project: {project.get('name', self.config.project_id)}")
                return True
            else:
                print(f"❌ Connection failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
    
    def list_current_providers(self) -> List[Dict[str, Any]]:
        """List currently configured OAuth providers"""
        try:
            response = self.session.get(
                f"{self.base_url}/projects/{self.config.project_id}/oauth2"
            )
            if response.status_code == 200:
                providers = response.json().get('providers', [])
                return providers
            else:
                print(f"Failed to list providers: {response.status_code}")
                return []
        except Exception as e:
            print(f"Error listing providers: {e}")
            return []
    
    def configure_provider(self, provider: OAuthProvider) -> bool:
        """Configure a single OAuth provider"""
        try:
            urls = self.get_redirect_urls(provider.key)
            
            # Prepare the request payload
            payload = {
                "appId": provider.app_id,
                "secret": provider.secret,
                "enabled": provider.enabled
            }
            
            # Add scopes if provided
            if provider.scopes:
                payload["scopes"] = provider.scopes
            
            # Update provider configuration
            url = f"{self.base_url}/projects/{self.config.project_id}/oauth2/providers/{provider.key}"
            
            print(f"\nConfiguring {provider.name}...")
            print(f"  - Client ID: {provider.app_id[:20]}..." if len(provider.app_id) > 20 else f"  - Client ID: {provider.app_id}")
            print(f"  - Redirect URL (Success): {urls['success']}")
            print(f"  - Redirect URL (Failure): {urls['failure']}")
            print(f"  - Enabled: {provider.enabled}")
            if provider.scopes:
                print(f"  - Scopes: {', '.join(provider.scopes)}")
            
            response = self.session.patch(url, json=payload)
            
            if response.status_code in [200, 201]:
                print(f"✅ {provider.name} configured successfully!")
                return True
            else:
                print(f"❌ Failed to configure {provider.name}: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error configuring {provider.name}: {e}")
            return False
    
    def configure_all_providers(self, providers: List[OAuthProvider]) -> Dict[str, bool]:
        """Configure all OAuth providers"""
        results = {}
        
        print("\n" + "="*60)
        print(f"CONFIGURING OAUTH PROVIDERS FOR {self.config.environment.upper()}")
        print("="*60)
        
        for provider in providers:
            success = self.configure_provider(provider)
            results[provider.key] = success
            
        return results
    
    def display_provider_status(self):
        """Display current status of all providers"""
        print("\n" + "="*60)
        print("CURRENT OAUTH PROVIDER STATUS")
        print("="*60)
        
        providers = self.list_current_providers()
        
        if not providers:
            print("No OAuth providers configured yet.")
            return
        
        for provider in providers:
            status = "✅ Enabled" if provider.get('enabled') else "❌ Disabled"
            print(f"\n{provider.get('name', provider.get('key'))}:")
            print(f"  - Status: {status}")
            print(f"  - Client ID: {provider.get('appId', 'Not set')}")
            print(f"  - Has Secret: {'Yes' if provider.get('secret') else 'No'}")

def get_default_providers() -> List[OAuthProvider]:
    """Get default OAuth provider configurations with placeholder values"""
    return [
        OAuthProvider(
            key="google",
            name="Google OAuth 2.0",
            app_id="YOUR_GOOGLE_CLIENT_ID",  # Placeholder
            secret="YOUR_GOOGLE_CLIENT_SECRET",  # Placeholder
            scopes=["openid", "email", "profile"]
        ),
        OAuthProvider(
            key="github",
            name="GitHub OAuth",
            app_id="YOUR_GITHUB_CLIENT_ID",  # Placeholder
            secret="YOUR_GITHUB_CLIENT_SECRET",  # Placeholder
            scopes=["user:email"]
        ),
        OAuthProvider(
            key="facebook",
            name="Facebook OAuth",
            app_id="YOUR_FACEBOOK_APP_ID",  # Placeholder
            secret="YOUR_FACEBOOK_APP_SECRET",  # Placeholder
            scopes=["email", "public_profile"]
        ),
        OAuthProvider(
            key="microsoft",
            name="Microsoft OAuth",
            app_id="YOUR_MICROSOFT_CLIENT_ID",  # Placeholder
            secret="YOUR_MICROSOFT_CLIENT_SECRET",  # Placeholder
            scopes=["openid", "email", "profile", "offline_access"],
            enabled=False  # Disabled by default
        ),
        OAuthProvider(
            key="discord",
            name="Discord OAuth",
            app_id="YOUR_DISCORD_CLIENT_ID",  # Placeholder
            secret="YOUR_DISCORD_CLIENT_SECRET",  # Placeholder
            scopes=["identify", "email"],
            enabled=False  # Disabled by default
        )
    ]

def load_provider_config(config_file: str) -> List[OAuthProvider]:
    """Load OAuth provider configuration from JSON file"""
    if os.path.exists(config_file):
        print(f"Loading provider configuration from {config_file}...")
        with open(config_file, 'r') as f:
            data = json.load(f)
            providers = []
            for key, config in data.items():
                providers.append(OAuthProvider(
                    key=key,
                    name=config.get('name', key),
                    app_id=config.get('app_id', ''),
                    secret=config.get('secret', ''),
                    enabled=config.get('enabled', True),
                    scopes=config.get('scopes', [])
                ))
            return providers
    else:
        print(f"Configuration file not found: {config_file}")
        return get_default_providers()

def save_example_config(filename: str = "oauth_providers.json.example"):
    """Save an example configuration file"""
    example_config = {
        "google": {
            "name": "Google OAuth 2.0",
            "app_id": "YOUR_GOOGLE_CLIENT_ID",
            "secret": "YOUR_GOOGLE_CLIENT_SECRET",
            "enabled": True,
            "scopes": ["openid", "email", "profile"]
        },
        "github": {
            "name": "GitHub OAuth",
            "app_id": "YOUR_GITHUB_CLIENT_ID",
            "secret": "YOUR_GITHUB_CLIENT_SECRET",
            "enabled": True,
            "scopes": ["user:email"]
        },
        "facebook": {
            "name": "Facebook OAuth",
            "app_id": "YOUR_FACEBOOK_APP_ID",
            "secret": "YOUR_FACEBOOK_APP_SECRET",
            "enabled": True,
            "scopes": ["email", "public_profile"]
        },
        "microsoft": {
            "name": "Microsoft OAuth",
            "app_id": "YOUR_MICROSOFT_CLIENT_ID",
            "secret": "YOUR_MICROSOFT_CLIENT_SECRET",
            "enabled": False,
            "scopes": ["openid", "email", "profile", "offline_access"]
        },
        "discord": {
            "name": "Discord OAuth",
            "app_id": "YOUR_DISCORD_CLIENT_ID",
            "secret": "YOUR_DISCORD_CLIENT_SECRET",
            "enabled": False,
            "scopes": ["identify", "email"]
        }
    }
    
    with open(filename, 'w') as f:
        json.dump(example_config, f, indent=2)
    
    print(f"✅ Example configuration saved to {filename}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Configure Appwrite OAuth providers programmatically"
    )
    parser.add_argument(
        "--environment",
        choices=["development", "production"],
        default="development",
        help="Target environment (default: development)"
    )
    parser.add_argument(
        "--config-file",
        type=str,
        help="JSON file with OAuth provider configurations"
    )
    parser.add_argument(
        "--create-example",
        action="store_true",
        help="Create an example configuration file"
    )
    parser.add_argument(
        "--list-providers",
        action="store_true",
        help="List current provider configurations"
    )
    parser.add_argument(
        "--endpoint",
        type=str,
        help="Appwrite endpoint URL (override environment variable)"
    )
    parser.add_argument(
        "--project-id",
        type=str,
        help="Appwrite project ID (override environment variable)"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="Appwrite API key (override environment variable)"
    )
    
    args = parser.parse_args()
    
    # Create example configuration if requested
    if args.create_example:
        save_example_config()
        return
    
    # Determine which API key to use based on environment
    if args.environment == "development":
        default_api_key = "27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec"
    else:
        default_api_key = "standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2"
    
    # Create Appwrite configuration
    config = AppwriteConfig(
        endpoint=args.endpoint or os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io"),
        project_id=args.project_id or os.getenv("APPWRITE_PROJECT_ID", ""),
        api_key=args.api_key or os.getenv("APPWRITE_API_KEY", default_api_key),
        environment=args.environment
    )
    
    # Validate configuration
    if not config.project_id:
        print("❌ Error: APPWRITE_PROJECT_ID is required")
        print("Please set it as an environment variable or use --project-id flag")
        return
    
    print(f"🚀 Appwrite OAuth Provider Configuration Tool")
    print(f"="*60)
    print(f"Environment: {config.environment}")
    print(f"Endpoint: {config.endpoint}")
    print(f"Project ID: {config.project_id}")
    print(f"API Key: {config.api_key[:20]}...")
    
    # Initialize configurator
    configurator = AppwriteOAuthConfigurator(config)
    
    # Test connection
    if not configurator.test_connection():
        print("\n❌ Failed to connect to Appwrite. Please check your configuration.")
        return
    
    # List providers if requested
    if args.list_providers:
        configurator.display_provider_status()
        return
    
    # Load provider configurations
    if args.config_file:
        providers = load_provider_config(args.config_file)
    else:
        print("\n⚠️  No configuration file provided. Using placeholder values.")
        print("Create a configuration file with actual OAuth credentials.")
        save_example_config()
        providers = get_default_providers()
    
    # Configure providers
    results = configurator.configure_all_providers(providers)
    
    # Display results
    print("\n" + "="*60)
    print("CONFIGURATION RESULTS")
    print("="*60)
    
    success_count = sum(1 for success in results.values() if success)
    total_count = len(results)
    
    for provider_key, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"{provider_key}: {status}")
    
    print(f"\nConfigured {success_count}/{total_count} providers successfully")
    
    # Display current status
    configurator.display_provider_status()
    
    # Display next steps
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print("\n1. Obtain OAuth credentials from each provider:")
    print("   - See oauth_setup_guide.md for detailed instructions")
    print("\n2. Create oauth_providers.json with actual credentials")
    print("\n3. Run this script again with the configuration file:")
    print(f"   python configure_oauth_providers.py --config-file oauth_providers.json --environment {args.environment}")
    print("\n4. Test the OAuth flow in your application")
    print("\n5. For production, run with --environment production")

if __name__ == "__main__":
    main()