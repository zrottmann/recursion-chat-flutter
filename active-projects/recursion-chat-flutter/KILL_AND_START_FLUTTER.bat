@echo off
title Kill Processes and Start Flutter
color 0C

echo ========================================
echo    KILL PROCESSES AND START FLUTTER
echo ========================================
echo Killing conflicting processes and starting Flutter
echo.

echo [1/7] Killing existing web servers...
taskkill /F /IM chrome.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM dart.exe /T >nul 2>&1
taskkill /F /IM flutter.exe /T >nul 2>&1
echo ✅ Processes killed

echo [2/7] Checking what's using port 8080...
netstat -ano | findstr ":8080"
echo.

echo [3/7] Setting up Flutter environment...
set "FLUTTER_ROOT=C:\Users\Zrott\Downloads\flutter_windows_3.32.8-stable\flutter"
set "FLUTTER_BIN=%FLUTTER_ROOT%\bin"
set "PATH=%FLUTTER_BIN%;%PATH%"
echo ✅ Flutter environment set

echo [4/7] Navigate to Flutter project...
cd /d "C:\Users\Zrott\Development\Active\recursion-chat\flutter"
echo Current directory: %cd%

echo [5/7] Clean and prepare Flutter project...
flutter clean
flutter pub get
echo ✅ Flutter project prepared

echo [6/7] Check Flutter devices...
flutter devices
echo.

echo [7/7] Starting Flutter on UNIQUE PORT 9999...
echo.
echo ==========================================
echo 🚀 FLUTTER STARTING ON PORT 9999
echo ==========================================
echo.
echo IMPORTANT: Access Flutter app at:
echo 👉 http://localhost:9999
echo.
echo NOT port 8080 (that might be React/Slumlord)
echo.
echo Watch for "Flutter run key commands" message below...
echo Press Ctrl+C to stop Flutter
echo.

flutter run -d chrome --web-port=9999 --web-renderer=canvaskit --verbose

echo.
echo Flutter stopped.
pause