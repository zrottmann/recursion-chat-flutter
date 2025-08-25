#!/usr/bin/env python3
"""
Deploy Python Functions to Appwrite with Correct Runtime
This script deploys the AI Matching and API Python functions with python-3.9 runtime
"""

import os
import sys
import json
import zipfile
import tempfile
import shutil
from pathlib import Path
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.functions import Functions
from appwrite.input_file import InputFile
from appwrite.exception import AppwriteException

# Load environment
load_dotenv('.env.appwrite')

print("Deploying Python Functions to Appwrite")
print("=" * 60)

# Initialize client
client = Client()
client.set_endpoint(os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1"))
client.set_project(os.getenv("APPWRITE_PROJECT_ID", "689bdee000098bd9d55c"))
client.set_key(os.getenv("APPWRITE_API_KEY"))

functions = Functions(client)

def create_function_package(source_dir, output_path):
    """Create a tar.gz package for Appwrite function deployment"""
    import tarfile
    
    with tarfile.open(output_path, 'w:gz') as tar:
        for item in Path(source_dir).rglob('*'):
            if item.is_file() and not item.name.startswith('.'):
                arcname = str(item.relative_to(source_dir))
                tar.add(item, arcname=arcname)
    
    print(f"  [OK] Created package: {output_path}")
    return output_path

def deploy_ai_matching_function():
    """Deploy the AI Matching Python function"""
    print("\n1. Deploying AI Matching Function (Python)...")
    
    try:
        function_id = "ai-matching-service"
        
        # Create or update function
        try:
            function = functions.get(function_id)
            print(f"  [OK] Function exists: {function_id}")
            
            # Update function with correct runtime
            function = functions.update(
                function_id=function_id,
                name="AI Matching Service",
                execute=["users"],
                enabled=True,
                logging=True,
                runtime="python-3.9",
                entrypoint="main.py",
                events=["databases.*.collections.items.documents.*.create"],
                timeout=60
            )
            print(f"  [OK] Updated function runtime to python-3.9")
        except AppwriteException:
            # Create function
            function = functions.create(
                function_id=function_id,
                name="AI Matching Service",
                runtime="python-3.9",
                execute=["users"],
                enabled=True,
                logging=True,
                entrypoint="main.py",
                events=["databases.*.collections.items.documents.*.create"],
                timeout=60
            )
            print(f"  [OK] Created function: {function_id}")
        
        # Prepare function code
        ai_dir = Path("functions/ai-matching")
        
        if not ai_dir.exists():
            print(f"  [ERROR] AI matching directory not found: {ai_dir}")
            return False
        
        # Create deployment package
        with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp:
            package_path = create_function_package(ai_dir, tmp.name)
        
        # Deploy the code
        print("  [INFO] Uploading AI matching code...")
        with open(package_path, 'rb') as f:
            deployment = functions.create_deployment(
                function_id=function_id,
                code=InputFile.from_bytes(f.read(), filename="code.tar.gz"),
                activate=True
            )
        
        print(f"  [OK] AI Matching deployed - ID: {deployment['$id']}")
        
        # Set environment variables
        env_vars = {
            "APPWRITE_FUNCTION_ENDPOINT": os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1"),
            "APPWRITE_FUNCTION_PROJECT_ID": os.getenv("APPWRITE_PROJECT_ID"),
            "APPWRITE_DATABASE_ID": "trading_post_main",
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", "${OPENAI_API_KEY}")
        }
        
        for key, value in env_vars.items():
            if value:  # Only set if value is not None/empty
                try:
                    functions.create_variable(
                        function_id=function_id,
                        key=key,
                        value=value
                    )
                    print(f"    [OK] Set variable: {key}")
                except Exception as e:
                    # Variable might already exist
                    print(f"    [INFO] Variable {key} might already exist: {e}")
        
        # Clean up
        os.unlink(package_path)
        
        return True
        
    except Exception as e:
        print(f"  [ERROR] AI Matching deployment failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def deploy_api_function():
    """Deploy the API Python function"""
    print("\n2. Deploying API Function (Python)...")
    
    try:
        function_id = "trading-post-api"
        
        # Create or update function
        try:
            function = functions.get(function_id)
            print(f"  [OK] Function exists: {function_id}")
            
            # Update function with correct runtime
            function = functions.update(
                function_id=function_id,
                name="Trading Post API",
                execute=["any"],  # Public access for API
                enabled=True,
                logging=True,
                runtime="python-3.9",
                entrypoint="main.py",
                timeout=30
            )
            print(f"  [OK] Updated function runtime to python-3.9")
        except AppwriteException:
            # Create function
            function = functions.create(
                function_id=function_id,
                name="Trading Post API",
                runtime="python-3.9",
                execute=["any"],
                enabled=True,
                logging=True,
                entrypoint="main.py",
                timeout=30
            )
            print(f"  [OK] Created function: {function_id}")
        
        # Prepare function code
        api_dir = Path("functions/api")
        
        if not api_dir.exists():
            print(f"  [ERROR] API directory not found: {api_dir}")
            return False
        
        # Create deployment package
        with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp:
            package_path = create_function_package(api_dir, tmp.name)
        
        # Deploy the code
        print("  [INFO] Uploading API code...")
        with open(package_path, 'rb') as f:
            deployment = functions.create_deployment(
                function_id=function_id,
                code=InputFile.from_bytes(f.read(), filename="code.tar.gz"),
                activate=True
            )
        
        print(f"  [OK] API deployed - ID: {deployment['$id']}")
        
        # Set environment variables
        env_vars = {
            "APPWRITE_FUNCTION_ENDPOINT": os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1"),
            "APPWRITE_FUNCTION_PROJECT_ID": os.getenv("APPWRITE_PROJECT_ID"),
            "APPWRITE_DATABASE_ID": "trading_post_main"
        }
        
        for key, value in env_vars.items():
            if value:  # Only set if value is not None/empty
                try:
                    functions.create_variable(
                        function_id=function_id,
                        key=key,
                        value=value
                    )
                    print(f"    [OK] Set variable: {key}")
                except Exception as e:
                    # Variable might already exist
                    print(f"    [INFO] Variable {key} might already exist: {e}")
        
        # Clean up
        os.unlink(package_path)
        
        return True
        
    except Exception as e:
        print(f"  [ERROR] API deployment failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_function_deployment(function_id, test_name):
    """Test that a function deployment is working"""
    print(f"\n  Testing {test_name}...")
    try:
        # Get function details to verify it exists
        function = functions.get(function_id)
        print(f"    [OK] Function exists and is accessible")
        print(f"    [OK] Runtime: {function.get('runtime')}")
        print(f"    [OK] Status: {function.get('status', 'unknown')}")
        
        # Get the function URL
        endpoint = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
        domain = endpoint.replace("/v1", "").replace("https://", "")
        print(f"    [URL] https://{domain}/v1/functions/{function_id}/executions")
        
        return True
        
    except Exception as e:
        print(f"    [WARN] Test failed: {e}")
        return False

def main():
    """Main deployment process"""
    
    # Check if we have the required environment variables
    if not os.getenv("APPWRITE_API_KEY"):
        print("❌ APPWRITE_API_KEY environment variable is required")
        sys.exit(1)
    
    if not os.getenv("APPWRITE_PROJECT_ID"):
        print("❌ APPWRITE_PROJECT_ID environment variable is required")
        sys.exit(1)
    
    success_ai = deploy_ai_matching_function()
    success_api = deploy_api_function()
    
    print("\n" + "=" * 60)
    print("DEPLOYMENT SUMMARY")
    print("=" * 60)
    
    if success_ai:
        print("✅ AI Matching Function (Python 3.9): DEPLOYED")
        test_function_deployment("ai-matching-service", "AI Matching Service")
    else:
        print("❌ AI Matching Function: FAILED")
    
    if success_api:
        print("✅ API Function (Python 3.9): DEPLOYED")
        test_function_deployment("trading-post-api", "Trading Post API")
    else:
        print("❌ API Function: FAILED")
    
    print("\n📍 Access Information:")
    print(f"Project ID: {os.getenv('APPWRITE_PROJECT_ID')}")
    print(f"Endpoint: {os.getenv('APPWRITE_ENDPOINT')}")
    print(f"Console: https://cloud.appwrite.io/console/project-{os.getenv('APPWRITE_PROJECT_ID')}")
    
    domain = os.getenv('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1').replace('https://', '').replace('/v1', '')
    print(f"\n🌐 Function URLs:")
    print(f"AI Matching: https://{domain}/v1/functions/ai-matching-service/executions")
    print(f"API: https://{domain}/v1/functions/trading-post-api/executions")
    
    print("\n📝 Next Steps:")
    if success_ai and success_api:
        print("1. ✅ Python functions are deployed with correct runtime (python-3.9)")
        print("2. Functions will automatically trigger on database events")
        print("3. Test API endpoints through the function URLs")
        print("4. Monitor function logs in Appwrite Console")
    else:
        print("1. Check the error messages above")
        print("2. Verify API key has Functions.write permissions")
        print("3. Check function code compatibility with Python 3.9")
        print("4. Try manual deployment via Appwrite Console")
    
    print("\n⚡ Functions may take 1-2 minutes to be fully available")
    print("🔧 Runtime Issue: Fixed python-3.10 -> python-3.9 compatibility")
    
    return success_ai and success_api

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)