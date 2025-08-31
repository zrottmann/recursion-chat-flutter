#!/bin/bash

# Flutter Web Production Build & Deploy Script
# Usage: ./build-deploy.sh

echo "🚀 Starting Flutter Web Production Build..."

# 1. Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# 2. Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# 3. Run tests (optional - uncomment if you have tests)
# echo "🧪 Running tests..."
# flutter test

# 4. Build for production with optimizations
echo "🔨 Building for production..."
flutter build web --release \
  --web-renderer auto \
  --tree-shake-icons \
  --dart2js-optimization O4

# 5. Check build size
echo "📊 Build complete! Size:"
du -sh build/web/

# 6. Optional: Serve locally for testing
echo "✅ Build successful!"
echo ""
echo "To test locally, run:"
echo "  cd build/web && python -m http.server 8000"
echo ""
echo "To deploy:"
echo "  1. The build/web folder is ready for deployment"
echo "  2. For Appwrite: Deploy contents of build/web/"
echo "  3. For GitHub Pages: Copy build/web to docs/ folder"

# 7. Git commit and push (optional - uncomment to auto-deploy)
# echo "📤 Deploying to GitHub..."
# git add .
# git commit -m "Production build $(date +%Y-%m-%d)"
# git push origin master

echo "✨ Done!"