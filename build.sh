#!/bin/bash

# Flutter Web Build Script for Appwrite Sites
echo "🚀 Building Flutter Recursion Chat for Appwrite Sites..."

# Install Flutter if not available
if ! command -v flutter &> /dev/null; then
    echo "📥 Installing Flutter..."
    
    # Download Flutter SDK
    wget -q https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.32.8-stable.tar.xz
    tar xf flutter_linux_3.32.8-stable.tar.xz
    export PATH="$PATH:$(pwd)/flutter/bin"
    
    # Configure Flutter for web
    flutter config --enable-web
    flutter precache --web
else
    echo "✅ Flutter already installed"
fi

# Verify Flutter installation
echo "🔍 Verifying Flutter..."
flutter --version
flutter doctor --android-licenses || true

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# Get dependencies
echo "📦 Getting Flutter dependencies..."
flutter pub get

# Build for web production
echo "🏗️ Building Flutter web app..."
flutter build web \
    --release \
    --web-renderer canvaskit \
    --base-href / \
    --dart-define=FLUTTER_WEB_USE_SKIA=true

# Verify build output
if [ -d "build/web" ]; then
    echo "✅ Flutter build successful!"
    echo "📁 Build output: build/web/"
    ls -la build/web/
else
    echo "❌ Flutter build failed!"
    exit 1
fi

echo "🎉 Flutter Recursion Chat build complete!"