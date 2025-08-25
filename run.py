#!/usr/bin/env python3
"""
Production runner for Trading Post on DigitalOcean
Ensures the app runs on the correct port
"""
import os
import uvicorn

# Get port from environment variable (DigitalOcean sets this)
port = int(os.environ.get("PORT", 8080))

print(f"Starting Trading Post on port {port}...")

# Run the FastAPI app
if __name__ == "__main__":
    uvicorn.run("app_sqlite:app", host="0.0.0.0", port=port, log_level="info", access_log=True)
