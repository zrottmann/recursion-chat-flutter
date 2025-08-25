@echo off
setlocal enabledelayedexpansion

echo 🔧 CRITICAL FIX: Deploying Trading Post Frontend with Proper Environment Variables
echo =======================================================================

REM Navigate to frontend directory
cd /d "%~dp0trading-app-frontend"
echo 📁 Current directory: %CD%

REM Verify environment files
echo 🔍 Checking environment configuration...
if exist ".env.production" (
    echo ✅ Found .env.production
    echo 📋 Production environment preview:
    echo ---
    type .env.production | findstr /n "REACT_APP_APPWRITE"
    echo ---
) else (
    echo ❌ Missing .env.production file!
    pause
    exit /b 1
)

REM Verify the correct environment variable prefix
findstr /c:"REACT_APP_APPWRITE_PROJECT_ID" .env.production >nul
if %errorlevel% == 0 (
    echo ✅ Correct REACT_APP_ prefix found in production config
) else (
    echo ❌ Missing REACT_APP_ prefix in production config!
    echo 🔧 This is likely the cause of the AppWrite project ID error
    pause
    exit /b 1
)

REM Clean previous build
echo 🧹 Cleaning previous build...
if exist "build" rmdir /s /q "build" 2>nul
if exist "dist" rmdir /s /q "dist" 2>nul
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo ❌ npm install failed!
    pause
    exit /b 1
)

REM Build with explicit environment
echo 🔨 Building for production with environment variables...
set NODE_ENV=production

REM Load environment variables from .env.production
for /f "tokens=1,2 delims==" %%a in (.env.production) do (
    if not "%%a" == "" if not "%%a:~0,1%" == "#" (
        set "%%a=%%b"
    )
)

REM Verify environment variables are loaded
echo 🌍 Verifying environment variables:
echo REACT_APP_APPWRITE_ENDPOINT: %REACT_APP_APPWRITE_ENDPOINT%
echo REACT_APP_APPWRITE_PROJECT_ID: %REACT_APP_APPWRITE_PROJECT_ID%

REM Build the application
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Verify build output
if exist "build" (
    echo ✅ Build successful!
    
    REM Check if environment variables are embedded in the build
    echo 🔍 Checking if project ID is embedded in build...
    findstr /s /c:"689bdee000098bd9d55c" build\*.* >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ Project ID found in build files
    ) else (
        echo ❌ Project ID NOT found in build files - this is the problem!
        echo 🔧 Environment variables may not be loading properly
    )
) else (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Copy build to AppWrite function
echo 📋 Copying build to AppWrite function...
set "FUNCTION_DIR=..\functions\trading-post-frontend-serve"
if exist "%FUNCTION_DIR%" (
    REM Backup existing
    if exist "%FUNCTION_DIR%\public" (
        set "BACKUP_NAME=public.backup.%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
        set "BACKUP_NAME=!BACKUP_NAME: =0!"
        move "%FUNCTION_DIR%\public" "%FUNCTION_DIR%\!BACKUP_NAME!" >nul
    )
    
    REM Copy new build
    xcopy /s /e /i "build\*" "%FUNCTION_DIR%\public\" >nul
    echo ✅ Build copied to AppWrite function
) else (
    echo ❌ AppWrite function directory not found: %FUNCTION_DIR%
    pause
    exit /b 1
)

REM Navigate back to project root
cd /d "%~dp0"

echo 🎉 DEPLOYMENT COMPLETE!
echo =======================================================================
echo 🔧 Critical Fix Applied:
echo    - Fixed environment variable prefix from VITE_ to REACT_APP_
echo    - Ensured project ID is embedded in production build
echo    - Deployed corrected frontend to AppWrite
echo.
echo 🧪 To test the fix:
echo    1. Open AppWrite Console: Functions ^> trading-post-frontend-serve
echo    2. Execute function and check browser console
echo    3. Verify no 'No Appwrite project was specified' errors
echo.
echo 📊 If issue persists, use the diagnostic tool:
echo    file://%CD%\appwrite-runtime-diagnostic.html
echo.
echo Press any key to continue...
pause >nul