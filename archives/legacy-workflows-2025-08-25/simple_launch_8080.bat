@echo off
echo Starting Slumlord Game on Port 8080...
echo.

cd /d "%~dp0"

flutter --version >nul 2>&1
if errorlevel 1 (
    echo Flutter not found. Please install Flutter first.
    echo.
    echo Install Flutter from: https://flutter.dev/docs/get-started/install/windows
    echo.
    echo After installing, add Flutter to your PATH and run this script again.
    echo.
    pause
    exit /b 1
)

echo Running Flutter pub get...
flutter pub get

echo.
echo Launching game on http://localhost:8080
echo.
flutter run -d chrome --web-port=8080 --target=lib/main.dart

pause