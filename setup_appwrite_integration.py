#!/usr/bin/env python3
"""
Appwrite Integration Setup Script
Automates the setup process for Trading Post Appwrite integration
"""

import os
import sys
import subprocess
import json
import shutil
from pathlib import Path
import argparse


def run_command(command, cwd=None, capture_output=True):
    """Run a shell command and return the result"""
    try:
        if isinstance(command, str):
            command = command.split()

        result = subprocess.run(command, cwd=cwd, capture_output=capture_output, text=True, check=True)
        return result.stdout.strip() if capture_output else None
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {' '.join(command)}")
        print(f"Error: {e.stderr if e.stderr else e}")
        return None


def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True


def check_node_version():
    """Check if Node.js is installed and compatible"""
    try:
        output = run_command("node --version")
        if output:
            version = output.replace("v", "")
            major_version = int(version.split(".")[0])
            if major_version >= 14:
                print(f"✅ Node.js {version} detected")
                return True
            else:
                print(f"❌ Node.js 14 or higher is required (found {version})")
                return False
    except:
        print("❌ Node.js not found. Please install Node.js 14 or higher")
        return False


def setup_backend_environment():
    """Set up backend environment"""
    print("\n🔧 Setting up backend environment...")

    # Create virtual environment if it doesn't exist
    if not os.path.exists("venv"):
        print("📦 Creating virtual environment...")
        if run_command("python -m venv venv") is None:
            return False

    # Determine pip command based on OS
    pip_cmd = "venv\\Scripts\\pip" if os.name == "nt" else "venv/bin/pip"

    # Install requirements
    print("📦 Installing Python dependencies...")
    if run_command(f"{pip_cmd} install -r requirements.txt") is None:
        return False

    print("✅ Backend environment setup complete")
    return True


def setup_frontend_environment():
    """Set up frontend environment"""
    print("\n🔧 Setting up frontend environment...")

    frontend_dir = "trading-app-frontend"

    if not os.path.exists(frontend_dir):
        print(f"❌ Frontend directory not found: {frontend_dir}")
        return False

    # Install npm dependencies
    print("📦 Installing npm dependencies...")
    if run_command("npm install", cwd=frontend_dir) is None:
        return False

    print("✅ Frontend environment setup complete")
    return True


def setup_environment_files(environment="development"):
    """Set up environment configuration files"""
    print(f"\n⚙️ Setting up {environment} environment files...")

    # Backend environment
    backend_env_source = f".env.appwrite.{environment}"
    backend_env_target = ".env"

    if os.path.exists(backend_env_source):
        shutil.copy2(backend_env_source, backend_env_target)
        print(f"✅ Created backend {backend_env_target}")
    else:
        print(f"⚠️ Backend environment file not found: {backend_env_source}")

    # Frontend environment
    frontend_dir = "trading-app-frontend"
    frontend_env_source = f"{frontend_dir}/.env.appwrite.{environment}"
    frontend_env_target = f"{frontend_dir}/.env.{environment}"

    if os.path.exists(frontend_env_source):
        shutil.copy2(frontend_env_source, frontend_env_target)
        print(f"✅ Created frontend {frontend_env_target}")
    else:
        print(f"⚠️ Frontend environment file not found: {frontend_env_source}")

    return True


def validate_appwrite_config():
    """Validate Appwrite configuration"""
    print("\n🔍 Validating Appwrite configuration...")

    required_env_vars = ["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY"]

    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file")
        return False

    print("✅ Appwrite configuration looks good")
    return True


