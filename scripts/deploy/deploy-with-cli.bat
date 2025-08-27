@echo off
echo 🚀 Deploying with Appwrite CLI...

REM Install Appwrite CLI if not present
where appwrite >nul 2>nul
if errorlevel 1 (
    echo Installing Appwrite CLI...
    npm install -g appwrite-cli
)

REM Login (will prompt for API key)
echo Please enter your Appwrite API key when prompted:
appwrite login

REM Deploy to the site
echo Deploying claude-site.tar.gz...
appwrite functions deploy ^
    --functionId claude-code-ui ^
    --code claude-site.tar.gz ^
    --activate

echo ✅ Deployment complete!