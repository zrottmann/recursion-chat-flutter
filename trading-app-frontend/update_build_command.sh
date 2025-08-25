#!/bin/bash

# Install Python dependencies
pip install --no-cache-dir --upgrade pip
pip install --no-cache-dir -r requirements.txt

# Build React frontend with CORRECTED Appwrite SSO configuration
if [ -d "trading-app-frontend" ]; then
  cd trading-app-frontend
  
  # Set CORRECTED Appwrite environment variables for build
  export REACT_APP_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
  export REACT_APP_APPWRITE_PROJECT_ID="689bdee000098bd9d55c"
  export REACT_APP_APPWRITE_PROJECT_NAME="Trading Post"
  export REACT_APP_APPWRITE_API_KEY="${APPWRITE_API_KEY}"
  
  # Enable SSO features
  export REACT_APP_ENABLE_SSO="true"
  export REACT_APP_ENABLE_OAUTH="true" 
  export REACT_APP_ENABLE_EMAIL_AUTH="true"
  export REACT_APP_OAUTH_PROVIDERS="google,github,facebook"
  export REACT_APP_OAUTH_CALLBACK_URL="https://tradingpost-2tq2f.ondigitalocean.app/auth/callback"
  export REACT_APP_OAUTH_ERROR_URL="https://tradingpost-2tq2f.ondigitalocean.app/auth/error"
  export REACT_APP_API_URL="https://tradingpost-2tq2f.ondigitalocean.app"
  export REACT_APP_ENVIRONMENT="production"
  
  # Database configuration
  export REACT_APP_APPWRITE_DATABASE_ID="trading_post_db"
  export REACT_APP_APPWRITE_USERS_COLLECTION_ID="users"
  export REACT_APP_APPWRITE_ITEMS_COLLECTION_ID="items"
  export REACT_APP_APPWRITE_WANTS_COLLECTION_ID="wants"
  export REACT_APP_APPWRITE_TRADES_COLLECTION_ID="trades"
  export REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID="messages"
  export REACT_APP_APPWRITE_REVIEWS_COLLECTION_ID="reviews"
  export REACT_APP_APPWRITE_NOTIFICATIONS_COLLECTION_ID="notifications"
  
  # Storage configuration
  export REACT_APP_APPWRITE_ITEM_IMAGES_BUCKET_ID="item_images"
  export REACT_APP_APPWRITE_PROFILE_IMAGES_BUCKET_ID="profile_images"
  export REACT_APP_APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID="chat_attachments"
  
  # Force clean build (no cache)
  rm -rf node_modules package-lock.json build/
  
  npm ci --production=false
  npm run build
  cd ..
  
  # Create static directory
  mkdir -p static uploads logs uploads/ai_photos uploads/quarantine
  cp -r trading-app-frontend/build/* static/ 2>/dev/null || true
  echo "Frontend built successfully with CORRECTED Appwrite SSO configuration"
  echo "Appwrite Endpoint: https://cloud.appwrite.io/v1"
  echo "Appwrite Project ID: 689bdee000098bd9d55c"
  ls -la static/
else
  echo "Frontend directory not found"
  mkdir -p static uploads logs uploads/ai_photos uploads/quarantine
fi

# Set up directories with proper permissions
chmod 755 uploads uploads/ai_photos uploads/quarantine 2>/dev/null || true

# Validate Python environment with Appwrite
python3 -c "import fastapi, uvicorn, sqlalchemy, appwrite; print('All dependencies including Appwrite installed successfully')"
python3 -c "from appwrite_sso_auth import appwrite_sso_auth; print('Appwrite SSO Auth initialized successfully')"