@echo off
echo Setting environment variables for Claude Code sessions...

set "APPWRITE_API_KEY=standard_b7ef639243a1823b1ae6c6aa469027831555a3ffca4fb7dcf0152b5a335c1051a1169b5c54edfe0411c635a5d2332f1da617ed10f2f080cb38c8fd636041db60333b7f53308141f889ed0c66db3cf2be92d9ad59ed73b9ca2a5a147fcfe60f692a43a47f48e30903839c5ca919535e087fe37a14391febf153e23b383a02155f"

set "XAI_API_KEY=xai-vnlMQtZqGhI1A5xWMnFOK1Y8G1JelWNePb7OTXjTALHs3vCOUzKgWcmXxfGwJKoIW4MFUXY0eaW1NN3A"

echo Environment variables set successfully!
echo APPWRITE_API_KEY: %APPWRITE_API_KEY:~0,20%...
echo XAI_API_KEY: %XAI_API_KEY:~0,20%...

echo.
echo Now you can use commands like:
echo cd "path" ^&^& node deploy.js
echo.
echo Without needing inline API keys!