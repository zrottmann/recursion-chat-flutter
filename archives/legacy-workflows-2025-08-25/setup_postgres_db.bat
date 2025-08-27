@echo off
echo Setting up PostgreSQL database for Trading Post...
echo.

REM Common PostgreSQL installation paths
set PSQL_PATH=
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe
) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\15\bin\psql.exe
) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\14\bin\psql.exe
) else (
    echo PostgreSQL not found in standard locations!
    echo Please enter the path to psql.exe manually
    set /p PSQL_PATH="Path to psql.exe: "
)

echo Using PostgreSQL at: %PSQL_PATH%
echo.
echo You'll need to enter the postgres user password you set during installation.
echo.

REM Execute setup commands
echo Creating database and user...
"%PSQL_PATH%" -U postgres -c "CREATE DATABASE tradingpost;"
"%PSQL_PATH%" -U postgres -c "CREATE USER tradinguser WITH PASSWORD 'tradingpass';"
"%PSQL_PATH%" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE tradingpost TO tradinguser;"

echo.
echo Enabling PostGIS extension...
"%PSQL_PATH%" -U postgres -d tradingpost -c "CREATE EXTENSION IF NOT EXISTS postgis;"

echo.
echo Database setup complete!
echo.
echo Now run the following commands to initialize the Trading Post database:
echo.
echo set DB_URL=postgresql://tradinguser:tradingpass@localhost:5432/tradingpost
echo python db_init.py --migrate --seed
echo.
pause