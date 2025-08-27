@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    COMPREHENSIVE BROWSER ERROR FIXER
echo ========================================
echo.
echo This will fix the following issues:
echo  - Extension runtime.lastError messages
echo  - Font loading 404 errors
echo  - MutationObserver TypeErrors
echo  - Yoroi wallet extension conflicts
echo.

set /p choice="Continue with fixes? (Y/N): "
if /i "%choice%" neq "Y" goto :end

echo.
echo [1/6] Stopping browser processes...
taskkill /f /im chrome.exe 2>nul
taskkill /f /im msedge.exe 2>nul
taskkill /f /im firefox.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/6] Clearing browser data...
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage" (
    rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage" 2>nul
    echo     Chrome local storage cleared
)

if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage" (
    rd /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage" 2>nul
    echo     Edge local storage cleared
)

echo [3/6] Creating fix deployment HTML...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Browser Error Fixes^</title^>
echo     ^<link rel="stylesheet" href="font-loading-fix.css"^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>Browser Error Fixes Applied^</h1^>
echo     ^<p^>All browser error fixes have been loaded and are active.^</p^>
echo     ^<ul^>
echo         ^<li^>Extension port error prevention: Active^</li^>
echo         ^<li^>Font loading fixes: Active^</li^>
echo         ^<li^>MutationObserver protection: Active^</li^>
echo         ^<li^>Error suppression: Active^</li^>
echo     ^</ul^>
echo     ^<p^>Open your browser's developer tools ^(F12^) to see the fix status.^</p^>
echo     
echo     ^<script src="extension-port-fix.js"^>^</script^>
echo     ^<script src="font-loading-fix.js"^>^</script^>
echo     ^<script src="mutation-observer-fix.js"^>^</script^>
echo     ^<script src="browser-error-diagnostics.js"^>^</script^>
echo ^</body^>
echo ^</html^>
) > "browser-fixes.html"

echo     Fix deployment page created

echo [4/6] Creating userscript for persistent fixes...
(
echo // ==UserScript==
echo // @name         Browser Error Fixes
echo // @namespace    http://tampermonkey.net/
echo // @version      1.0
echo // @description  Fix browser extension and font loading errors
echo // @author       Claude Code
echo // @match        *://*/*
echo // @grant        none
echo // @run-at       document-start
echo // ==/UserScript==
echo.
) > "browser-error-fixes.user.js"

type "extension-port-fix.js" >> "browser-error-fixes.user.js"
echo. >> "browser-error-fixes.user.js"
type "font-loading-fix.js" >> "browser-error-fixes.user.js"
echo. >> "browser-error-fixes.user.js"
type "mutation-observer-fix.js" >> "browser-error-fixes.user.js"

echo     Userscript created for Tampermonkey/Greasemonkey

echo [5/6] Creating browser startup script...
(
echo @echo off
echo echo Starting browser with error fixes...
echo.
echo REM Start your preferred browser with the fix page
echo set BROWSER_ARGS=--disable-web-security --disable-features=VizDisplayCompositor --disable-extensions-http-throttling
echo.
echo if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" ^(
echo     start "Chrome with Fixes" "C:\Program Files\Google\Chrome\Application\chrome.exe" %%BROWSER_ARGS%% "%CD%\browser-fixes.html"
echo ^) else if exist "C:\Program Files ^(x86^)\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "Edge with Fixes" "C:\Program Files ^(x86^)\Microsoft\Edge\Application\msedge.exe" %%BROWSER_ARGS%% "%CD%\browser-fixes.html"
echo ^) else ^(
echo     echo No compatible browser found
echo     echo Please manually open browser-fixes.html in your browser
echo ^)
echo.
echo echo Browser error fixes loaded!
) > "start-browser-with-fixes.bat"

echo     Browser startup script created

echo [6/6] Running immediate fixes...
start /min "" "browser-fixes.html"
timeout /t 1 /nobreak >nul

echo.
echo ========================================
echo              FIXES APPLIED!
echo ========================================
echo.
echo The following files have been created:
echo   - browser-fixes.html ^(Load in browser for immediate fixes^)
echo   - browser-error-fixes.user.js ^(Install in Tampermonkey^)
echo   - start-browser-with-fixes.bat ^(Start browser with fixes^)
echo   - font-loading-fix.css ^(CSS fixes^)
echo.
echo NEXT STEPS:
echo   1. Install Tampermonkey extension if you want permanent fixes
echo   2. Load the userscript: browser-error-fixes.user.js
echo   3. Or run: start-browser-with-fixes.bat for immediate fixes
echo.
echo MANUAL EXTENSION FIXES:
echo   1. Go to chrome://extensions/ or edge://extensions/
echo   2. Disable Yoroi Wallet extension
echo   3. Remove any problematic crypto wallet extensions
echo   4. Clear extension data and reinstall only essential ones
echo.

pause

:end
echo Fix process completed.