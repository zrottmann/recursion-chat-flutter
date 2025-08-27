@echo off
REM 🚀 Quick Push to Git Main - Batch Script
REM Usage: push [commit message]
REM Example: push "feat: add new feature"

cd /d "%~dp0"

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js to use this command.
    pause
    exit /b 1
)

REM Pass all arguments to the Node.js script
if "%*"=="" (
    node push-to-main.js
) else (
    node push-to-main.js %*
)

pause