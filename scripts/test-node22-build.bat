@echo off
echo === Testing Node 22 Build Locally ===
echo.

REM Check Node version
echo Current Node version:
node --version
echo.

REM Check npm version
echo Current npm version:
npm --version
echo.

REM Clean up old files
echo Cleaning up old build files...
if exist "trading-app-frontend\package-lock.json" (
    echo Removing frontend package-lock.json...
    del /f "trading-app-frontend\package-lock.json"
)
if exist "package-lock.json" (
    echo Removing backend package-lock.json...
    del /f "package-lock.json"
)
echo.

REM Test the build
echo Starting build test...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo === BUILD SUCCESSFUL ===
    echo The build completed successfully with Node 22!
) else (
    echo.
    echo === BUILD FAILED ===
    echo Please check the error messages above.
)

pause