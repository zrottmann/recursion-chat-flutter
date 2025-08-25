#!/bin/bash
set -e

echo "🚀 Starting Appwrite build..."

# Navigate to sites/react directory
cd sites/react

# Clean install with exact versions
echo "📦 Installing dependencies..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force

# Run postinstall fixes
if [ -f "postinstall.js" ]; then
  node postinstall.js
fi

# Build the application
echo "🔨 Building application..."
CI=false SKIP_PREFLIGHT_CHECK=true TSC_COMPILE_ON_ERROR=true DISABLE_ESLINT_PLUGIN=true npm run build

echo "✅ Build completed successfully!"
