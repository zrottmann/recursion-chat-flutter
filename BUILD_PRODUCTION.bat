@echo off
title Flutter Production Build
color 0A

echo ================================================
echo     FLUTTER PRODUCTION BUILD
echo ================================================
echo Building the real Flutter chat app for production
echo.

REM Set Flutter environment
set "FLUTTER_ROOT=C:\Users\Zrott\Downloads\flutter_windows_3.32.8-stable\flutter"
set "FLUTTER_BIN=%FLUTTER_ROOT%\bin"
set "PATH=%FLUTTER_BIN%;%PATH%"

echo [1/8] Environment Setup...
echo Flutter Root: %FLUTTER_ROOT%
echo Flutter Bin: %FLUTTER_BIN%
echo Project Dir: %CD%
echo.

echo [2/8] Flutter Doctor Check...
flutter doctor --version
echo.

echo [3/8] Enable Web Support...
flutter config --enable-web
echo ✅ Web support enabled
echo.

echo [4/8] Clean Previous Build...
if exist "build" rmdir /s /q "build"
flutter clean
echo ✅ Clean completed
echo.

echo [5/8] Get Dependencies...
flutter pub get
if errorlevel 1 (
    echo ❌ Dependencies failed!
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo [6/8] Flutter Web Build (Release)...
echo This may take 5-10 minutes...
echo.
flutter build web --release --web-renderer=canvaskit
if errorlevel 1 (
    echo ❌ Build failed!
    echo Check errors above
    pause
    exit /b 1
)
echo ✅ Flutter build completed!
echo.

echo [7/8] Build Verification...
if exist "build\web\index.html" (
    echo ✅ Build successful - files created
    echo 📁 Build location: %CD%\build\web
    echo 📋 Files created:
    dir build\web\*.* /b
) else (
    echo ❌ Build files not found
    pause
    exit /b 1
)
echo.

echo [8/8] Starting Production Server...
echo.
echo ================================================
echo 🚀 PRODUCTION FLUTTER APP READY!
echo ================================================
echo 
echo 📁 Built files: %CD%\build\web
echo 🌐 Starting server on: http://localhost:8080
echo 
echo The REAL Flutter chat app is now running!
echo Features:
echo • Real Dart/Flutter compilation
echo • Production optimized
echo • Material Design 3 components
echo • Ready for Appwrite integration
echo.

cd build\web
python -m http.server 8080

echo.
echo Production server stopped.
pause