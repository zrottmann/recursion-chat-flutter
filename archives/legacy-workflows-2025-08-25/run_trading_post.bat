@echo off
title Trading Post Application
cls
echo ==========================================
echo       TRADING POST APPLICATION
echo ==========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if venv exists
if not exist venv (
    echo Virtual environment not found. Creating it now...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created.
    echo.
    
    echo Installing requirements...
    call venv\Scripts\pip.exe install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install requirements
        pause
        exit /b 1
    )
    echo Requirements installed.
    echo.
)

REM Check for database
if not exist tradingpost.db (
    echo Database not found. Creating it now...
    call venv\Scripts\python.exe -c "from app_sqlite import Base, engine; Base.metadata.create_all(bind=engine); print('Database created successfully')"
    echo.
)

echo Starting Trading Post...
echo.
echo Backend will be available at:
echo   - API: http://localhost:8001
echo   - API Docs: http://localhost:8001/docs
echo.
echo Frontend will be available at:
echo   - http://localhost:3000
echo.
echo Test credentials:
echo   Email: zrottmann@gmail.com
echo   Password: Qpalzm1!
echo.
echo Press Ctrl+C to stop the servers
echo ==========================================
echo.

REM Start backend in this window
echo Starting backend server...
call venv\Scripts\python.exe -m uvicorn app_sqlite:app --reload --host 0.0.0.0 --port 8001