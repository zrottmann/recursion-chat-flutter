#!/bin/bash

echo "🚀 Installing Easy Appwrite SSO..."
echo

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Make installer executable
chmod +x install-easy-appwrite-sso.js

# Run the installer
echo "📦 Running installer..."
node install-easy-appwrite-sso.js

echo
echo "✅ Installation complete!"
echo
echo "📚 Next steps:"
echo "   1. Update your .env file with Appwrite project ID"
echo "   2. Configure OAuth providers in Appwrite Console"
echo "   3. Check examples/ directory for usage examples"
echo