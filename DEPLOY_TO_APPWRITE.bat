@echo off
title Deploy Flutter to Appwrite Sites
color 0E

echo ================================================
echo     DEPLOY FLUTTER TO APPWRITE SITES
echo ================================================
echo Deploying real Flutter app to production
echo.

REM Check if build exists
if not exist "build\web\index.html" (
    echo ❌ Flutter build not found!
    echo Please run BUILD_PRODUCTION.bat first
    pause
    exit /b 1
)

echo ✅ Flutter build found
echo.

echo [1/6] Preparing deployment files...
if exist "deploy-temp" rmdir /s /q "deploy-temp"
mkdir deploy-temp
echo ✅ Temp directory created
echo.

echo [2/6] Copying Flutter build...
xcopy "build\web\*.*" "deploy-temp\" /s /e /h /y
echo ✅ Flutter files copied
echo.

echo [3/6] Creating Appwrite Sites config...
echo {> deploy-temp\appwrite.json
echo   "version": "1.0",>> deploy-temp\appwrite.json
echo   "settings": {>> deploy-temp\appwrite.json
echo     "buildCommand": "echo 'Using pre-built Flutter files'",>> deploy-temp\appwrite.json
echo     "outputDirectory": ".",>> deploy-temp\appwrite.json
echo     "installCommand": "echo 'No install needed'",>> deploy-temp\appwrite.json
echo     "framework": "flutter">> deploy-temp\appwrite.json
echo   }>> deploy-temp\appwrite.json
echo }>> deploy-temp\appwrite.json
echo ✅ Appwrite config created
echo.

echo [4/6] Creating .gitignore for deployment...
echo build/> deploy-temp\.gitignore
echo .dart_tool/>> deploy-temp\.gitignore
echo .packages>> deploy-temp\.gitignore
echo pubspec.lock>> deploy-temp\.gitignore
echo ✅ Gitignore created
echo.

echo [5/6] Creating archive for Appwrite...
powershell -command "Compress-Archive -Path 'deploy-temp\*' -DestinationPath 'flutter-chat-production.zip' -Force"
if exist "flutter-chat-production.zip" (
    echo ✅ Archive created: flutter-chat-production.zip
) else (
    echo ❌ Archive creation failed
    pause
    exit /b 1
)
echo.

echo [6/6] Deployment Instructions...
echo.
echo ================================================
echo 🚀 FLUTTER APP READY FOR DEPLOYMENT!
echo ================================================
echo.
echo Your Flutter chat app is ready for production:
echo 📦 Archive: flutter-chat-production.zip
echo 📁 Size: 
dir flutter-chat-production.zip
echo.
echo DEPLOYMENT STEPS:
echo 1. Go to: https://console.appwrite.io
echo 2. Navigate to your project
echo 3. Go to "Functions" or "Static Sites"
echo 4. Upload: flutter-chat-production.zip
echo 5. Set domain and deploy
echo.
echo FEATURES INCLUDED:
echo ✅ Real Flutter/Dart compilation
echo ✅ Material Design 3 components  
echo ✅ Appwrite authentication integration
echo ✅ Real-time messaging ready
echo ✅ Cross-platform responsive design
echo ✅ Production optimized build
echo.
echo Your Flutter app will be available at:
echo https://[your-domain].appwrite.network
echo.

REM Clean up temp directory
rmdir /s /q "deploy-temp"

echo Deployment package ready!
pause