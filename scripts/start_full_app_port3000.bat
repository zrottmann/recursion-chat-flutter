@echo off
echo Starting Trading Post - Full Application on Port 3000
echo ===================================================
echo.

echo Step 1: Starting Backend on Port 3000...
start "Trading Post Backend" cmd /k "cd /d %~dp0 && echo Starting Backend... && venv\Scripts\python.exe -m uvicorn app_sqlite:app --reload --host 0.0.0.0 --port 3000"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Step 2: Testing backend connection...
curl -s http://localhost:3000/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo Backend not ready yet, waiting longer...
    timeout /t 5 /nobreak >nul
)

echo Step 3: Starting Frontend on Port 3002 with proxy to Port 3000...
cd /d "%~dp0\trading-app-frontend"
start "Trading Post Frontend" cmd /k "echo Starting Frontend... && set PORT=3002 && npm start"

cd /d "%~dp0"

echo.
echo =====================================================
echo Trading Post is starting up...
echo.
echo Backend API: http://localhost:3000
echo API Documentation: http://localhost:3000/docs  
echo Frontend: http://localhost:3002 (with proxy to backend on 3000)
echo.
echo Test credentials:
echo   Email: zrottmann@gmail.com
echo   Password: Qpalzm1!
echo.
echo Both services are starting in separate windows...
echo =====================================================

pause