def create_appwrite_collections_script():
    """Create script to set up Appwrite collections"""
    script_content = '''#!/usr/bin/env python3
"""
Appwrite Collections Setup Script
Creates the required collections and attributes for Trading Post
"""

import asyncio
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException
import os

async def setup_collections():
    """Setup Appwrite collections and attributes"""
    
    # Initialize client
    client = Client()
    client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
    client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
    client.set_key(os.getenv('APPWRITE_API_KEY'))
    
    databases = Databases(client)
    database_id = os.getenv('APPWRITE_DATABASE_ID', 'trading_post_db')
    
    try:
        # Create database
        try:
            await databases.create(database_id, 'Trading Post Database')
            print(f"✅ Created database: {database_id}")
        except AppwriteException as e:
            if e.code == 409:  # Database already exists
                print(f"ℹ️ Database already exists: {database_id}")
            else:
                raise
        
        # Define collections
        collections = {
            'users': {
                'name': 'Users',
                'attributes': [
                    {'key': 'name', 'type': 'string', 'size': 255, 'required': True},
                    {'key': 'email', 'type': 'email', 'required': True},
                    {'key': 'username', 'type': 'string', 'size': 100, 'required': True},
                    {'key': 'age', 'type': 'integer', 'required': False},
                    {'key': 'location', 'type': 'string', 'size': 255, 'required': False},
                    {'key': 'bio', 'type': 'string', 'size': 1000, 'required': False},
                    {'key': 'phone', 'type': 'string', 'size': 20, 'required': False},
                    {'key': 'profile_image_url', 'type': 'url', 'required': False},
                    {'key': 'opt_in_ai', 'type': 'boolean', 'required': True, 'default': True},
                    {'key': 'email_verified', 'type': 'boolean', 'required': True, 'default': False},
                    {'key': 'is_active', 'type': 'boolean', 'required': True, 'default': True},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            },
            'items': {
                'name': 'Items',
                'attributes': [
                    {'key': 'user_id', 'type': 'string', 'size': 36, 'required': True},
                    {'key': 'title', 'type': 'string', 'size': 255, 'required': True},
                    {'key': 'description', 'type': 'string', 'size': 2000, 'required': True},
                    {'key': 'category', 'type': 'string', 'size': 100, 'required': True},
                    {'key': 'type', 'type': 'string', 'size': 20, 'required': True},
                    {'key': 'condition', 'type': 'string', 'size': 50, 'required': False},
                    {'key': 'value_estimate', 'type': 'float', 'required': False},
                    {'key': 'location', 'type': 'string', 'size': 255, 'required': False},
                    {'key': 'is_active', 'type': 'boolean', 'required': True, 'default': True},
                    {'key': 'is_featured', 'type': 'boolean', 'required': True, 'default': False},
                    {'key': 'view_count', 'type': 'integer', 'required': True, 'default': 0},
                    {'key': 'save_count', 'type': 'integer', 'required': True, 'default': 0},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            },
            'trades': {
                'name': 'Trades',
                'attributes': [
                    {'key': 'user1_id', 'type': 'string', 'size': 36, 'required': True},
                    {'key': 'user2_id', 'type': 'string', 'size': 36, 'required': True},
                    {'key': 'listing1_id', 'type': 'string', 'size': 36, 'required': False},
                    {'key': 'listing2_id', 'type': 'string', 'size': 36, 'required': False},
                    {'key': 'status', 'type': 'string', 'size': 50, 'required': True},
                    {'key': 'ai_reason', 'type': 'string', 'size': 1000, 'required': False},
                    {'key': 'score', 'type': 'float', 'required': False},
                    {'key': 'created_at', 'type': 'datetime', 'required': True},
                    {'key': 'updated_at', 'type': 'datetime', 'required': True}
                ]
            },
            'messages': {
                'name': 'Messages',
                'attributes': [
                    {'key': 'sender_id', 'type': 'string', 'size': 36, 'required': True},
                    {'key': 'recipient_id', 'type': 'string', 'size': 36, 'required': True},
                    {'key': 'trade_id', 'type': 'string', 'size': 36, 'required': False},
                    {'key': 'content', 'type': 'string', 'size': 2000, 'required': True},
                    {'key': 'message_type', 'type': 'string', 'size': 20, 'required': True},
                    {'key': 'is_read', 'type': 'boolean', 'required': True, 'default': False},
                    {'key': 'created_at', 'type': 'datetime', 'required': True}
                ]
            }
        }
        
        # Create collections
        for collection_id, config in collections.items():
            try:
                await databases.create_collection(
                    database_id, 
                    collection_id, 
                    config['name']
                )
                print(f"✅ Created collection: {config['name']}")
                
                # Create attributes
                for attr in config['attributes']:
                    try:
                        if attr['type'] == 'string':
                            await databases.create_string_attribute(
                                database_id, collection_id, attr['key'], 
                                attr['size'], attr['required'], 
                                attr.get('default')
                            )
                        elif attr['type'] == 'integer':
                            await databases.create_integer_attribute(
                                database_id, collection_id, attr['key'], 
                                attr['required'], None, None, 
                                attr.get('default')
                            )
                        elif attr['type'] == 'float':
                            await databases.create_float_attribute(
                                database_id, collection_id, attr['key'], 
                                attr['required'], None, None, 
                                attr.get('default')
                            )
                        elif attr['type'] == 'boolean':
                            await databases.create_boolean_attribute(
                                database_id, collection_id, attr['key'], 
                                attr['required'], attr.get('default')
                            )
                        elif attr['type'] == 'datetime':
                            await databases.create_datetime_attribute(
                                database_id, collection_id, attr['key'], 
                                attr['required'], attr.get('default')
                            )
                        elif attr['type'] == 'email':
                            await databases.create_email_attribute(
                                database_id, collection_id, attr['key'], 
                                attr['required'], attr.get('default')
                            )
                        elif attr['type'] == 'url':
                            await databases.create_url_attribute(
                                database_id, collection_id, attr['key'], 
                                attr['required'], attr.get('default')
                            )
                        
                        print(f"  ✅ Created attribute: {attr['key']}")
                    
                    except AppwriteException as e:
                        if e.code == 409:  # Attribute already exists
                            print(f"  ℹ️ Attribute already exists: {attr['key']}")
                        else:
                            print(f"  ❌ Failed to create attribute {attr['key']}: {e}")
                
            except AppwriteException as e:
                if e.code == 409:  # Collection already exists
                    print(f"ℹ️ Collection already exists: {config['name']}")
                else:
                    print(f"❌ Failed to create collection {config['name']}: {e}")
        
        print("\\n✅ Collections setup complete!")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    import asyncio
    success = asyncio.run(setup_collections())
    exit(0 if success else 1)
'''

    with open("setup_appwrite_collections.py", "w") as f:
        f.write(script_content)

    print("✅ Created Appwrite collections setup script")


