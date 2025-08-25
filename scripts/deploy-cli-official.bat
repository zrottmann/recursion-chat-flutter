@echo off
echo 🚀 Trading Post - Official CLI Deployment
echo Using Appwrite CLI deployment command from console
echo.

echo ⚙️ Setting up project configuration...
appwrite client --projectId="689bdee000098bd9d55c"

echo.
echo 📦 Building and deploying Trading Post...
echo Site ID: 689cb415001a367e69f8
echo.

appwrite sites createDeployment ^
    --siteId=689cb415001a367e69f8 ^
    --code="./trading-app-frontend" ^
    --activate ^
    --build-command="npm run build" ^
    --install-command="npm ci" ^
    --output-directory="build"

echo.
echo ✅ Deployment command executed!
echo 🌐 Your site will be available at: https://tradingpost.appwrite.network/
echo 📊 Monitor deployment status in Appwrite Console
echo.
pause