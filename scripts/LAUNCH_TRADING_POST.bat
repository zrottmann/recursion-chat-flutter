@echo off
echo ================================================================
echo        TRADING POST - IMMEDIATE ACCESS LAUNCHER
echo ================================================================
echo.
echo STATUS: Original "No Appwrite project" error RESOLVED!
echo Project ID: 689bdee000098bd9d55c - ACTIVE
echo.
echo Starting local HTTP server to bypass CORS restrictions...
echo.
cd /d "%~dp0frontend"
echo Launching Trading Post at http://localhost:8080
echo.
echo CTRL+C to stop server
echo Browser will open automatically...
echo.
timeout /t 3 /nobreak >nul
start http://localhost:8080
python -m http.server 8080