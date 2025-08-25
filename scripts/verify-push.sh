#!/bin/bash

# Verify GitHub Push Script for Trading Post
echo "🔍 Verifying GitHub Push Status"
echo "==============================="
echo ""

# Check if we're up to date with remote
echo "📡 Fetching latest from GitHub..."
git fetch origin 2>/dev/null

echo ""
echo "📊 Local vs Remote Status:"
LOCAL_COMMITS=$(git rev-list --count HEAD)
REMOTE_COMMITS=$(git rev-list --count origin/main 2>/dev/null || echo "0")

echo "Local commits: $LOCAL_COMMITS"
echo "Remote commits: $REMOTE_COMMITS"
echo ""

if [ "$LOCAL_COMMITS" -eq "$REMOTE_COMMITS" ]; then
    echo "✅ SUCCESS: All commits have been pushed to GitHub!"
    echo ""
    echo "🎉 Trading Post v2.0 is now live on GitHub!"
    echo ""
    echo "📋 What was pushed:"
    echo "• Complete AI-powered features"
    echo "• Real-time chat system"
    echo "• Advanced user profiles"
    echo "• OAuth integration"
    echo "• Performance optimizations"
    echo "• Production configuration"
    echo ""
    echo "🌐 View on GitHub: https://github.com/zrottmann/tradingpost"
elif [ "$LOCAL_COMMITS" -gt "$REMOTE_COMMITS" ]; then
    AHEAD_BY=$((LOCAL_COMMITS - REMOTE_COMMITS))
    echo "⚠️  You are still $AHEAD_BY commits ahead of the remote."
    echo "❌ Push was not successful or incomplete."
    echo ""
    echo "💡 Try running the authentication setup again:"
    echo "   ./setup-github-auth.sh"
else
    echo "ℹ️  Remote has more commits than local."
    echo "💡 You may need to pull first: git pull origin main"
fi

echo ""
echo "🔗 Recent commits on this branch:"
git log --oneline -5