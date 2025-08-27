#!/bin/bash

echo "Starting Trading Post with SSO Integration..."
echo ""

# Load environment variables
if [ -f ".env.appwrite.$1" ]; then
    echo "Loading environment: $1"
    cp .env.appwrite.$1 .env
else
    echo "Loading development environment"
    cp .env.appwrite.development .env
fi

# Start backend
echo "Starting backend server..."
python app_with_sso.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend application..."
cd trading-app-frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "Trading Post SSO is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
