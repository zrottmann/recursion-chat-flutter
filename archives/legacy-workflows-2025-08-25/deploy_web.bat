@echo off
echo ========================================
echo    SLUMLORD - WEB DEPLOYMENT BUILD
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

echo Step 1: Cleaning previous build...
"C:\Users\Zrott\OneDrive\Desktop\Claude\flutter\bin\flutter" clean

echo.
echo Step 2: Getting dependencies...
"C:\Users\Zrott\OneDrive\Desktop\Claude\flutter\bin\flutter" pub get

echo.
echo Step 3: Analyzing code for issues...
"C:\Users\Zrott\OneDrive\Desktop\Claude\flutter\bin\flutter" analyze --no-fatal-infos

echo.
echo Step 4: Building optimized web version...
"C:\Users\Zrott\OneDrive\Desktop\Claude\flutter\bin\flutter" build web --release --web-renderer canvaskit

echo.
echo ========================================
echo           BUILD COMPLETE!
echo ========================================
echo.
echo Web files are ready in: build\web\
echo.
echo To deploy:
echo 1. Copy contents of build\web\ to your web server
echo 2. Configure server for SPA routing (redirect all routes to index.html)
echo 3. Set up SSL certificate for HTTPS
echo.
echo For local testing:
echo cd build\web
echo python -m http.server 8080
echo Then visit: http://localhost:8080
echo.

REM Open build directory in explorer
explorer build\web

pause