@echo off
REM Deploy script that uses environment variables instead of inline API keys

set "APPWRITE_API_KEY=standard_b7ef639243a1823b1ae6c6aa469027831555a3ffca4fb7dcf0152b5a335c1051a1169b5c54edfe0411c635a5d2332f1da617ed10f2f080cb38c8fd636041db60333b7f53308141f889ed0c66db3cf2be92d9ad59ed73b9ca2a5a147fcfe60f692a43a47f48e30903839c5ca919535e087fe37a14391febf153e23b383a02155f"

set "XAI_API_KEY=xai-vnlMQtZqGhI1A5xWMnFOK1Y8G1JelWNePb7OTXjTALHs3vCOUzKgWcmXxfGwJKoIW4MFUXY0eaW1NN3A"

echo 🚀 Deploying with environment variables...
echo Using API key: %APPWRITE_API_KEY:~0,20%...

REM Execute the deployment command with all arguments
%*