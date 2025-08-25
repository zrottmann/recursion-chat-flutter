#!/usr/bin/env python3
"""
Fix Appwrite function permissions for public access
"""

import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.functions import Functions
from appwrite.exception import AppwriteException

# Load environment
load_dotenv('.env.appwrite')

# Initialize client
client = Client()
client.set_endpoint(os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1"))
client.set_project(os.getenv("APPWRITE_PROJECT_ID", "689bdee000098bd9d55c"))
client.set_key(os.getenv("APPWRITE_API_KEY"))

functions = Functions(client)

print("Fixing Appwrite Function Permissions")
print("=" * 50)

# Fix permissions for both functions
function_ids = ["trading-post-frontend", "trading-post-backend"]

for function_id in function_ids:
    try:
        print(f"\nUpdating {function_id}...")
        
        # Update function to allow public execution
        function = functions.update(
            function_id=function_id,
            name=function_id.replace("-", " ").title(),
            execute=["any"],  # Allow anyone to execute
            enabled=True,
            logging=True
        )
        
        print(f"  [OK] Updated permissions - Execute: {function.get('execute', [])}")
        
        # Create a public execution to test
        print(f"  Testing execution...")
        try:
            # For frontend, we need to trigger it differently
            if function_id == "trading-post-frontend":
                # The frontend should be accessible via a direct URL
                domain = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1").replace("/v1", "")
                
                print(f"\n  Access the frontend at:")
                print(f"  {domain}/v1/functions/{function_id}/executions")
                print(f"  OR")
                print(f"  Create a custom domain in Appwrite Console")
            else:
                execution = functions.create_execution(
                    function_id=function_id,
                    path="/",
                    method="GET"
                )
                print(f"  [OK] Test execution created: {execution.get('$id')}")
                
        except Exception as e:
            print(f"  [WARN] Execution test failed: {e}")
            
    except Exception as e:
        print(f"  [ERROR] Failed to update {function_id}: {e}")

print("\n" + "=" * 50)
print("Permission Fix Complete!")
print("\nIMPORTANT: Functions are now publicly accessible")
print("To access the frontend, use one of these methods:")
print("\n1. Direct Function URL (requires creating execution):")
print("   POST https://cloud.appwrite.io/v1/functions/trading-post-frontend/executions")
print("\n2. Set up a custom domain in Appwrite Console:")
print("   - Go to Functions > trading-post-frontend > Settings")
print("   - Add a custom domain")
print("\n3. Create a proxy or redirect from your own domain")