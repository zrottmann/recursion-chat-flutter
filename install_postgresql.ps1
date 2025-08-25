# PostgreSQL Installation Helper Script for Windows
# This script downloads PostgreSQL and guides you through installation

Write-Host "PostgreSQL Installation Helper" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "Note: For best results, run PowerShell as Administrator" -ForegroundColor Yellow
}

# PostgreSQL download URL (version 16)
$postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64.exe"
$downloadPath = "$env:USERPROFILE\Downloads\postgresql-installer.exe"

Write-Host "`nStep 1: Downloading PostgreSQL installer..." -ForegroundColor Cyan
Write-Host "This may take a few minutes depending on your internet connection." -ForegroundColor Gray

try {
    # Download PostgreSQL installer
    Start-BitsTransfer -Source $postgresUrl -Destination $downloadPath -DisplayName "Downloading PostgreSQL"
    
    Write-Host "Download completed successfully!" -ForegroundColor Green
    Write-Host "Installer saved to: $downloadPath" -ForegroundColor Gray
    
    Write-Host "`nStep 2: Installation Instructions" -ForegroundColor Cyan
    Write-Host "1. The installer will open automatically" -ForegroundColor White
    Write-Host "2. Follow the installation wizard:" -ForegroundColor White
    Write-Host "   - Set password for 'postgres' user (REMEMBER THIS!)" -ForegroundColor Yellow
    Write-Host "   - Default port: 5432" -ForegroundColor White
    Write-Host "   - Default locale: English, United States" -ForegroundColor White
    Write-Host "   - When prompted, select 'Stack Builder' to install PostGIS later" -ForegroundColor White
    
    Write-Host "`nStep 3: After installation completes:" -ForegroundColor Cyan
    Write-Host "1. Open Stack Builder (if you selected it)" -ForegroundColor White
    Write-Host "2. Select your PostgreSQL installation" -ForegroundColor White
    Write-Host "3. Choose 'Spatial Extensions' -> 'PostGIS'" -ForegroundColor White
    Write-Host "4. Complete the PostGIS installation" -ForegroundColor White
    
    # Ask user if they want to start installation
    Write-Host "`nPress Enter to start the PostgreSQL installer, or Ctrl+C to cancel..." -ForegroundColor Green
    Read-Host
    
    # Start the installer
    Start-Process -FilePath $downloadPath -Wait
    
    Write-Host "`nStep 4: Set up Trading Post database" -ForegroundColor Cyan
    Write-Host "After PostgreSQL is installed, run these commands in PowerShell:" -ForegroundColor White
    Write-Host '$env:DB_URL = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/tradingpost"' -ForegroundColor Magenta
    Write-Host 'python db_init.py --migrate --seed' -ForegroundColor Magenta
    
} catch {
    Write-Host "Error downloading PostgreSQL: $_" -ForegroundColor Red
    Write-Host "`nAlternative: Download manually from:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
}

Write-Host "`nScript completed!" -ForegroundColor Green