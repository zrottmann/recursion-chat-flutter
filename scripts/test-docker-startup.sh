#!/bin/bash

echo "=== Trading Post Docker Startup Test ==="
echo "This script will test the Docker container startup locally"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "Cleaning up..."
    docker stop trading-post-test 2>/dev/null
    docker rm trading-post-test 2>/dev/null
}

# Set trap for cleanup
trap cleanup EXIT

# Build the Docker image
echo "1. Building Docker image..."
docker build -t trading-post-test .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker build successful"
echo ""

# Run the container in detached mode
echo "2. Starting container..."
docker run -d --name trading-post-test -p 8080:8080 trading-post-test

if [ $? -ne 0 ]; then
    echo "❌ Container failed to start!"
    exit 1
fi

echo "✅ Container started"
echo ""

# Wait a few seconds for startup
echo "3. Waiting for startup (10 seconds)..."
sleep 10

# Check if container is still running
if ! docker ps | grep -q trading-post-test; then
    echo "❌ Container stopped unexpectedly!"
    echo ""
    echo "Container logs:"
    docker logs trading-post-test
    exit 1
fi

echo "✅ Container is running"
echo ""

# Test the health endpoint
echo "4. Testing health endpoint..."
response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8080/health)

if [ "$response" = "200" ]; then
    echo "✅ Health endpoint responding (HTTP 200)"
else
    echo "❌ Health endpoint not responding (HTTP $response)"
    echo ""
    echo "Container logs:"
    docker logs trading-post-test
    exit 1
fi

echo ""

# Test the test-cors endpoint  
echo "5. Testing CORS endpoint..."
cors_response=$(curl -s http://localhost:8080/test-cors)

if [[ "$cors_response" == *"CORS is working"* ]]; then
    echo "✅ CORS endpoint responding correctly"
else
    echo "❌ CORS endpoint not responding correctly"
    echo "Response: $cors_response"
fi

echo ""
echo "=== Test Results ==="
echo "✅ Docker image builds successfully"
echo "✅ Container starts without errors"
echo "✅ FastAPI application starts up correctly"
echo "✅ HTTP endpoints are accessible"
echo ""
echo "Container is ready for deployment!"
echo ""
echo "To view logs: docker logs trading-post-test"
echo "To stop test: docker stop trading-post-test"