# Flutter Runner Script
Write-Host "Setting up Flutter environment..." -ForegroundColor Green

# Set Flutter path
$flutterPath = "C:\Users\Zrott\Downloads\flutter_windows_3.32.8-stable\flutter\bin"
$env:PATH = "$flutterPath;$env:PATH"

# Change to project directory
Set-Location "C:\Users\Zrott\Development\Active\recursion_chat_flutter"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check Flutter installation
Write-Host "Checking Flutter installation..." -ForegroundColor Green
flutter --version

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
flutter pub get

# Check available devices
Write-Host "Checking available devices..." -ForegroundColor Green
flutter devices

# Run Flutter app for web
Write-Host "Starting Flutter web app..." -ForegroundColor Green
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
flutter run -d chrome --web-port=8080

Write-Host "Press any key to close..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")