@echo off
REM Helper script to watch GitHub Actions deployments without approval prompts

if "%1"=="" (
    echo Usage: watch-deployment.bat [repo-name] [run-id optional]
    echo Example: watch-deployment.bat recursion-chat-app
    echo Example: watch-deployment.bat enhanced-tech-lead-orchestrator 17193783671
    exit /b 1
)

set REPO=%1
set RUN_ID=%2

cd "C:\Users\Zrott\OneDrive\Desktop\Claude"

if "%RUN_ID%"=="" (
    echo Watching latest deployment for %REPO%...
    gh.exe run watch --exit-status -R zrottmann/%REPO%
) else (
    echo Watching deployment %RUN_ID% for %REPO%...
    gh.exe run watch %RUN_ID% --repo zrottmann/%REPO% --exit-status
)