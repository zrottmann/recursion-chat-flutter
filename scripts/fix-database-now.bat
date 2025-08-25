@echo off
echo ====================================================
echo Trading Post Database Schema Fix
echo ====================================================
echo.
echo This script will fix the "user_id attribute not found" error
echo that prevents the Trading Post marketplace from working.
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if the fix script exists
if not exist "fix-database-schema.js" (
    echo ERROR: fix-database-schema.js not found
    echo Please ensure you're running this from the trading-post directory
    pause
    exit /b 1
)

echo Checking current database schema...
echo.
node validate-database-schema.js

if errorlevel 1 (
    echo.
    echo Issues found! Running the fix...
    echo.
    
    REM Check if API key is set
    if "%APPWRITE_API_KEY%"=="" (
        echo WARNING: APPWRITE_API_KEY environment variable not set
        echo.
        set /p APIKEY="Please enter your Appwrite API key: "
        set APPWRITE_API_KEY=%APIKEY%
    )
    
    echo Running database schema fix...
    node fix-database-schema.js
    
    if errorlevel 1 (
        echo.
        echo Fix failed! Please check the error messages above.
        pause
        exit /b 1
    )
    
    echo.
    echo Validating fix...
    node validate-database-schema.js
    
    if errorlevel 1 (
        echo.
        echo Validation failed after fix. Some attributes may still be processing.
        echo Wait a few minutes and run this script again.
    ) else (
        echo.
        echo SUCCESS! Database schema has been fixed.
        echo The Trading Post marketplace should now work properly.
    )
) else (
    echo.
    echo SUCCESS! Database schema is already correct.
    echo No fixes needed.
)

echo.
echo ====================================================
echo Fix completed. You can now test the Trading Post app.
echo ====================================================
pause