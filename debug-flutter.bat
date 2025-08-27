@echo off
echo ========================================
echo Flutter Debug Runner
echo ========================================
echo.

REM Set Flutter path
set FLUTTER_PATH=C:\Users\Zrott\Downloads\flutter_windows_3.32.8-stable\flutter\bin
set PATH=%FLUTTER_PATH%;%PATH%

REM Navigate to project
cd /d "C:\Users\Zrott\Development\Active\recursion_chat_flutter"

echo Current directory: %cd%
echo.

echo [1/6] Checking Flutter installation...
flutter --version
if errorlevel 1 (
    echo ERROR: Flutter not found!
    pause
    exit /b 1
)
echo Flutter OK!
echo.

echo [2/6] Running Flutter doctor...
flutter doctor
echo.

echo [3/6] Cleaning project...
flutter clean
echo.

echo [4/6] Getting dependencies...
flutter pub get
if errorlevel 1 (
    echo ERROR: Failed to get dependencies!
    pause
    exit /b 1
)
echo Dependencies OK!
echo.

echo [5/6] Checking devices...
flutter devices
echo.

echo [6/6] Building and running web app...
echo This may take several minutes on first build...
echo.
echo Browser should open automatically to: http://localhost:4000
echo If not, manually go to: http://localhost:4000
echo.
echo Starting Flutter web development server...
flutter run -d chrome --web-port=4000 --verbose

echo.
echo App has stopped. Check above for any errors.
pause