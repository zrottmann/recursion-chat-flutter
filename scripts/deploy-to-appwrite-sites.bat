@echo off
echo ======================================
echo Deploying Trading Post to Appwrite Sites
echo ======================================

REM Trading Post Appwrite Configuration
set PROJECT_ID=689bdee000098bd9d55c
set SITE_ID=689cb415001a367e69f8

echo.
echo Project ID: %PROJECT_ID%
echo Site ID: %SITE_ID%
echo.

REM First, log in to Appwrite if needed
echo Checking Appwrite authentication...
appwrite client --projectId="%PROJECT_ID%"

REM Create and activate deployment
echo.
echo Creating site deployment...
appwrite sites createDeployment ^
    --siteId=%SITE_ID% ^
    --code="./trading-app-frontend" ^
    --activate ^
    --build-command="npm run build" ^
    --install-command="npm ci" ^
    --output-directory="build"

echo.
echo ======================================
echo Deployment initiated!
echo.
echo Your Trading Post app will be available at:
echo https://689cb415001a367e69f8.appwrite.global
echo.
echo Deployment usually takes 3-5 minutes.
echo ======================================