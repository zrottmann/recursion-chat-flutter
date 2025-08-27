@echo off
title Flutter Recursion Chat - Quick Start
color 0A

echo ========================================
echo   Flutter Recursion Chat - Quick Start
echo ========================================
echo.

echo [1/5] Setting Flutter Path...
set FLUTTER_BIN=C:\Users\Zrott\Downloads\flutter_windows_3.32.8-stable\flutter\bin
set PATH=%FLUTTER_BIN%;%PATH%
echo Flutter Path: %FLUTTER_BIN%
echo.

echo [2/5] Checking Flutter Installation...
flutter --version
if errorlevel 1 (
    echo ERROR: Flutter not found! Please check your Flutter installation.
    echo Expected path: %FLUTTER_BIN%
    pause
    exit /b 1
)
echo.

echo [3/5] Navigating to Project Directory...
cd /d "%~dp0"
echo Current directory: %cd%
echo.

echo [4/5] Installing Flutter Dependencies...
flutter pub get
if errorlevel 1 (
    echo ERROR: Failed to get Flutter dependencies!
    pause
    exit /b 1
)
echo.

echo [5/5] Starting Flutter Recursion Chat...
echo.
echo ========================================
echo   🚀 LAUNCHING FLUTTER APP
echo ========================================
echo   - App will open in Chrome browser
echo   - Modern Material Design UI
echo   - No React Error #301 issues!
echo   - Real-time chat functionality
echo ========================================
echo.

flutter run -d chrome
if errorlevel 1 (
    echo.
    echo ERROR: Failed to run Flutter app!
    echo.
    echo Troubleshooting:
    echo 1. Make sure Chrome is installed
    echo 2. Try: flutter devices
    echo 3. Try: flutter run -d windows
    echo.
    pause
    exit /b 1
)

echo.
echo Flutter app has stopped.
pause