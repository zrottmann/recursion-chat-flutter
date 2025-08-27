@echo off
REM Deploy Flutter Trading Post to Appwrite Sites

echo 🚀 Deploying Flutter Trading Post Web App...
echo.

cd "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\trading-post-flutter"

REM Check git status
echo 📋 Checking git status...
git status

REM Add and commit changes
echo.
echo 📝 Committing Flutter web configuration...
git add .
git commit -m "feat: Add Flutter web configuration and deployment workflow"

REM Push to trigger GitHub Actions
echo.
echo 🚀 Pushing to trigger Flutter web build and deployment...
git push

echo.
echo ✅ Flutter deployment initiated!
echo 🔗 Monitor at: https://github.com/zrottmann/tradingpost/actions
echo 🌐 Flutter UI will be at: https://tradingpost.appwrite.network