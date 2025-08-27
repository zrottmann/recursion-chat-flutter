@echo off
REM Simple Super Console Launcher - Auto-opens CMD and Git Bash tabs
REM This is required for claunch to work properly
REM Runs as regular user - NO ADMIN REQUIRED

echo Opening Windows Terminal with CMD and Git Bash tabs...
echo.
echo WORKFLOW:
echo 1. Windows Terminal will open with CMD tab
echo 2. Git Bash tab will auto-open
echo 3. Switch to Git Bash tab and type: claunch
echo 4. Done!
echo.
pause

REM Navigate to Claude Desktop directory first
cd /d "C:\Users\Zrott\OneDrive\Desktop\Claude"

REM Launch Windows Terminal with both CMD and Git Bash tabs
wt -d "C:\Users\Zrott\OneDrive\Desktop\Claude" cmd.exe ; new-tab -d "C:\Users\Zrott\OneDrive\Desktop\Claude" "C:\Program Files\Git\bin\bash.exe"