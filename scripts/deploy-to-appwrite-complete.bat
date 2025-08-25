@echo off
echo =========================================
echo  Trading Post - Complete Appwrite Deploy
echo =========================================
echo.

echo Step 1: Installing Appwrite CLI if needed...
where appwrite >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Appwrite CLI...
    npm install -g appwrite-cli
) else (
    echo Appwrite CLI already installed.
)

echo.
echo Step 2: Deploying to Appwrite...
echo.

cd /d "%~dp0"

echo Logging into Appwrite...
appwrite login

echo.
echo Setting project context...
appwrite init project --project-id 689bdaf500072795b0f6

echo.
echo Deploying collections...
appwrite deploy collection

echo.
echo Deploying storage buckets...
appwrite deploy bucket

echo.
echo Deploying functions...
appwrite deploy function

echo.
echo Building and deploying frontend...
cd trading-app-frontend
npm install
npm run build:prod

echo.
echo Deploying static site...
cd ..
appwrite deploy static

echo.
echo =========================================
echo  Deployment Complete!
echo =========================================
echo.
echo Your Trading Post is now live at:
echo https://tradingpost.appwrite.network
echo.
echo Backend API available at:
echo https://cloud.appwrite.io/v1/functions
echo.

pause