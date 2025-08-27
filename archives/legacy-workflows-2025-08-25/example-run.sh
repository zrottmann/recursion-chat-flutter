#!/bin/bash

# Slumlord ARPG Mobile Testing - Example Run Script
# This script demonstrates how to run the comprehensive mobile testing suite

echo "🎮 Slumlord ARPG - Mobile Testing Suite Example"
echo "=============================================="

# Set target URL (change this to test different environments)
export SLUMLORD_URL="https://slumlord.appwrite.network"

# For local development testing:
# export SLUMLORD_URL="http://localhost:5173"

echo "📱 Target URL: $SLUMLORD_URL"

# Step 1: Install Playwright browsers if not already installed
echo
echo "📦 Installing Playwright browsers..."
npx playwright install

# Step 2: Run comprehensive mobile test suite
echo
echo "🧪 Running comprehensive mobile testing suite..."
node run-mobile-tests.js

# Alternative: Run individual test suites

# Quick mobile browser tests only
# echo "🚀 Running quick mobile browser tests..."
# npm run test:mobile

# Performance testing only  
# echo "⚡ Running mobile performance tests..."
# npm run test:performance

# Network quality tests only
# echo "📡 Running network quality tests..."
# npm run test:network

# Load testing with Artillery (requires server to be running)
# echo "🔥 Running load tests..."
# npm run test:load

echo
echo "✅ Mobile testing complete!"
echo "📊 Check test-results/ directory for detailed reports"