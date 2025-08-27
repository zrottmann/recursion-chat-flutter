@echo off
echo ==========================================
echo   SlumLord Unified - Quick Start
echo ==========================================
echo.

:menu
echo Select what to run:
echo 1. Web Version (Browser)
echo 2. Mobile Version (React Native)
echo 3. Multiplayer Server (Docker)
echo 4. Multiplayer Server (Manual)
echo 5. Everything (All components)
echo 6. Setup Environment
echo 0. Exit
echo.
set /p choice="Enter choice (0-6): "

if "%choice%"=="1" goto web
if "%choice%"=="2" goto mobile
if "%choice%"=="3" goto multiplayer_docker
if "%choice%"=="4" goto multiplayer_manual
if "%choice%"=="5" goto all
if "%choice%"=="6" goto setup
if "%choice%"=="0" goto end

:web
echo.
echo Starting Web Version...
cd web\appwrite-deployment
start cmd /k "npm install --legacy-peer-deps && npm run dev"
cd ..\..
echo Web version started at http://localhost:5173
pause
goto menu

:mobile
echo.
echo Starting Mobile Version...
cd mobile
start cmd /k "npm install && npm start"
cd ..
echo Mobile version started. Use Expo Go app to scan QR code.
pause
goto menu

:multiplayer_docker
echo.
echo Starting Multiplayer Server with Docker...
docker-compose up -d
echo Multiplayer server started at:
echo - Shard Manager: http://localhost:3000
echo - Game Shard 1: ws://localhost:4001
echo - Game Shard 2: ws://localhost:4002
pause
goto menu

:multiplayer_manual
echo.
echo Starting Multiplayer Server Manually...
cd multiplayer\shard-manager
start cmd /k "npm install && npm start"
timeout /t 5
cd ..\game-shard
start cmd /k "npm install && PORT=4001 SHARD_ID=shard-1 npm start"
timeout /t 2
start cmd /k "npm install && PORT=4002 SHARD_ID=shard-2 npm start"
cd ..\..
echo Multiplayer servers started!
pause
goto menu

:all
echo.
echo Starting All Components...
call :web
call :multiplayer_docker
call :mobile
echo All components started!
pause
goto menu

:setup
echo.
echo Setting up environment...
echo.

REM Check for .env file
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo Please edit .env file with your Appwrite credentials!
    notepad .env
) else (
    echo .env file already exists
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Setup complete!
pause
goto menu

:end
echo.
echo Thank you for using SlumLord Unified!
exit /b