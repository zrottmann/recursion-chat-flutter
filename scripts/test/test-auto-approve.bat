@echo off
echo Testing Claude Auto-Approval System
echo.

echo Testing safe command: npm --version
node "C:\Users\Zrott\OneDrive\Desktop\Claude\.claude\auto-approve.js" "npm --version"
echo.

echo Testing safe command: git status
node "C:\Users\Zrott\OneDrive\Desktop\Claude\.claude\auto-approve.js" "git status"
echo.

echo Testing dangerous command: rm -rf /
node "C:\Users\Zrott\OneDrive\Desktop\Claude\.claude\auto-approve.js" "rm -rf /"
echo.

echo Testing complete! Check auto-approve.log for details.
pause