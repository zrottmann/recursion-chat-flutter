#!/usr/bin/env python3
"""
Deploy Trading Post Functions using Developer Key
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
from appwrite.id import ID

# Load environment
load_dotenv('.env.appwrite')

# Use the provided developer key
DEV_KEY = "27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec"

print("Deploying Trading Post Functions with Developer Key")
print("=" * 60)

# Initialize client with developer key
client = Client()
client.set_endpoint(os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1"))
client.set_project(os.getenv("APPWRITE_PROJECT_ID", "689bdee000098bd9d55c"))
client.set_key(DEV_KEY)

functions = Functions(client)

def create_function_tar_gz(source_dir, output_path):
    """Create a tar.gz package for Appwrite function deployment"""
    import tarfile
    
    with tarfile.open(output_path, 'w:gz') as tar:
        for item in Path(source_dir).rglob('*'):
            if item.is_file() and not item.name.startswith('.'):
                arcname = str(item.relative_to(source_dir))
                tar.add(item, arcname=arcname)
    
    print(f"  [OK] Created package: {output_path}")
    return output_path

def deploy_backend_function():
    """Deploy the backend API function"""
    print("\n1. Deploying Backend Function...")
    
    try:
        function_id = "trading-post-api"
        
        # Create or update function
        try:
            function = functions.get(function_id)
            print(f"  [OK] Function exists: {function_id}")
            
            # Update function
            function = functions.update(
                function_id=function_id,
                name="Trading Post API",
                execute=["any"],  # Public access
                enabled=True,
                logging=True,
                runtime="node-18.0"
            )
        except:
            # Create function
            function = functions.create(
                function_id=function_id,
                name="Trading Post API",
                runtime="node-18.0",
                execute=["any"],
                enabled=True,
                logging=True,
                entrypoint="index.js"
            )
            print(f"  [OK] Created function: {function_id}")
        
        # Prepare function code
        backend_dir = Path("functions/trading-post-backend")
        
        # Create deployment package
        with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp:
            package_path = create_function_tar_gz(backend_dir, tmp.name)
        
        # Deploy the code
        print("  [INFO] Uploading backend code...")
        with open(package_path, 'rb') as f:
            deployment = functions.create_deployment(
                function_id=function_id,
                code=InputFile.from_bytes(f.read(), filename="code.tar.gz"),
                activate=True
            )
        
        print(f"  [OK] Backend deployed - ID: {deployment['$id']}")
        
        # Set environment variables
        env_vars = {
            "DATABASE_ID": "trading_post_db",
            "ITEMS_COLLECTION_ID": "items",
            "USERS_COLLECTION_ID": "users",
            "TRADES_COLLECTION_ID": "trades"
        }
        
        for key, value in env_vars.items():
            try:
                functions.create_variable(
                    function_id=function_id,
                    key=key,
                    value=value
                )
                print(f"    [OK] Set variable: {key}")
            except:
                pass  # Variable might already exist
        
        # Clean up
        os.unlink(package_path)
        
        return True
        
    except Exception as e:
        print(f"  [ERROR] Backend deployment failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def deploy_frontend_function():
    """Deploy the frontend hosting function"""
    print("\n2. Deploying Frontend Function...")
    
    try:
        function_id = "trading-post-frontend"
        
        # Create or update function
        try:
            function = functions.get(function_id)
            print(f"  [OK] Function exists: {function_id}")
            
            # Update function
            function = functions.update(
                function_id=function_id,
                name="Trading Post Frontend",
                execute=["any"],  # Public access
                enabled=True,
                logging=True,
                runtime="node-18.0"
            )
        except:
            # Create function
            function = functions.create(
                function_id=function_id,
                name="Trading Post Frontend",
                runtime="node-18.0",
                execute=["any"],
                enabled=True,
                logging=True,
                entrypoint="index.js"
            )
            print(f"  [OK] Created function: {function_id}")
        
        # Use the prepared frontend function directory
        frontend_dir = Path("functions/trading-post-frontend-serve")
        
        if not frontend_dir.exists():
            print(f"  [ERROR] Frontend directory not found: {frontend_dir}")
            return False
        
        # Create deployment package
        with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp:
            package_path = create_function_tar_gz(frontend_dir, tmp.name)
        
        # Deploy the code
        print("  [INFO] Uploading frontend code...")
        with open(package_path, 'rb') as f:
            deployment = functions.create_deployment(
                function_id=function_id,
                code=InputFile.from_bytes(f.read(), filename="code.tar.gz"),
                activate=True
            )
        
        print(f"  [OK] Frontend deployed - ID: {deployment['$id']}")
        
        # Clean up
        os.unlink(package_path)
        
        return True
        
    except Exception as e:
        print(f"  [ERROR] Frontend deployment failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_execution_test(function_id, test_name):
    """Create a test execution to verify function works"""
    print(f"\n  Testing {test_name}...")
    try:
        execution = functions.create_execution(
            function_id=function_id,
            path="/",
            method="GET"
        )
        
        print(f"    [OK] Execution created: {execution['$id']}")
        print(f"    [OK] Status: {execution.get('status', 'processing')}")
        
        # Get the function URL
        endpoint = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
        domain = endpoint.replace("/v1", "").replace("https://", "")
        print(f"    [URL] https://{domain}/v1/functions/{function_id}")
        
        return True
        
    except Exception as e:
        print(f"    [WARN] Test execution failed: {e}")
        return False

def main():
    """Main deployment process"""
    
    success_backend = deploy_backend_function()
    success_frontend = deploy_frontend_function()
    
    print("\n" + "=" * 60)
    print("DEPLOYMENT SUMMARY")
    print("=" * 60)
    
    if success_backend:
        print("✅ Backend Function: DEPLOYED")
        create_execution_test("trading-post-api", "Backend API")
    else:
        print("❌ Backend Function: FAILED")
    
    if success_frontend:
        print("✅ Frontend Function: DEPLOYED")
        create_execution_test("trading-post-frontend", "Frontend Hosting")
    else:
        print("❌ Frontend Function: FAILED")
    
    print("\n📍 Access Information:")
    print(f"Project ID: {os.getenv('APPWRITE_PROJECT_ID')}")
    print(f"Endpoint: {os.getenv('APPWRITE_ENDPOINT')}")
    print(f"Console: https://cloud.appwrite.io/console/project-{os.getenv('APPWRITE_PROJECT_ID')}")
    
    domain = "nyc.cloud.appwrite.io"
    print(f"\n🌐 Function URLs:")
    print(f"Backend API: https://{domain}/v1/functions/trading-post-api")
    print(f"Frontend: https://{domain}/v1/functions/trading-post-frontend")
    
    print("\n📝 Next Steps:")
    if success_backend and success_frontend:
        print("1. ✅ Functions are deployed and ready")
        print("2. Configure OAuth providers in Appwrite Console")
        print("3. Test the application endpoints")
        print("4. Set up custom domain (optional)")
    else:
        print("1. Check the error messages above")
        print("2. Verify API key permissions")
        print("3. Try manual deployment via Appwrite Console")
    
    print("\n⚡ Functions may take 1-2 minutes to be fully available")

if __name__ == "__main__":
    main()