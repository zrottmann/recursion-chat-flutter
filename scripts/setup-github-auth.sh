#!/bin/bash

# GitHub Authentication Setup Script for Trading Post
# This script provides multiple methods to authenticate with GitHub

echo "🚀 Trading Post - GitHub Authentication Setup"
echo "=============================================="
echo ""

# Check current status
echo "📊 Current Status:"
echo "Commits ready to push: $(git rev-list --count origin/main..HEAD)"
git log --oneline origin/main..HEAD
echo ""

echo "📋 Choose your authentication method:"
echo ""

echo "🔑 METHOD 1: Personal Access Token (Recommended)"
echo "-----------------------------------------------"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Select scopes: 'repo' (full repository access)"
echo "4. Copy the generated token"
echo "5. Run this command (replace YOUR_TOKEN):"
echo ""
echo "   git remote set-url origin https://zrottmann:YOUR_TOKEN@github.com/zrottmann/tradingpost.git"
echo "   git push origin main"
echo ""

echo "🔐 METHOD 2: SSH Key"
echo "-------------------"
echo "If you have SSH keys configured:"
echo "1. Run: git remote set-url origin git@github.com:zrottmann/tradingpost.git"
echo "2. Run: git push origin main"
echo ""

echo "🛠️ METHOD 3: GitHub CLI (if installed)"
echo "--------------------------------------"
echo "1. Install GitHub CLI: https://cli.github.com/"
echo "2. Run: gh auth login"
echo "3. Follow the prompts to authenticate"
echo "4. Run: git push origin main"
echo ""

echo "⚡ METHOD 4: One-time Push (Quick Fix)"
echo "-------------------------------------"
echo "If you just want to push once and have a Personal Access Token:"
echo ""
echo "   git push https://zrottmann:YOUR_TOKEN@github.com/zrottmann/tradingpost.git main"
echo ""

echo "🎯 WHAT WILL BE PUSHED:"
echo "======================="
echo "📦 Commit 1: Trading Post v2.0 with AI-powered features"
echo "   - Real OpenAI Vision API integration"
echo "   - Real-time chat system with AppWrite"
echo "   - Advanced user profiles and reviews"
echo "   - Performance optimizations"
echo "   - Complete OAuth integration"
echo ""
echo "📦 Commit 2: OAuth and Appwrite configuration updates"
echo "   - Production-ready configuration"
echo "   - Optimized callback URLs"
echo "   - Environment variable fixes"
echo ""

echo "🏁 After successful authentication, run:"
echo "   git push origin main"
echo ""
echo "✅ This will push both commits to the main branch on GitHub!"