#!/usr/bin/env python3
"""
Production startup script for Trading Post on DigitalOcean
"""
import os
import sys
import subprocess
from pathlib import Path


def build_frontend():
    """Build the React frontend if needed"""
    frontend_dir = Path("trading-app-frontend")
    build_dir = frontend_dir / "build"

    if not build_dir.exists():
        print("Building frontend...")
        if frontend_dir.exists():
            os.chdir(frontend_dir)
            subprocess.run(["npm", "install"], check=True)
            subprocess.run(["npm", "run", "build"], check=True)
            os.chdir("..")
            print("Frontend built successfully!")
    else:
        print("Frontend build already exists")


def start_server():
    """Start the FastAPI server"""
    port = os.getenv("PORT", "8080")
    host = "0.0.0.0"

    print(f"Starting Trading Post server on {host}:{port}")

    # Import and run uvicorn programmatically
    import uvicorn

    uvicorn.run("app_sqlite:app", host=host, port=int(port), log_level="info", access_log=True)


if __name__ == "__main__":
    try:
        # Build frontend if needed
        build_frontend()

        # Start the server
        start_server()
    except Exception as e:
        print(f"Error starting application: {e}")
        sys.exit(1)
