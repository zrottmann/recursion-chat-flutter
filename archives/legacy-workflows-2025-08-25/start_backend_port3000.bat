@echo off
echo Starting Trading Post Backend on Port 3000...
echo =============================================
echo.

echo Backend API: http://localhost:3000
echo API Docs: http://localhost:3000/docs
echo.
echo Test credentials:
echo   Email: zrottmann@gmail.com
echo   Password: Qpalzm1!
echo.

venv\Scripts\python.exe -m uvicorn app_sqlite:app --reload --host 0.0.0.0 --port 3000