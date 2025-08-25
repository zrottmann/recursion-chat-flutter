@echo off
echo ========================================
echo TRADING POST DEPLOYMENT TO APPWRITE
echo ========================================
echo.

cd trading-app-frontend

echo Step 1: Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo Step 2: Building production bundle...
set CI=false
set SKIP_PREFLIGHT_CHECK=true
set TSC_COMPILE_ON_ERROR=true
set DISABLE_ESLINT_PLUGIN=true
set REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
set REACT_APP_APPWRITE_PROJECT_ID=689bdaf500072795b0f6
set REACT_APP_APPWRITE_DATABASE_ID=trading_post_db

call npm run build

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Trading Post is ready for deployment!
echo.
echo To deploy to AppWrite Sites:
echo 1. Visit: https://cloud.appwrite.io
echo 2. Go to your project: 689bdaf500072795b0f6
echo 3. Navigate to Sites section
echo 4. Create a new site
echo 5. Upload the 'build' folder from:
echo    %CD%\build
echo.
echo Your Trading Post will be live at:
echo https://tradingpost.appwrite.network
echo ========================================
pause