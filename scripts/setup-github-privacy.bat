@echo off
echo 🔒 GitHub Repository Privacy Setup
echo ==================================
echo.
echo This script will help you make all your GitHub repositories private.
echo.
echo Step 1: Create a GitHub Personal Access Token
echo ----------------------------------------------
echo 1. Go to: https://github.com/settings/tokens
echo 2. Click "Generate new token" -^> "Generate new token (classic)"
echo 3. Give it a name like "Repository Privacy Manager"
echo 4. Select expiration: 30 days (recommended)
echo 5. Check the "repo" box (Full control of private repositories)
echo 6. Click "Generate token"
echo 7. Copy the token (it won't be shown again!)
echo.
echo Step 2: Set your token as environment variable (recommended)
echo ----------------------------------------------------------
echo You can either:
echo   A. Set environment variable: set GITHUB_TOKEN=your_token_here
echo   B. Enter it when prompted by the script
echo.
echo Step 3: Run the privacy manager
echo -------------------------------
echo.

set /p ready="Are you ready to proceed? (y/N): "

if /I "%ready%" neq "y" (
    echo.
    echo ❌ Setup cancelled. Run this script again when ready.
    echo.
    pause
    exit /b 0
)

echo.
echo Choose an option:
echo 1. List current repository status
echo 2. Make all public repositories private
echo 3. Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 📊 Listing repository status...
    node make-repos-private-api.js --list
) else if "%choice%"=="2" (
    echo.
    echo ⚠️  WARNING: This will make ALL your public repositories private!
    echo This action cannot be easily undone.
    echo.
    echo 📋 What this will do:
    echo   - Fetch all your GitHub repositories
    echo   - Identify public repositories
    echo   - Convert them to private (one by one)
    echo   - Show progress and results
    echo.
    set /p confirm="Are you absolutely sure? (y/N): "
    
    if /I "%confirm%"=="y" (
        echo.
        echo 🔒 Starting repository privacy update...
        node make-repos-private-api.js
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
echo 📋 Additional Information:
echo ========================
echo.
echo - This script uses the GitHub API directly
echo - Rate limited to 5000 requests per hour
echo - Processes repositories one at a time to avoid limits
echo - Safe: only changes visibility, doesn't delete anything
echo - Reversible: you can manually make repositories public again
echo.
echo 🔗 Useful links:
echo   - GitHub tokens: https://github.com/settings/tokens
echo   - Repository settings: https://github.com/settings/repositories
echo   - GitHub API docs: https://docs.github.com/en/rest
echo.
pause