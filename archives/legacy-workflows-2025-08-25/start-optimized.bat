@echo off
echo ====================================
echo Enhanced Tech Lead Orchestrator
echo Memory Optimized Startup
echo ====================================
echo.

REM Kill any existing processes
taskkill /F /IM node.exe 2>nul >nul

REM Set memory optimization flags
set NODE_OPTIONS=--expose-gc --max-old-space-size=512 --optimize-for-size

echo Starting server with memory optimizations...
echo Memory limit: 512MB
echo Garbage collection: Enabled
echo.

REM Start the server
node %NODE_OPTIONS% server.js

pause