@echo off
echo PostgreSQL Installation Helper
echo ==============================
echo.
echo This script will open the PostgreSQL download page in your browser.
echo.
echo Installation steps:
echo 1. Download PostgreSQL from the website that opens
echo 2. Run the installer with these settings:
echo    - Password for postgres user: Choose a strong password (REMEMBER IT!)
echo    - Port: 5432 (default)
echo    - Install Stack Builder: Yes (for PostGIS)
echo.
echo 3. After installation, install PostGIS through Stack Builder:
echo    - Open Stack Builder
echo    - Select PostgreSQL 16
echo    - Choose Spatial Extensions -^> PostGIS
echo.
echo 4. Then run these commands to set up the database:
echo    set DB_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/tradingpost
echo    python db_init.py --migrate --seed
echo.
echo Press any key to open the PostgreSQL download page...
pause >nul

start https://www.postgresql.org/download/windows/

echo.
echo Download page opened in your browser!
echo Follow the instructions above to complete installation.
pause