def display_next_steps():
    """Display next steps for the user"""
    print("\n" + "=" * 60)
    print("🎉 APPWRITE INTEGRATION SETUP COMPLETE!")
    print("=" * 60)
    print("\n📋 Next Steps:")
    print("1. Configure your Appwrite project in the console")
    print("2. Update environment variables in .env files")
    print("3. Run: python setup_appwrite_collections.py")
    print("4. Start the backend: python app_appwrite.py")
    print("5. Start the frontend: cd trading-app-frontend && npm start")
    print("\n📚 Documentation:")
    print("- Read APPWRITE_INTEGRATION_COMPLETE.md for detailed information")
    print("- Check environment configuration files for all available options")
    print("\n🔧 Troubleshooting:")
    print("- Ensure all environment variables are set correctly")
    print("- Check Appwrite console for project configuration")
    print("- Review logs for any error messages")
    print("\n🚀 Happy coding!")


def main():
    """Main setup function"""
    parser = argparse.ArgumentParser(description="Setup Trading Post Appwrite Integration")
    parser.add_argument(
        "--environment", choices=["development", "production"], default="development", help="Environment to set up"
    )
    parser.add_argument("--skip-deps", action="store_true", help="Skip dependency installation")

    args = parser.parse_args()

    print("🚀 Trading Post - Appwrite Integration Setup")
    print("=" * 50)

    # Check prerequisites
    if not check_python_version():
        return False

    if not check_node_version():
        return False

    # Setup environments
    if not args.skip_deps:
        if not setup_backend_environment():
            return False

        if not setup_frontend_environment():
            return False

    # Setup environment files
    if not setup_environment_files(args.environment):
        return False

    # Create additional setup scripts
    create_appwrite_collections_script()

    # Display next steps
    display_next_steps()

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
