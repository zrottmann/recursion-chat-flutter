#!/bin/bash

# Trading Post Setup and Run Script
# This script sets up and runs the Trading Post application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("Docker Compose")
    fi
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists python3 && ! command_exists python; then
        missing_deps+=("Python 3")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_info "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Function to setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning ".env file created from .env.example - please update with your values"
        else
            print_error ".env.example file not found!"
            exit 1
        fi
    else
        print_info ".env file already exists"
    fi
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    
    print_success "Environment setup complete!"
}

# Function to setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    if [ ! -d "backend/venv" ]; then
        print_info "Creating Python virtual environment..."
        cd backend
        python3 -m venv venv || python -m venv venv
        
        # Activate virtual environment
        if [ "$IS_WINDOWS" = true ]; then
            source venv/Scripts/activate
        else
            source venv/bin/activate
        fi
        
        print_info "Installing Python dependencies..."
        pip install --upgrade pip
        pip install -r requirements.txt
        
        cd ..
        print_success "Backend setup complete!"
    else
        print_info "Backend virtual environment already exists"
    fi
}

# Function to setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    else
        print_info "Frontend dependencies already installed"
    fi
    
    cd ..
    print_success "Frontend setup complete!"
}

# Function to start services
start_services() {
    print_info "Starting services..."
    
    # Check which docker compose command to use
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    
    # Start infrastructure services
    print_info "Starting infrastructure services (PostgreSQL, Redis)..."
    $DOCKER_COMPOSE up -d postgres redis
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 5
    
    # Run database migrations
    print_info "Running database migrations..."
    cd backend
    if [ "$IS_WINDOWS" = true ]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    alembic upgrade head
    cd ..
    
    print_success "Services started successfully!"
}

# Function to start application
start_application() {
    print_info "Starting Trading Post application..."
    
    # Start backend
    print_info "Starting backend server..."
    cd backend
    if [ "$IS_WINDOWS" = true ]; then
        source venv/Scripts/activate
        start //B uvicorn app.main:app --host 0.0.0.0 --port 3002 --reload
    else
        source venv/bin/activate
        uvicorn app.main:app --host 0.0.0.0 --port 3002 --reload &
        BACKEND_PID=$!
    fi
    cd ..
    
    # Start frontend
    print_info "Starting frontend server..."
    cd frontend
    if [ "$IS_WINDOWS" = true ]; then
        start //B npm run dev
    else
        npm run dev &
        FRONTEND_PID=$!
    fi
    cd ..
    
    print_success "Application started!"
    print_info "Backend running at: http://localhost:3002"
    print_info "Frontend running at: http://localhost:3000"
    print_info "API documentation at: http://localhost:3002/docs"
    
    # Keep script running
    if [ "$IS_WINDOWS" = false ]; then
        print_info "Press Ctrl+C to stop all services"
        trap "kill $BACKEND_PID $FRONTEND_PID; docker compose down" EXIT
        wait
    fi
}

# Function to stop all services
stop_all() {
    print_info "Stopping all services..."
    
    if docker compose version >/dev/null 2>&1; then
        docker compose down
    else
        docker-compose down
    fi
    
    # Kill any running processes
    if [ "$IS_WINDOWS" = false ]; then
        pkill -f "uvicorn" || true
        pkill -f "npm run dev" || true
    fi
    
    print_success "All services stopped!"
}

# Main menu
show_menu() {
    echo ""
    echo "Trading Post Setup Script"
    echo "========================"
    echo "1. Full setup (first time)"
    echo "2. Start all services"
    echo "3. Stop all services"
    echo "4. Setup backend only"
    echo "5. Setup frontend only"
    echo "6. Run migrations"
    echo "7. Exit"
    echo ""
}

# Process menu choice
process_choice() {
    case $1 in
        1)
            check_prerequisites
            setup_environment
            setup_backend
            setup_frontend
            start_services
            start_application
            ;;
        2)
            start_services
            start_application
            ;;
        3)
            stop_all
            ;;
        4)
            setup_backend
            ;;
        5)
            setup_frontend
            ;;
        6)
            cd backend
            if [ "$IS_WINDOWS" = true ]; then
                source venv/Scripts/activate
            else
                source venv/bin/activate
            fi
            alembic upgrade head
            cd ..
            print_success "Migrations completed!"
            ;;
        7)
            print_info "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice!"
            ;;
    esac
}

# Main execution
main() {
    # If no arguments, show menu
    if [ $# -eq 0 ]; then
        while true; do
            show_menu
            read -p "Enter your choice (1-7): " choice
            process_choice $choice
            
            if [ "$choice" != "7" ]; then
                echo ""
                read -p "Press Enter to continue..."
            fi
        done
    else
        # Process command line arguments
        case $1 in
            setup)
                check_prerequisites
                setup_environment
                setup_backend
                setup_frontend
                ;;
            start)
                start_services
                start_application
                ;;
            stop)
                stop_all
                ;;
            help)
                echo "Usage: ./setup.sh [command]"
                echo "Commands:"
                echo "  setup  - Run full setup"
                echo "  start  - Start all services"
                echo "  stop   - Stop all services"
                echo "  help   - Show this help"
                echo ""
                echo "Run without arguments for interactive menu"
                ;;
            *)
                print_error "Unknown command: $1"
                echo "Run './setup.sh help' for usage"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"