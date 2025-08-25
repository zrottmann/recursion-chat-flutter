# PowerShell script to run db_init.py with PostgreSQL

Write-Host "Running Trading Post with PostgreSQL" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Prompt for PostgreSQL password
$password = Read-Host "Enter your PostgreSQL 'postgres' user password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$postgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set the database URL - using postgres user directly
$env:DB_URL = "postgresql://postgres:$postgresPassword@localhost:5432/postgres"

Write-Host "`nUsing database URL: postgresql://postgres:****@localhost:5432/postgres" -ForegroundColor Cyan

# Create tables in the default postgres database
Write-Host "`nInitializing database with migrations and seed data..." -ForegroundColor Yellow

python db_init.py --migrate --seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Database initialized with PostgreSQL." -ForegroundColor Green
    Write-Host "`nTo check the data, run:" -ForegroundColor Cyan
    Write-Host "python check_db.py" -ForegroundColor White
} else {
    Write-Host "`nError initializing database. Check the error messages above." -ForegroundColor Red
}