@echo off
echo === Trading Post - Unified Service Startup ===
echo.

echo 🎯 Unified Port Configuration:
echo - Backend (FastAPI): Port 8000
echo - Frontend (React): Port 5174  
echo - React Dev Server: Port 3002 (fallback)
echo.

echo Step 1: Killing any existing processes...
taskkill /f /im uvicorn.exe /t 2>nul
taskkill /f /im node.exe /t 2>nul
taskkill /f /im python.exe /t 2>nul

echo Waiting 3 seconds for processes to terminate...
timeout /t 3 /nobreak > nul

echo.
echo Step 2: Starting Backend on Port 8000...
start "Trading Post Backend" cmd /k "cd /d \"%~dp0\" && echo Starting FastAPI Backend on Port 8000... && python -m uvicorn app_sqlite:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Step 3: Testing Backend...
curl -s http://localhost:8000/health > nul
if %errorlevel%==0 (
    echo ✓ Backend is responding on port 8000
) else (
    echo ⚠ Backend may still be starting... continuing...
)

echo.
echo Step 4: Starting Frontend on Port 5174...
cd trading-app-frontend
start "Trading Post Frontend" cmd /k "echo Starting React Frontend on Port 5174... && set REACT_APP_API_URL=http://localhost:8000 && npm start"

echo.
echo Step 5: Service Status...
echo ========================================
echo Services starting:
echo 🟢 Backend: http://localhost:8000
echo 🟢 Frontend: http://localhost:5174  
echo 🟢 API Docs: http://localhost:8000/docs
echo ========================================

echo.
echo Step 6: Opening browser...
timeout /t 10 /nobreak > nul
start http://localhost:5174

echo.
echo ✓ All services started!
echo.
echo 📋 Service Management:
echo - Backend window: "Trading Post Backend"  
echo - Frontend window: "Trading Post Frontend"
echo - To stop: Close both command windows
echo.
echo 🛠 Troubleshooting:
echo - If errors persist, run: fix-react-build.bat
echo - Check backend logs in "Trading Post Backend" window
echo - Frontend should auto-open at http://localhost:5174
echo.
pause