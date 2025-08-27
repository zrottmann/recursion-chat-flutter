@echo off
echo.
echo ============================================
echo      AGENT SWARM ORCHESTRATOR - STARTUP
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencies already installed ✓
)

echo.
echo [2/3] Starting Agent Swarm Orchestrator...
echo.

:: Start the server in a new window
start "Agent Swarm - Server" cmd /k npm start

:: Wait a bit for server to start
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Opening Operations Dashboard...
echo.

:: Open the enhanced dashboard in default browser
start "" "%~dp0examples\demo-operations-center-enhanced.html"

echo.
echo ============================================
echo     AGENT SWARM ORCHESTRATOR STARTED
echo ============================================
echo.
echo Server running at: ws://localhost:8080 (or alternative port)
echo Dashboard opened in your browser
echo.
echo To stop the server, close the "Agent Swarm - Server" window
echo.
pause