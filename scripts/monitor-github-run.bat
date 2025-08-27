@echo off
REM Monitor specific GitHub Actions run by ID and repo

if "%~1"=="" (
    echo Usage: monitor-github-run.bat [run-id] [repo-name]
    echo Example: monitor-github-run.bat 17194254884 recursion-chat-app
    exit /b 1
)

if "%~2"=="" (
    echo Usage: monitor-github-run.bat [run-id] [repo-name]
    echo Example: monitor-github-run.bat 17194254884 recursion-chat-app
    exit /b 1
)

set RUN_ID=%~1
set REPO=%~2

echo 🔍 Monitoring GitHub Actions run %RUN_ID% for %REPO%...
cd "C:\Users\Zrott\OneDrive\Desktop\Claude"
gh.exe run watch --exit-status %RUN_ID% --repo zrottmann/%REPO%