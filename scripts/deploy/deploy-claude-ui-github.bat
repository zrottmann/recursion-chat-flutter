@echo off
REM Deploy Claude Code UI via GitHub Actions workflow

echo 🚀 Deploying Claude Code UI via GitHub Actions...
echo This method uses the proven GitHub Actions + Appwrite Sites integration
echo.

REM Execute the GitHub deployment script
node deploy-claude-ui-github.cjs

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ Deployment initiated successfully!
  echo 🔍 Monitor progress with: watch-deployment.bat Claude-Code-Remote
) else (
  echo ❌ Deployment failed with error code: %ERRORLEVEL%
)