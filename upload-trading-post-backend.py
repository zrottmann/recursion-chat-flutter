#!/usr/bin/env python3
"""
Upload Trading Post Backend to AppWrite Functions
"""

import os
import zipfile
import tempfile
from appwrite.client import Client
from appwrite.services.functions import Functions

# Configuration - Use environment variables for security
ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
API_KEY = os.getenv("APPWRITE_API_KEY")
FUNCTION_ID = os.getenv("APPWRITE_FUNCTION_ID", "trading-post-backend")

# Validate required environment variables
if not PROJECT_ID or not API_KEY:
    print("❌ Error: Missing required environment variables")
    print("   Required: APPWRITE_PROJECT_ID, APPWRITE_API_KEY")
    print("   Optional: APPWRITE_ENDPOINT, APPWRITE_FUNCTION_ID")
    exit(1)

def create_deployment_zip():
    print("Creating Creating backend deployment package...")
    
    # Create temporary zip file
    temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
    
    with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add main application files
        files_to_include = [
            'app_sqlite.py',
            'appwrite_config_recursion.py', 
            'requirements.txt',
            'ai_matching.py',
            'auth_router.py',
            'payment_router.py',
            'sso_router.py',
            'zipcode_service.py'
        ]
        
        for file_path in files_to_include:
            if os.path.exists(file_path):
                zip_file.write(file_path, file_path)
                print(f"  Added: Added: {file_path}")
            else:
                print(f"  Skipped:  Skipped (not found): {file_path}")
        
        # Add main.py entry point
        main_py_content = '''
import sys
import os
sys.path.append('/opt/code')
from app_sqlite import app

def main(req, res):
    """AppWrite Function entry point"""
    if req.method == 'GET' and req.path == '/':
        return res.send('Trading Post Backend API - Powered by AppWrite Functions')
    
    # Handle API requests
    try:
        # Import here to avoid issues
        from app_sqlite import app
        # Process FastAPI app logic
        return res.send('API Response')
    except Exception as e:
        return res.send(f'Error: {str(e)}', 500)
'''
        zip_file.writestr('main.py', main_py_content)
        
        print(f"Package created: Deployment package created: {temp_zip.name}")
        return temp_zip.name

def upload_function():
    print("Uploading Uploading Trading Post backend to AppWrite...")
    
    client = Client()
    client.set_endpoint(ENDPOINT).set_project(PROJECT_ID).set_key(API_KEY)
    functions = Functions(client)
    
    zip_path = create_deployment_zip()
    
    try:
        # Create deployment
        deployment = functions.create_deployment(
            FUNCTION_ID,
            zip_path,
            activate=True
        )
        
        print(f"Added: Backend deployment created: {deployment['$id']}")
        print(f"Function URL: Function URL: {ENDPOINT.replace('/v1', '')}/v1/functions/{FUNCTION_ID}/executions")
        
    except Exception as e:
        print(f"Error: Upload failed: {e}")
    finally:
        os.unlink(zip_path)

if __name__ == "__main__":
    upload_function()
