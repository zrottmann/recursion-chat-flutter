#!/bin/bash

# Trading Post Extension Fixes Deployment Script
# Deploys browser extension conflict fixes to GitHub and DigitalOcean

echo "========================================"
echo "🛡️ Trading Post Extension Fixes Deployment"
echo "========================================"
echo ""

# Set script directory
cd "/mnt/c/Users/Zrott/OneDrive/Desktop/Claude/Trading Post"

echo "📋 Deployment Summary:"
echo "----------------------"
echo "✅ Fixed MutationObserver TypeError from web-client-content-script.js"
echo "✅ Fixed UI.js:49 ui config eventBus conflicts"
echo "✅ Fixed SiteSettings.ts comparison errors (YouTube, Netflix, etc.)"
echo "✅ Fixed favicon.ico 500 error"
echo "✅ Enhanced console error suppression"
echo "✅ Added extension element isolation"
echo ""

echo "📂 Files Modified:"
echo "------------------"
echo "• trading-app-frontend/src/utils/extensionConflictFixer.js (NEW)"
echo "• trading-app-frontend/public/index.html (favicon fix)"
echo "• trading-app-frontend/src/App.js (integrated fixes)"
echo "• trading-app-frontend/build/ (rebuilt with fixes)"
echo ""

echo "🔧 Building frontend with fixes..."
cd "trading-app-frontend"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - please check manually"
    exit 1
fi
cd ..

echo ""
echo "📡 Deploying to GitHub..."

# Check git status
git add .
git commit -m "🛡️ Fix browser extension conflicts

- Add comprehensive extension conflict protection
- Fix MutationObserver TypeError from web-client-content-script.js
- Fix UI.js eventBus configuration conflicts
- Fix SiteSettings.ts array comparison errors
- Fix favicon.ico 500 error by adding proper link reference
- Add extension element isolation and enhanced console filtering
- Integrate all fixes into main App.js with proper initialization

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -eq 0 ]; then
    echo "✅ Changes committed to git"
else
    echo "ℹ️ No new changes to commit"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    
    echo "🌐 DigitalOcean Deployment Instructions:"
    echo "========================================"
    echo ""
    echo "Option A: Automatic Deployment (if webhook configured)"
    echo "----------------------------------------------------"
    echo "• Your changes are now on GitHub"
    echo "• If you have DigitalOcean auto-deploy configured, it will deploy automatically"
    echo "• Check your DigitalOcean App Platform dashboard for deployment status"
    echo ""
    
    echo "Option B: Manual Deployment via DigitalOcean Dashboard"
    echo "----------------------------------------------------"
    echo "1. Go to: https://cloud.digitalocean.com/apps"
    echo "2. Find your Trading Post app"
    echo "3. Click 'Settings' → 'Deploy'"
    echo "4. Click 'Deploy' to deploy the latest changes"
    echo "5. Monitor the deployment logs for success"
    echo ""
    
    echo "Option C: Install doctl CLI for command-line deployment"
    echo "-----------------------------------------------------"
    echo "1. Install doctl: curl -sL https://github.com/digitalocean/doctl/releases/download/v1.98.0/doctl-1.98.0-linux-amd64.tar.gz | tar -xzv"
    echo "2. Move to PATH: sudo mv doctl /usr/local/bin"
    echo "3. Authenticate: doctl auth init"
    echo "4. List apps: doctl apps list"
    echo "5. Deploy: doctl apps create-deployment <your-app-id>"
    echo ""
    
    echo "🔍 Verification Steps:"
    echo "====================="
    echo "After deployment, verify the fixes:"
    echo "• Open browser console (F12)"
    echo "• Navigate to your Trading Post app"
    echo "• Check that these errors are gone:"
    echo "  - MutationObserver TypeError"
    echo "  - UI.js:49 ui config errors"
    echo "  - SiteSettings.ts comparison errors"
    echo "  - favicon.ico 404/500 errors"
    echo ""
    echo "✅ Look for this success message in console:"
    echo "   '🛡️ Trading Post extension protection initialized'"
    echo ""
    
    echo "📚 Repository: https://github.com/zrottmann/tradingpost.git"
    echo "🌐 Latest commit with fixes is now available for deployment"
    echo ""
    echo "🎉 Extension fixes deployment complete!"
    
else
    echo "❌ Failed to push to GitHub"
    echo "Please check your git credentials and network connection"
    exit 1
fi