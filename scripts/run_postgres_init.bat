@echo off
echo Setting up Trading Post with PostgreSQL
echo ======================================
echo.
echo Enter your PostgreSQL password for the 'postgres' user:
set /p PGPASSWORD=Password: 
echo.

REM Set the database URL
set DB_URL=postgresql://postgres:%PGPASSWORD%@localhost:5432/postgres

echo Using PostgreSQL database...
echo.

REM Remove old SQLite database to avoid conflicts
if exist local.db (
    del local.db
    echo Removed old SQLite database.
)

REM Run the initialization
python db_init.py --migrate --seed

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Database initialized with PostgreSQL.
    echo.
    echo To verify the data, run: python check_db.py
) else (
    echo.
    echo Error initializing database. Please check:
    echo 1. PostgreSQL is running
    echo 2. Password is correct
    echo 3. Port 5432 is not blocked
)

pause