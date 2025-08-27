@echo off
echo Starting SlumLord Game on Port 8080...
echo.

REM Check if Flutter is available
where flutter >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Flutter command not found. Please install Flutter first.
    echo Visit: https://docs.flutter.dev/get-started/install
    pause
    exit /b 1
)

REM Clean previous builds
echo 🧹 Cleaning previous builds...
flutter clean
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Flutter clean failed, continuing anyway...
)

REM Get dependencies
echo 📦 Getting dependencies...
flutter pub get
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to get dependencies
    pause
    exit /b 1
)

REM Build for web
echo 🔨 Building for web...
flutter build web --release
if %ERRORLEVEL% neq 0 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

REM Run on localhost:8080
echo 🚀 Starting SlumLord on http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
flutter run -d web-server --web-port=8080 --web-hostname=0.0.0.0

pause