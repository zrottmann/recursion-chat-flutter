#!/bin/bash

# Flutter Recursion Chat - Build and Deploy Script
echo "🚀 Building Flutter Recursion Chat App..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# Get dependencies
echo "📦 Getting Flutter dependencies..."
flutter pub get

# Build for web with optimizations
echo "🏗️ Building for web production..."
flutter build web --release --web-renderer canvaskit --base-href /

# Check if build was successful
if [ -d "build/web" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Build output location: build/web/"
    echo ""
    echo "🌐 Deployment options:"
    echo "1. Upload build/web/ contents to Appwrite Sites"
    echo "2. Deploy to Firebase Hosting: firebase deploy"
    echo "3. Deploy to Netlify: drag build/web/ folder to Netlify"
    echo "4. Deploy to Vercel: vercel --prod build/web/"
    echo ""
    echo "📝 Don't forget to:"
    echo "- Configure Appwrite project ID in lib/services/appwrite_service.dart" 
    echo "- Set up Appwrite collections (users, rooms, messages)"
    echo "- Configure CORS settings in Appwrite Console"
    echo ""
    echo "🎉 Flutter app ready for deployment!"
else
    echo "❌ Build failed!"
    echo "Please check the errors above and try again."
    exit 1
fi