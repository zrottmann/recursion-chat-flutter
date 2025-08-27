@echo off
REM Deploy Claude Code UI autonomously using environment variables

echo 🚀 Deploying Claude Code UI with environment variables...

REM Set API keys in environment
set "APPWRITE_API_KEY=standard_4fadd51190ea60370285354446b31c373c1cb6dd93fab443581842359482471f2f0a75b7320c8a3e5fbaff9405c0e96eb28c6b464edae660ffc292aea5716f3d4f984481a3419c7d7efb24ef474ed0e737186d9ea0a1f8404a81689b0d41736cf9d090abd0d692e7fbdbf281c5af643bc7514f5b4b52242a39e6ec76b9cfc27b"

echo Using API key: %APPWRITE_API_KEY:~0,20%...

REM Execute the deployment script
node deploy-claude-ui.cjs