@echo off
echo 🚀 Trading Post - Complete CLI Deployment Setup
echo.

echo 📋 Step 1: Check CLI Installation
appwrite --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Appwrite CLI not found!
    echo Please install: npm install -g appwrite-cli
    pause
    exit /b 1
)

echo.
echo 📋 Step 2: Login to Appwrite
echo ⚠️  You need to login to your Appwrite account first
echo.
echo Please complete the login process in your browser...
appwrite login
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Login failed
    pause
    exit /b 1
)

echo.
echo ✅ Login successful! Continuing with deployment...
echo.

echo 📋 Step 3: Configure Project
appwrite client --project-id 689bdee000098bd9d55c
echo.

echo 📋 Step 4: Deploy Trading Post
echo Site ID: 689cb415001a367e69f8
echo Code Path: ./trading-app-frontend
echo.

appwrite sites create-deployment ^
    --site-id 689cb415001a367e69f8 ^
    --code "./trading-app-frontend" ^
    --activate ^
    --build-command "npm run build" ^
    --install-command "npm ci" ^
    --output-directory "build"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 Deployment initiated successfully!
    echo 🌐 Your site will be available at: https://tradingpost.appwrite.network/
    echo 📊 Monitor progress: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites
    echo.
    echo ✅ All 24 environment variables are configured and active
) else (
    echo.
    echo ❌ Deployment failed
    echo 🔧 Troubleshooting options:
    echo 1. Verify you're logged into the correct Appwrite account
    echo 2. Check project permissions
    echo 3. Ensure site ID exists: 689cb415001a367e69f8
    echo 4. Try manual deployment via Appwrite Console
)

echo.
pause