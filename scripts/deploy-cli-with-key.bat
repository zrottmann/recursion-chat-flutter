@echo off
echo 🚀 Deploying Trading Post with Appwrite CLI using API Key...
echo.

echo ⚙️ Setting up Appwrite CLI configuration...
call appwrite client --endpoint %APPWRITE_ENDPOINT%
call appwrite client --project-id %APPWRITE_PROJECT_ID%

echo.
echo 🔑 Using API key from environment variable...
if "%APPWRITE_API_KEY%"=="" (
    echo ❌ Error: APPWRITE_API_KEY environment variable is not set
    echo    Please set the required environment variables before running this script
    echo    Required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
    pause
    exit /b 1
)

echo.
echo 📦 Building frontend...
cd trading-app-frontend
call npm install --legacy-peer-deps
call npm run build
cd ..

echo.
echo 🚀 Triggering deployment...
for /f %%i in ('git rev-parse HEAD') do set COMMIT_HASH=%%i
echo Using commit: %COMMIT_HASH%

rem Try to create deployment
call appwrite sites create-deployment --site-id 689cb415001a367e69f8 --code %COMMIT_HASH% --activate true

echo.
echo ✅ Deployment triggered!
echo 🌐 Check your site at: https://tradingpost.appwrite.network/
echo 📊 Monitor deployment in console: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites

pause