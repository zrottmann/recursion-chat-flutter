@echo off
echo Making all GitHub repositories private...
echo.

REM First authenticate if not already authenticated
gh auth status >nul 2>&1
if errorlevel 1 (
    echo You need to authenticate first!
    echo Running: gh auth login
    gh auth login
    echo.
)

echo Fetching all your repositories...
echo.

REM Get all repos and make them private
for /f "tokens=*" %%i in ('gh repo list --limit 1000 --json nameWithOwner -q ".[].nameWithOwner"') do (
    echo Making %%i private...
    gh repo edit %%i --visibility private
)

echo.
echo All repositories have been made private!
pause