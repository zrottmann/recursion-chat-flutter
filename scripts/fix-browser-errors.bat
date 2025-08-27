@echo off
echo =================================
echo Browser Extension Error Fixer
echo =================================

echo Step 1: Clearing browser caches and data...
echo.

REM Clear Chrome/Edge user data that might cause extension conflicts
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage" (
    echo Clearing Chrome local storage...
    rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage"
)

if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage" (
    echo Clearing Edge local storage...
    rd /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage"
)

echo Step 2: Restarting browser processes...
taskkill /f /im chrome.exe 2>nul
taskkill /f /im msedge.exe 2>nul
timeout /t 3 /nobreak

echo.
echo Step 3: Instructions for manual fixes:
echo.
echo 1. DISABLE PROBLEMATIC EXTENSIONS:
echo    - Open Chrome/Edge Settings ^> Extensions
echo    - Disable Yoroi Wallet extension temporarily
echo    - Disable any other wallet/crypto extensions
echo.
echo 2. CLEAR EXTENSION DATA:
echo    - In Extensions page, click "Remove" on problematic extensions
echo    - Reinstall only essential extensions
echo.
echo 3. RESET BROWSER FLAGS:
echo    - Type chrome://flags/ or edge://flags/
echo    - Click "Reset all to default"
echo    - Restart browser
echo.
echo 4. CHECK DEVELOPER TOOLS:
echo    - Press F12 to open DevTools
echo    - Go to Application ^> Storage ^> Clear storage
echo    - Check all boxes and click "Clear site data"
echo.

pause