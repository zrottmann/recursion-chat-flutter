@echo off
echo Building and Starting Trading Post on Port 3000
echo ===============================================
echo.

echo Step 1: Building React frontend...
cd /d "%~dp0\trading-app-frontend"
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo Step 2: Starting unified application on port 3000...
cd /d "%~dp0"

echo.
echo ===============================================
echo Trading Post is running on: http://localhost:3000
echo API Documentation: http://localhost:3000/docs  
echo.
echo Test credentials:
echo   Email: zrottmann@gmail.com
echo   Password: Qpalzm1!
echo.
echo Both frontend and backend are served on port 3000
echo ===============================================
echo.

REM Start the modified app that serves both API and frontend
venv\Scripts\python.exe -c "
import uvicorn
from app_sqlite import app
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import sys

# Mount frontend build files
frontend_build_path = Path('trading-app-frontend/build')
if frontend_build_path.exists():
    app.mount('/static', StaticFiles(directory='trading-app-frontend/build/static'), name='static')
    
    @app.get('/{path:path}')
    async def serve_frontend(path: str):
        if path.startswith('api/') or path.startswith('docs') or path.startswith('uploads/'):
            # Let FastAPI handle API routes normally
            return
        
        # Check if it's a static file
        file_path = frontend_build_path / path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Fallback to index.html for SPA routes
        return FileResponse(frontend_build_path / 'index.html')
    
    print('Frontend mounted successfully')
else:
    print('Frontend build not found!')
    sys.exit(1)

uvicorn.run(app, host='0.0.0.0', port=3000)
"

pause