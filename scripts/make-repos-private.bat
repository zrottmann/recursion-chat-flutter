@echo off
echo 🔒 GitHub Repository Privacy Manager
echo ===================================
echo.

REM Check if GitHub CLI is installed
where gh >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ GitHub CLI not found!
    echo.
    echo Please install GitHub CLI from: https://cli.github.com/
    echo Then run: gh auth login
    echo.
    pause
    exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not authenticated with GitHub!
    echo.
    echo Please run: gh auth login
    echo.
    pause
    exit /b 1
)

echo ✅ GitHub CLI is installed and authenticated
echo.

echo Would you like to:
echo 1. List current repository status
echo 2. Make all public repositories private
echo 3. Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 📊 Listing repository status...
    node make-repos-private.js --list
) else if "%choice%"=="2" (
    echo.
    echo ⚠️  WARNING: This will make ALL your public repositories private!
    echo This action cannot be easily undone.
    echo.
    set /p confirm="Are you sure you want to continue? (y/N): "
    
    if /I "%confirm%"=="y" (
        echo.
        echo 🔒 Making all repositories private...
        node make-repos-private.js
    ) else (
        echo.
        echo ❌ Operation cancelled.
    )
) else if "%choice%"=="3" (
    echo.
    echo 👋 Goodbye!
) else (
    echo.
    echo ❌ Invalid choice. Please run the script again.
)

echo.
pause