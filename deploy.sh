#!/bin/bash

# Deploy script for Recursion Chat Flutter to Appwrite

echo "🚀 Starting deployment process..."

# Build Flutter web app
echo "📦 Building Flutter web app..."
flutter build web --release --web-renderer canvaskit

# Check if build was successful
if [ ! -d "build/web" ]; then
    echo "❌ Build failed - build/web directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create deployment package
echo "📋 Creating deployment package..."

# Copy necessary files for static hosting
cd build/web

# Create a simple deployment manifest
cat > deployment.json << EOF
{
  "name": "recursion-chat-flutter",
  "version": "1.0.0",
  "type": "static",
  "framework": "flutter",
  "buildCommand": "flutter build web",
  "outputDirectory": "build/web"
}
EOF

echo "🌐 Deployment package ready"
echo ""
echo "📤 To deploy to Appwrite:"
echo "1. Go to your Appwrite Console"
echo "2. Navigate to Functions or Hosting"
echo "3. Upload the contents of build/web/"
echo "4. Set index.html as the entry point"
echo ""
echo "✨ Deployment preparation complete!"