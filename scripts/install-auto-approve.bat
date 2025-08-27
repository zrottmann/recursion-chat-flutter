@echo off
echo Installing Claude Auto-Approval System...
echo.

REM Make sure we're in the right directory
cd /d "%~dp0"

echo Setting up Node.js package...
call npm link
if %errorlevel% neq 0 (
    echo Warning: npm link failed, continuing with local setup...
)

echo.
echo Adding to PATH...
set "CLAUDE_AUTO_APPROVE_PATH=%~dp0"
setx CLAUDE_AUTO_APPROVE_PATH "%CLAUDE_AUTO_APPROVE_PATH%" >nul 2>&1

echo.
echo Creating global command shortcut...
if not exist "C:\Users\%USERNAME%\.local\bin" mkdir "C:\Users\%USERNAME%\.local\bin"

echo @echo off > "C:\Users\%USERNAME%\.local\bin\claude-auto-approve.bat"
echo node "%CLAUDE_AUTO_APPROVE_PATH%auto-approve.js" %%* >> "C:\Users\%USERNAME%\.local\bin\claude-auto-approve.bat"

echo.
echo Testing installation...
node auto-approve.js "echo test"
if %errorlevel% equ 0 (
    echo ✅ Installation successful!
) else (
    echo ❌ Installation failed!
    exit /b 1
)

echo.
echo =========================================
echo Claude Auto-Approval System Installed!
echo =========================================
echo.
echo Usage in Claude Code:
echo   Commands like npm, git, python, etc. will now be auto-approved
echo.
echo Test manually:
echo   node .claude\auto-approve.js "npm run build"
echo   claude-auto-approve "git status"
echo.
echo Log file location:
echo   %~dp0auto-approve.log
echo.
echo Configuration:
echo   %~dp0settings.json
echo.
pause