@echo off
echo Starting Trading Post with SSO Integration...
echo.

REM Load environment variables
if exist .env.appwrite.%1 (
    echo Loading environment: %1
    copy .env.appwrite.%1 .env > nul
) else (
    echo Loading development environment
    copy .env.appwrite.development .env > nul
)

REM Start backend
echo Starting backend server...
start "Trading Post Backend" cmd /c "cd /d %~dp0 && python app_with_sso.py"

REM Wait for backend to start
timeout /t 5 /nobreak > nul

REM Start frontend
echo Starting frontend application...
start "Trading Post Frontend" cmd /c "cd /d %~dp0\trading-app-frontend && npm start"

echo.
echo Trading Post SSO is running!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop all services...
pause > nul

REM Stop all services
taskkill /FI "WindowTitle eq Trading Post Backend*" /T /F
taskkill /FI "WindowTitle eq Trading Post Frontend*" /T /F
