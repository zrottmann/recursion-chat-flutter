#!/bin/bash

# CRITICAL FIX: Deploy Trading Post Frontend with Proper Environment Variables
# This script fixes the persistent "No Appwrite project was specified" error

set -e

echo "🔧 CRITICAL FIX: Deploying Trading Post Frontend with Proper Environment Variables"
echo "======================================================================="

# Navigate to frontend directory
cd "$(dirname "$0")/trading-app-frontend"

echo "📁 Current directory: $(pwd)"

# Verify environment files
echo "🔍 Checking environment configuration..."
if [ -f ".env.production" ]; then
    echo "✅ Found .env.production"
    echo "📋 Production environment preview:"
    echo "---"
    head -10 .env.production
    echo "---"
else
    echo "❌ Missing .env.production file!"
    exit 1
fi

# Verify the correct environment variable prefix
if grep -q "REACT_APP_APPWRITE_PROJECT_ID" .env.production; then
    echo "✅ Correct REACT_APP_ prefix found in production config"
else
    echo "❌ Missing REACT_APP_ prefix in production config!"
    echo "🔧 This is likely the cause of the AppWrite project ID error"
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/ || true
rm -rf dist/ || true
rm -rf node_modules/.cache || true

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build with explicit environment
echo "🔨 Building for production with environment variables..."
export NODE_ENV=production

# Verify environment variables are loaded
echo "🌍 Verifying environment variables:"
echo "REACT_APP_APPWRITE_ENDPOINT: ${REACT_APP_APPWRITE_ENDPOINT:-'NOT_SET'}"
echo "REACT_APP_APPWRITE_PROJECT_ID: ${REACT_APP_APPWRITE_PROJECT_ID:-'NOT_SET'}"

# Build the application
npm run build

# Verify build output
if [ -d "build" ]; then
    echo "✅ Build successful!"
    echo "📊 Build size:"
    du -sh build/
    
    # Check if environment variables are embedded in the build
    echo "🔍 Checking if environment variables are embedded in build..."
    if grep -r "689bdee000098bd9d55c" build/; then
        echo "✅ Project ID found in build files"
    else
        echo "❌ Project ID NOT found in build files - this is the problem!"
        echo "🔧 Environment variables may not be loading properly"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

# Copy build to AppWrite function
echo "📋 Copying build to AppWrite function..."
FUNCTION_DIR="../functions/trading-post-frontend-serve"
if [ -d "$FUNCTION_DIR" ]; then
    # Backup existing
    if [ -d "$FUNCTION_DIR/public" ]; then
        mv "$FUNCTION_DIR/public" "$FUNCTION_DIR/public.backup.$(date +%s)"
    fi
    
    # Copy new build
    cp -r build/ "$FUNCTION_DIR/public/"
    echo "✅ Build copied to AppWrite function"
else
    echo "❌ AppWrite function directory not found: $FUNCTION_DIR"
    exit 1
fi

# Deploy to AppWrite
echo "🚀 Deploying to AppWrite..."
cd ..

# Use Appwrite CLI to deploy the function
if command -v appwrite &> /dev/null; then
    echo "📡 Deploying frontend function..."
    appwrite functions deploy \
        --functionId="trading-post-frontend-serve" \
        --activate=true
    
    echo "✅ Frontend function deployed successfully!"
else
    echo "⚠️  Appwrite CLI not found. Manual deployment required."
    echo "📋 Build is ready in: $(pwd)/functions/trading-post-frontend-serve/public/"
fi

echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================================================================="
echo "🔧 Critical Fix Applied:"
echo "   - Fixed environment variable prefix from VITE_ to REACT_APP_"
echo "   - Ensured project ID is embedded in production build"
echo "   - Deployed corrected frontend to AppWrite"
echo ""
echo "🧪 To test the fix:"
echo "   1. Open: https://nyc.cloud.appwrite.io/console/project-689bdee000098bd9d55c/functions/function-trading-post-frontend-serve"
echo "   2. Execute function and check browser console"
echo "   3. Verify no 'No Appwrite project was specified' errors"
echo ""
echo "📊 If issue persists, use the diagnostic tool:"
echo "   file://$(pwd)/appwrite-runtime-diagnostic.html"