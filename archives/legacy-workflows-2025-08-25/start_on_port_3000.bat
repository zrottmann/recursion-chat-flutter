@echo off
echo Starting Trading Post on Port 3000...
echo ======================================
echo.

REM Build frontend first if needed
if not exist "trading-app-frontend\build" (
    echo Building frontend...
    cd /d "%~dp0\trading-app-frontend"
    call npm run build
    cd /d "%~dp0"
)

REM Start Backend API with Frontend on port 3000
echo Starting Trading Post on port 3000...
echo.
echo Backend API: http://localhost:3000/api
echo API Docs: http://localhost:3000/docs
echo Frontend: http://localhost:3000
echo.
echo Test credentials:
echo   Email: zrottmann@gmail.com
echo   Password: Qpalzm1!
echo.

venv\Scripts\python.exe -m uvicorn app_sqlite:app --reload --host 0.0.0.0 --port 3000

pause