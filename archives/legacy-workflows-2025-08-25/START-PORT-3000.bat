@echo off
echo ================================================
echo Starting Trading Post on Port 3000
echo ================================================
echo.

cd /d "%~dp0"

echo Checking Python environment...
if not exist "venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)

echo Checking frontend build...
if not exist "trading-app-frontend\build\index.html" (
    echo Building frontend...
    cd trading-app-frontend
    call npm run build
    cd ..
)

echo.
echo Starting server on http://localhost:3000
echo.
echo API Documentation: http://localhost:3000/docs
echo.
echo Test Credentials:
echo   Email: zrottmann@gmail.com
echo   Password: Qpalzm1!
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

"venv\Scripts\python.exe" -m uvicorn app_sqlite:app --host 0.0.0.0 --port 3000

pause