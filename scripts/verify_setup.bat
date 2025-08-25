@echo off
echo Trading Post Setup Verification
echo ===============================
echo.

echo 1. Checking backend server...
curl -s http://localhost:8001/health > nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend is running on port 8001
) else (
    echo   [FAIL] Backend is NOT running on port 8001
    echo   Please run: start_server.bat
)

echo.
echo 2. Testing API endpoints...
echo   - Root: http://localhost:8001/
curl -s http://localhost:8001/ 2>nul | findstr "Trading Post"
echo   - Docs: http://localhost:8001/docs

echo.
echo 3. Frontend URLs:
echo   - If running on port 3000: http://localhost:3000
echo   - If running on port 5000: http://localhost:5000
echo   - Your URL: http://localhost:5000/#dashboard

echo.
echo 4. Test Credentials:
echo   - Email: zrottmann@gmail.com
echo   - Password: Qpalzm1!

echo.
echo 5. To see matches:
echo   a) Make sure backend is running (start_server.bat)
echo   b) Login with credentials above
echo   c) Click on "Matches" in the navigation
echo.
pause