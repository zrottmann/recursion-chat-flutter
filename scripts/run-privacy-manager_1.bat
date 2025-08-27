@echo off
cls
echo ================================================================================
echo                    GITHUB REPOSITORY PRIVACY MANAGER
echo ================================================================================
echo.
echo This tool will help you make all your GitHub repositories private.
echo.
echo IMPORTANT: You need a GitHub Personal Access Token to continue.
echo.
echo If you don't have one yet:
echo   1. Open: https://github.com/settings/tokens
echo   2. Click "Generate new token (classic)"
echo   3. Name: "Repository Privacy Manager"
echo   4. Expiration: 30 days
echo   5. Scope: Check "repo" box
echo   6. Generate and copy the token
echo.
echo ================================================================================
echo.

set /p token="Paste your GitHub token here (it will be hidden): "

if "%token%"=="" (
    echo.
    echo ERROR: No token provided!
    pause
    exit /b 1
)

echo.
echo Token received. Setting environment variable...
set GITHUB_TOKEN=%token%

echo.
echo What would you like to do?
echo   1. List all repositories (see what's public/private)
echo   2. Make ALL public repositories private
echo   3. Exit
echo.

set /p action="Enter your choice (1-3): "

if "%action%"=="1" (
    echo.
    echo Fetching your repositories...
    echo ================================================================================
    node make-repos-private-api.js --list
    echo ================================================================================
    echo.
    set /p continue="Would you like to make the public repos private? (y/N): "
    if /I "%continue%"=="y" (
        echo.
        echo Starting privacy update...
        node make-repos-private-api.js
    )
) else if "%action%"=="2" (
    echo.
    echo Starting repository privacy update...
    echo ================================================================================
    node make-repos-private-api.js
    echo ================================================================================
) else (
    echo.
    echo Exiting...
)

echo.
echo ================================================================================
echo Process complete!
echo ================================================================================
pause