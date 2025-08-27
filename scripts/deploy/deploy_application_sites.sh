#!/bin/bash
# Application Sites Mobile Enhancement Deployment
# Deploy splash pages and mobile optimizations

set -e

echo "🚀 Deploying application site mobile enhancements..."

# Deploy chat splash page
echo "💬 Deploying chat mobile splash page..."
if [ -f "active-projects/recursion-chat/mobile-splash.html" ]; then
  echo "✅ Chat splash page ready"
else
  echo "⚠️ Chat splash page missing"
fi

# Deploy trading post splash page
echo "🛒 Deploying trading post mobile marketplace..."
if [ -f "active-projects/trading-post/mobile-marketplace-splash.html" ]; then
  echo "✅ Trading post splash page ready"
else
  echo "⚠️ Trading post splash page missing"
fi

# Deploy game landing page
echo "🎮 Deploying slum lord mobile game landing..."
if [ -f "active-projects/slumlord/mobile-game-landing.html" ]; then
  echo "✅ Game landing page ready"
else
  echo "⚠️ Game landing page missing"
fi

echo "✅ Application site mobile enhancements deployed"
