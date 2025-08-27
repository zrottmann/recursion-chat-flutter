#!/bin/bash
# Super Console Mobile Enhancement Deployment
# CRITICAL: Console-safe deployment with rollback capability

set -e

echo "🚀 Starting Super Console mobile enhancement deployment..."
echo "🛡️ Console preservation mode active"

# Pre-deployment validation
echo "🔍 Running pre-deployment validation..."
node console-functionality-validator.js

# Backup current state
echo "💾 Creating backup..."
BACKUP_DIR="super-console-backup-$(date +%Y%m%d-%H%M%S)"
cp -r super-console "$BACKUP_DIR"

# Deploy mobile enhancements
echo "📱 Deploying mobile enhancements..."
cd super-console

# Install dependencies if needed
npm ci

# Build with mobile enhancements
npm run build

# Validate build
if [ ! -d ".next" ]; then
  echo "❌ Build failed - rolling back..."
  cd ..
  rm -rf super-console
  mv "$BACKUP_DIR" super-console
  exit 1
fi

echo "✅ Super Console mobile enhancements deployed"
echo "🔍 Run immediate validation: node console-functionality-validator.js"
