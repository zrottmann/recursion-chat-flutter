@echo off
echo 🚀 Installing Easy Appwrite SSO...
echo.

:: Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Run the installer
echo 📦 Running installer...
node install-easy-appwrite-sso.js

echo.
echo ✅ Installation complete!
echo.
echo 📚 Next steps:
echo    1. Update your .env file with Appwrite project ID
echo    2. Configure OAuth providers in Appwrite Console
echo    3. Check examples/ directory for usage examples
echo.
pause