#!/bin/bash

# Deployment script for Appwrite serverless functions
# Deploy to console project on super.appwrite.network

echo "🚀 Deploying Appwrite Functions to Console Project"
echo "================================================"

# Configuration
APPWRITE_ENDPOINT="https://nyc.cloud.appwrite.io/v1"
APPWRITE_PROJECT_ID="68a4e3da0022f3e129d0"
APPWRITE_API_KEY="${APPWRITE_API_KEY}"

# Check if Appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo "❌ Appwrite CLI not found. Installing..."
    npm install -g appwrite-cli
fi

# Login to Appwrite (if not already logged in)
echo "📝 Logging into Appwrite..."
appwrite login --endpoint $APPWRITE_ENDPOINT

# Deploy SSO Function
echo "🔐 Deploying SSO Function..."
cd appwrite-functions/sso-function

# Create function if it doesn't exist
appwrite functions create \
    --functionId "sso-function" \
    --name "Centralized SSO" \
    --runtime "node-18.0" \
    --execute "any" \
    --events "" \
    --schedule "" \
    --timeout 30 \
    --enabled true \
    --logging true \
    --entrypoint "src/index.js"

# Set environment variables
appwrite functions createVariable \
    --functionId "sso-function" \
    --key "APPWRITE_ENDPOINT" \
    --value "$APPWRITE_ENDPOINT"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "APPWRITE_PROJECT_ID" \
    --value "$APPWRITE_PROJECT_ID"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "APPWRITE_API_KEY" \
    --value "$APPWRITE_API_KEY"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "JWT_SECRET" \
    --value "$(openssl rand -base64 32)"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "GOOGLE_CLIENT_ID" \
    --value "${GOOGLE_CLIENT_ID}"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "GOOGLE_CLIENT_SECRET" \
    --value "${GOOGLE_CLIENT_SECRET}"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "GITHUB_CLIENT_ID" \
    --value "${GITHUB_CLIENT_ID}"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "GITHUB_CLIENT_SECRET" \
    --value "${GITHUB_CLIENT_SECRET}"

appwrite functions createVariable \
    --functionId "sso-function" \
    --key "APP_URL" \
    --value "https://super.appwrite.network"

# Deploy the function code
appwrite deploy function \
    --functionId "sso-function" \
    --activate true

echo "✅ SSO Function deployed successfully!"

# Deploy Chatroom Function
echo "💬 Deploying Chatroom Function..."
cd ../chatroom-function

# Create function if it doesn't exist
appwrite functions create \
    --functionId "chatroom-function" \
    --name "Chatroom with Grok" \
    --runtime "node-18.0" \
    --execute "any" \
    --events "" \
    --schedule "" \
    --timeout 60 \
    --enabled true \
    --logging true \
    --entrypoint "src/index.js"

# Set environment variables
appwrite functions createVariable \
    --functionId "chatroom-function" \
    --key "APPWRITE_ENDPOINT" \
    --value "$APPWRITE_ENDPOINT"

appwrite functions createVariable \
    --functionId "chatroom-function" \
    --key "APPWRITE_PROJECT_ID" \
    --value "$APPWRITE_PROJECT_ID"

appwrite functions createVariable \
    --functionId "chatroom-function" \
    --key "APPWRITE_API_KEY" \
    --value "$APPWRITE_API_KEY"

appwrite functions createVariable \
    --functionId "chatroom-function" \
    --key "DB_ID" \
    --value "main_db"

appwrite functions createVariable \
    --functionId "chatroom-function" \
    --key "GROK_API_ENDPOINT" \
    --value "https://api.x.ai/v1/chat/completions"

appwrite functions createVariable \
    --functionId "chatroom-function" \
    --key "GROK_API_KEY" \
    --value "${GROK_API_KEY}"

appwrite functions createVariable \
    --functionId "chatroom-function" \
    --key "GROK_MODEL" \
    --value "grok-beta"

# Deploy the function code
appwrite deploy function \
    --functionId "chatroom-function" \
    --activate true

echo "✅ Chatroom Function deployed successfully!"

# Create database collections if needed
echo "📊 Setting up database collections..."

# Create users collection
appwrite databases createCollection \
    --databaseId "main_db" \
    --collectionId "users" \
    --name "Users" \
    --permissions "read(\"any\")" "write(\"users\")"

# Create chatrooms collection
appwrite databases createCollection \
    --databaseId "main_db" \
    --collectionId "chatrooms" \
    --name "Chatrooms" \
    --permissions "read(\"any\")" "write(\"users\")"

# Create messages collection
appwrite databases createCollection \
    --databaseId "main_db" \
    --collectionId "messages" \
    --name "Messages" \
    --permissions "read(\"any\")" "write(\"users\")"

echo "✅ Database collections created!"

echo ""
echo "🎉 Deployment Complete!"
echo "========================"
echo "SSO Function ID: sso-function"
echo "Chatroom Function ID: chatroom-function"
echo "Endpoint: $APPWRITE_ENDPOINT"
echo "Project: $APPWRITE_PROJECT_ID"
echo ""
echo "📱 Functions are now available for all Flutter apps!"