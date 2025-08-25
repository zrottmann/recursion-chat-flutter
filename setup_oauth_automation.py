#!/usr/bin/env python3
"""
OAuth Setup Automation Script
Automates the entire OAuth provider configuration process for Appwrite
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
import shutil
from typing import Dict, Any, Optional

class OAuthSetupAutomation:
    """Automate OAuth provider setup"""
    
    def __init__(self, environment: str = "development"):
        self.environment = environment
        self.project_root = Path.cwd()
        self.config_file = self.project_root / "oauth_providers.json"
        self.env_file = self.project_root / ".env"
        
        # Set API key based on environment
        if environment == "development":
            self.api_key = "27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec"
        else:
            self.api_key = "standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2"
    
    def check_prerequisites(self) -> bool:
        """Check if all prerequisites are met"""
        print("🔍 Checking prerequisites...")
        
        # Check Python version
        if sys.version_info < (3, 7):
            print("❌ Python 3.7+ is required")
            return False
        print("✅ Python version OK")
        
        # Check for required files
        required_files = [
            "configure_oauth_providers.py",
            "test_oauth_providers.py"
        ]
        
        for file in required_files:
            if not (self.project_root / file).exists():
                print(f"❌ Missing required file: {file}")
                return False
        
        print("✅ All required files present")
        
        # Check for requests module
        try:
            import requests
            print("✅ Requests module installed")
        except ImportError:
            print("⚠️  Requests module not installed. Installing...")
            subprocess.run([sys.executable, "-m", "pip", "install", "requests"], check=True)
            print("✅ Requests module installed")
        
        return True
    
    def setup_environment_file(self) -> bool:
        """Setup .env file if it doesn't exist"""
        print("\n⚙️  Setting up environment file...")
        
        if not self.env_file.exists():
            example_file = self.project_root / "env.appwrite.example"
            if example_file.exists():
                shutil.copy(example_file, self.env_file)
                print("✅ Created .env file from example")
            else:
                print("⚠️  No .env file found. Please create one with APPWRITE_PROJECT_ID")
                return False
        else:
            print("✅ .env file exists")
        
        # Check for project ID
        env_content = self.env_file.read_text()
        if "your_project_id_here" in env_content:
            print("\n❗ IMPORTANT: Please update APPWRITE_PROJECT_ID in .env file")
            print("   Edit .env and replace 'your_project_id_here' with your actual project ID")
            return False
        
        return True
    
    def create_oauth_config(self) -> bool:
        """Create OAuth configuration file"""
        print("\n📝 Setting up OAuth configuration...")
        
        if self.config_file.exists():
            print("✅ OAuth configuration file exists")
            response = input("Do you want to update it? (y/n): ")
            if response.lower() != 'y':
                return True
        
        # Create example configuration
        subprocess.run([
            sys.executable,
            "configure_oauth_providers.py",
            "--create-example"
        ], check=True)
        
        print("\n📋 OAuth Provider Setup Instructions:")
        print("-" * 50)
        print("1. Edit oauth_providers.json.example")
        print("2. Add your actual OAuth credentials")
        print("3. Rename to oauth_providers.json")
        print("4. See oauth_setup_guide.md for detailed instructions")
        print("-" * 50)
        
        return True
    
    def configure_providers(self, project_id: str) -> bool:
        """Configure OAuth providers in Appwrite"""
        print(f"\n🚀 Configuring OAuth providers for {self.environment}...")
        
        if not self.config_file.exists():
            print("❌ oauth_providers.json not found")
            print("   Please create it with your OAuth credentials")
            return False
        
        # Run configuration script
        result = subprocess.run([
            sys.executable,
            "configure_oauth_providers.py",
            "--config-file", str(self.config_file),
            "--environment", self.environment,
            "--project-id", project_id,
            "--api-key", self.api_key
        ], capture_output=True, text=True)
        
        print(result.stdout)
        
        if result.returncode != 0:
            print(f"❌ Configuration failed: {result.stderr}")
            return False
        
        return True
    
    def test_configuration(self, project_id: str) -> bool:
        """Test OAuth provider configuration"""
        print("\n🧪 Testing OAuth configuration...")
        
        result = subprocess.run([
            sys.executable,
            "test_oauth_providers.py",
            "--project-id", project_id,
            "--api-key", self.api_key,
            "--report", "oauth_test_report.json"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        
        if result.returncode == 0:
            print("✅ All OAuth providers configured successfully!")
            return True
        else:
            print("⚠️  Some providers may need attention")
            print("   Check oauth_test_report.json for details")
            return False
    
    def display_summary(self, success: bool):
        """Display setup summary"""
        print("\n" + "=" * 60)
        print("OAUTH SETUP SUMMARY")
        print("=" * 60)
        
        if success:
            print("✅ OAuth providers configured successfully!")
            print("\nNext steps:")
            print("1. Test authentication in your application")
            print("2. Monitor provider logs for any issues")
            print("3. Update credentials as needed")
        else:
            print("⚠️  Setup completed with some issues")
            print("\nTroubleshooting:")
            print("1. Check oauth_test_report.json for details")
            print("2. Verify OAuth credentials are correct")
            print("3. Ensure redirect URLs match exactly")
            print("4. Check provider app settings")
        
        print("\nUseful commands:")
        print(f"  List providers:  python configure_oauth_providers.py --list-providers")
        print(f"  Test providers:  python test_oauth_providers.py --interactive")
        print(f"  View guide:      cat oauth_setup_guide.md")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Automate OAuth provider setup for Appwrite"
    )
    parser.add_argument(
        "--environment",
        choices=["development", "production"],
        default="development",
        help="Target environment"
    )
    parser.add_argument(
        "--project-id",
        type=str,
        help="Appwrite project ID"
    )
    parser.add_argument(
        "--skip-config",
        action="store_true",
        help="Skip configuration file creation"
    )
    parser.add_argument(
        "--skip-test",
        action="store_true",
        help="Skip testing after configuration"
    )
    
    args = parser.parse_args()
    
    print("🤖 Appwrite OAuth Setup Automation")
    print("=" * 60)
    print(f"Environment: {args.environment}")
    print("=" * 60)
    
    # Initialize automation
    automation = OAuthSetupAutomation(args.environment)
    
    # Check prerequisites
    if not automation.check_prerequisites():
        print("\n❌ Prerequisites check failed")
        return 1
    
    # Setup environment
    if not automation.setup_environment_file():
        if not args.project_id:
            print("\n❌ Project ID is required")
            print("   Use --project-id flag or set APPWRITE_PROJECT_ID in .env")
            return 1
    
    # Get project ID
    project_id = args.project_id
    if not project_id:
        # Try to get from environment
        project_id = os.getenv("APPWRITE_PROJECT_ID")
        if not project_id or project_id == "your_project_id_here":
            print("\n❌ Valid project ID is required")
            print("   Use --project-id flag or set APPWRITE_PROJECT_ID in .env")
            return 1
    
    print(f"\nProject ID: {project_id}")
    
    # Create OAuth configuration
    if not args.skip_config:
        if not automation.create_oauth_config():
            print("\n⚠️  OAuth configuration needs to be completed manually")
            print("   Follow the instructions above and run this script again")
            return 0
    
    # Configure providers
    success = automation.configure_providers(project_id)
    
    # Test configuration
    if success and not args.skip_test:
        automation.test_configuration(project_id)
    
    # Display summary
    automation.display_summary(success)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())