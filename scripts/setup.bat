@echo off
setlocal enabledelayedexpansion

REM Trading Post Setup and Run Script for Windows
REM This script sets up and runs the Trading Post application

REM Colors for output (Windows 10+)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Print functions
goto :main

:print_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

:check_prerequisites
call :print_info "Checking prerequisites..."

set "missing_deps="

where docker >nul 2>nul
if errorlevel 1 set "missing_deps=!missing_deps! Docker"

where docker-compose >nul 2>nul
if errorlevel 1 (
    docker compose version >nul 2>nul
    if errorlevel 1 set "missing_deps=!missing_deps! Docker-Compose"
)

where node >nul 2>nul
if errorlevel 1 set "missing_deps=!missing_deps! Node.js"

where npm >nul 2>nul
if errorlevel 1 set "missing_deps=!missing_deps! npm"

where python >nul 2>nul
if errorlevel 1 set "missing_deps=!missing_deps! Python"

if not "!missing_deps!"=="" (
    call :print_error "Missing required dependencies:!missing_deps!"
    call :print_info "Please install the missing dependencies and try again."
    exit /b 1
)

call :print_success "All prerequisites are installed!"
goto :eof

:setup_environment
call :print_info "Setting up environment..."

REM Create .env file if it doesn't exist
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        call :print_warning ".env file created from .env.example - please update with your values"
    ) else (
        call :print_error ".env.example file not found!"
        exit /b 1
    )
) else (
    call :print_info ".env file already exists"
)

REM Create necessary directories
if not exist logs mkdir logs
if not exist data\postgres mkdir data\postgres
if not exist data\redis mkdir data\redis

call :print_success "Environment setup complete!"
goto :eof

:setup_backend
call :print_info "Setting up backend..."

if not exist backend\venv (
    call :print_info "Creating Python virtual environment..."
    cd backend
    python -m venv venv
    
    call :print_info "Installing Python dependencies..."
    call venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt
    
    cd ..
    call :print_success "Backend setup complete!"
) else (
    call :print_info "Backend virtual environment already exists"
)
goto :eof

:setup_frontend
call :print_info "Setting up frontend..."

cd frontend

if not exist node_modules (
    call :print_info "Installing frontend dependencies..."
    npm install
) else (
    call :print_info "Frontend dependencies already installed"
)

cd ..
call :print_success "Frontend setup complete!"
goto :eof

:start_services
call :print_info "Starting services..."

REM Check which docker compose command to use
docker compose version >nul 2>nul
if errorlevel 1 (
    set "DOCKER_COMPOSE=docker-compose"
) else (
    set "DOCKER_COMPOSE=docker compose"
)

REM Start infrastructure services
call :print_info "Starting infrastructure services (PostgreSQL, Redis)..."
%DOCKER_COMPOSE% up -d postgres redis

REM Wait for services to be ready
call :print_info "Waiting for services to be ready..."
timeout /t 5 /nobreak >nul

REM Run database migrations
call :print_info "Running database migrations..."
cd backend
call venv\Scripts\activate.bat
alembic upgrade head
cd ..

call :print_success "Services started successfully!"
goto :eof

:start_application
call :print_info "Starting Trading Post application..."

REM Start backend
call :print_info "Starting backend server..."
cd backend
start "Trading Post Backend" cmd /k "venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 3002 --reload"
cd ..

REM Start frontend
call :print_info "Starting frontend server..."
cd frontend
start "Trading Post Frontend" cmd /k "npm run dev"
cd ..

call :print_success "Application started!"
call :print_info "Backend running at: http://localhost:3002"
call :print_info "Frontend running at: http://localhost:3000"
call :print_info "API documentation at: http://localhost:3002/docs"
goto :eof

:stop_all
call :print_info "Stopping all services..."

REM Check which docker compose command to use
docker compose version >nul 2>nul
if errorlevel 1 (
    docker-compose down
) else (
    docker compose down
)

REM Kill running processes
taskkill /F /FI "WINDOWTITLE eq Trading Post Backend*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq Trading Post Frontend*" >nul 2>nul

call :print_success "All services stopped!"
goto :eof

:run_migrations
cd backend
call venv\Scripts\activate.bat
alembic upgrade head
cd ..
call :print_success "Migrations completed!"
goto :eof

:show_menu
echo.
echo Trading Post Setup Script
echo ========================
echo 1. Full setup (first time)
echo 2. Start all services
echo 3. Stop all services
echo 4. Setup backend only
echo 5. Setup frontend only
echo 6. Run migrations
echo 7. Exit
echo.
goto :eof

:process_choice
if "%~1"=="1" (
    call :check_prerequisites
    if not errorlevel 1 (
        call :setup_environment
        call :setup_backend
        call :setup_frontend
        call :start_services
        call :start_application
    )
) else if "%~1"=="2" (
    call :start_services
    call :start_application
) else if "%~1"=="3" (
    call :stop_all
) else if "%~1"=="4" (
    call :setup_backend
) else if "%~1"=="5" (
    call :setup_frontend
) else if "%~1"=="6" (
    call :run_migrations
) else if "%~1"=="7" (
    call :print_info "Exiting..."
    exit /b 0
) else (
    call :print_error "Invalid choice!"
)
goto :eof

:main
REM Process command line arguments
if "%~1"=="" goto :interactive

if "%~1"=="setup" (
    call :check_prerequisites
    if not errorlevel 1 (
        call :setup_environment
        call :setup_backend
        call :setup_frontend
    )
) else if "%~1"=="start" (
    call :start_services
    call :start_application
) else if "%~1"=="stop" (
    call :stop_all
) else if "%~1"=="help" (
    echo Usage: setup.bat [command]
    echo Commands:
    echo   setup  - Run full setup
    echo   start  - Start all services
    echo   stop   - Stop all services
    echo   help   - Show this help
    echo.
    echo Run without arguments for interactive menu
) else (
    call :print_error "Unknown command: %~1"
    echo Run 'setup.bat help' for usage
    exit /b 1
)
exit /b 0

:interactive
call :show_menu
set /p choice="Enter your choice (1-7): "
call :process_choice %choice%

if not "%choice%"=="7" (
    echo.
    pause
    goto :interactive
)
exit /b 0