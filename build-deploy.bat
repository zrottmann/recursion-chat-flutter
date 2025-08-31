@echo off
REM Flutter Web Production Build & Deploy Script for Windows
REM Usage: build-deploy.bat

echo Starting Flutter Web Production Build...
echo.

REM 1. Clean previous builds
echo Cleaning previous builds...
call flutter clean

REM 2. Get dependencies
echo Getting dependencies...
call flutter pub get

REM 3. Build for production with optimizations
echo Building for production...
call flutter build web --release --web-renderer auto --tree-shake-icons

REM 4. Show build info
echo.
echo Build complete!
echo Build output location: build\web
echo.

REM 5. Optional: Open build folder
echo Opening build folder...
start build\web

echo.
echo To deploy:
echo   1. The build\web folder is ready for deployment
echo   2. For Appwrite: Deploy contents of build\web
echo   3. For GitHub: Commit and push changes
echo.
echo Done!
pause