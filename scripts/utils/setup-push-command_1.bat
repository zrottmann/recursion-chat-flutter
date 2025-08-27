@echo off
REM 🚀 Setup Global /push Command
REM This script sets up the push command to be available from any directory

echo 🚀 Setting up global /push command...
echo.

REM Get current directory (where the scripts are located)
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

echo 📍 Script location: %SCRIPT_DIR%
echo.

REM Check if directory is already in PATH
echo %PATH% | findstr /C:"%SCRIPT_DIR%" >nul
if %errorlevel% equ 0 (
    echo ✅ Directory already in PATH
) else (
    echo 🔧 Adding directory to PATH...
    
    REM Add to user PATH (persistent)
    for /f "usebackq tokens=2,*" %%A in (`reg query "HKCU\Environment" /v PATH 2^>nul`) do set "USER_PATH=%%B"
    if not defined USER_PATH set "USER_PATH="
    
    REM Check if our directory is already in user PATH
    echo %USER_PATH% | findstr /C:"%SCRIPT_DIR%" >nul
    if %errorlevel% neq 0 (
        if defined USER_PATH (
            reg add "HKCU\Environment" /v PATH /t REG_EXPAND_SZ /d "%USER_PATH%;%SCRIPT_DIR%" /f >nul
        ) else (
            reg add "HKCU\Environment" /v PATH /t REG_EXPAND_SZ /d "%SCRIPT_DIR%" /f >nul
        )
        echo ✅ Added to user PATH
    )
    
    REM Update current session PATH
    set "PATH=%PATH%;%SCRIPT_DIR%"
    echo ✅ Updated current session PATH
)

echo.
echo 🧪 Testing push command...

REM Test if push.bat can be found
where push.bat >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ push.bat command available globally
) else (
    echo ⚠️  push.bat not found in PATH. You may need to restart your command prompt.
)

REM Test Node.js availability
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js is available
) else (
    echo ❌ Node.js not found. Please install Node.js.
)

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Usage:
echo   push                    - Auto-commit and push with timestamp
echo   push "your message"     - Commit and push with custom message
echo.
echo 🔄 You may need to restart your command prompt for the global command to work.
echo.

pause