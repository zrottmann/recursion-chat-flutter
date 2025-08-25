#!/bin/bash

# GitHub Push Script for Trading Post
# This script helps configure authentication and push changes to GitHub

echo "=== Trading Post GitHub Push Helper ==="
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "Error: Not in a git repository!"
    exit 1
fi

echo "Current repository status:"
git status --short
echo ""
echo "Commits ready to push:"
git log --oneline origin/main..HEAD
echo ""

# Method 1: Try with existing credentials
echo "Attempting to push with current configuration..."
if git push origin main 2>/dev/null; then
    echo "✅ Push successful!"
    exit 0
fi

echo "❌ Push failed - authentication required"
echo ""
echo "To complete the push, you have several options:"
echo ""
echo "1. **Personal Access Token (Recommended):**"
echo "   - Go to: https://github.com/settings/tokens"
echo "   - Create a new token with 'repo' permissions"
echo "   - Run: git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/zrottmann/tradingpost.git"
echo "   - Then run: git push origin main"
echo ""
echo "2. **SSH Key (if you have one):**"
echo "   - Run: git remote set-url origin git@github.com:zrottmann/tradingpost.git"
echo "   - Then run: git push origin main"
echo ""
echo "3. **GitHub CLI:**"
echo "   - Install gh: https://cli.github.com/"
echo "   - Run: gh auth login"
echo "   - Then run: git push origin main"
echo ""

# Try to provide helpful information about the commit
echo "Commit to be pushed:"
echo "==================="
git show --stat HEAD