@echo off
echo Starting Flutter Recursion Chat App on Port 3000...
echo.

REM Set Flutter path
set FLUTTER_PATH=C:\Users\Zrott\Downloads\flutter_windows_3.32.8-stable\flutter\bin
set PATH=%FLUTTER_PATH%;%PATH%

REM Navigate to project
cd /d "C:\Users\Zrott\Development\Active\recursion_chat_flutter"

echo Current directory: %cd%
echo.

echo Checking Flutter...
flutter --version
echo.

echo Installing dependencies...
flutter pub get
echo.

echo Available devices:
flutter devices
echo.

echo Starting web server on port 3000...
echo Open your browser to: http://localhost:3000
echo.
flutter run -d chrome --web-port=3000

pause