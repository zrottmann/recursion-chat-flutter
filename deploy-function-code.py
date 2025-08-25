#!/usr/bin/env python3
"""
Deploy function code to Appwrite
"""

import os
import sys
import zipfile
import tempfile
from pathlib import Path
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.functions import Functions
from appwrite.input_file import InputFile

# Load environment
load_dotenv('.env.appwrite')

# Initialize client
client = Client()
client.set_endpoint(os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1"))
client.set_project(os.getenv("APPWRITE_PROJECT_ID", "689bdee000098bd9d55c"))
client.set_key(os.getenv("APPWRITE_API_KEY"))

functions = Functions(client)

print("Deploying Function Code to Appwrite")
print("=" * 50)

def create_function_package(function_dir, output_path):
    """Create a zip package of the function code"""
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(function_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, function_dir)
                zipf.write(file_path, arcname)
    print(f"  [OK] Created package: {output_path}")
    return output_path

def deploy_function(function_id, function_dir):
    """Deploy a function to Appwrite"""
    print(f"\nDeploying {function_id}...")
    
    try:
        # Create a temporary zip file
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp:
            zip_path = tmp.name
        
        # Package the function
        create_function_package(function_dir, zip_path)
        
        # Create deployment
        print("  Uploading code...")
        with open(zip_path, 'rb') as f:
            deployment = functions.create_deployment(
                function_id=function_id,
                code=InputFile.from_path(zip_path),
                activate=True
            )
        
        print(f"  [OK] Deployment created: {deployment.get('$id')}")
        print(f"  [OK] Status: {deployment.get('status')}")
        
        # Clean up
        os.unlink(zip_path)
        
        return True
        
    except Exception as e:
        print(f"  [ERROR] Deployment failed: {e}")
        return False

# Deploy backend function
backend_dir = Path("functions/trading-post-backend")
if backend_dir.exists():
    deploy_function("trading-post-backend", backend_dir)
else:
    print(f"[WARN] Backend directory not found: {backend_dir}")

# Deploy frontend function
frontend_dir = Path("functions/trading-post-frontend")
if frontend_dir.exists():
    deploy_function("trading-post-frontend", frontend_dir)
else:
    print(f"[WARN] Frontend directory not found: {frontend_dir}")

print("\n" + "=" * 50)
print("Deployment Complete!")
print("\nAccess your application:")
print("- Frontend: Create execution at https://cloud.appwrite.io/v1/functions/trading-post-frontend/executions")
print("- Backend API: https://cloud.appwrite.io/v1/functions/trading-post-backend/executions")
print("\nNote: Deployments may take 1-2 minutes to activate")