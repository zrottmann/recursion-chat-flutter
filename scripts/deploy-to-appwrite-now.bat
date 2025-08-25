@echo off
echo =====================================
echo DEPLOYING TRADING POST TO APPWRITE
echo =====================================
echo.

REM Remove the problematic nul file first
if exist nul del /f /q nul

REM Fix git index if needed
git rm --cached nul 2>nul

REM Trading Post configuration
set PROJECT_ID=689bdee000098bd9d55c
set SITE_ID=689cb415001a367e69f8

echo Cleaning up git repository...
git status --porcelain

echo.
echo Committing clean state...
git add -A
git commit -m "fix: Remove nul file and deploy to Appwrite" 2>nul

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo =====================================
echo DEPLOYMENT INITIATED
echo =====================================
echo.
echo GitHub: https://github.com/zrottmann/tradingpost.git
echo.
echo NOW COMPLETE DEPLOYMENT:
echo 1. Open: https://cloud.appwrite.io/console/project-%PROJECT_ID%/sites
echo 2. Click on "tradingpost" site
echo 3. Go to Settings - Git Configuration
echo 4. Connect GitHub repository
echo 5. Select branch: main
echo 6. Save to trigger deployment
echo.
echo Your app will be live at:
echo https://tradingpost.appwrite.network/
echo =====================================
pause