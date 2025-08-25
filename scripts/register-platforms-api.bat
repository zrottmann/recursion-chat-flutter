@echo off
echo ========================================
echo  Trading Post OAuth Platform Registration
echo ========================================
echo.

set APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
set PROJECT_ID=689bdee000098bd9d55c
set API_KEY=standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc

echo 📋 Configuration:
echo Project ID: %PROJECT_ID%
echo Endpoint: %APPWRITE_ENDPOINT%
echo.

echo 🔍 Listing existing platforms...
curl -X GET "%APPWRITE_ENDPOINT%/projects/%PROJECT_ID%/platforms" ^
  -H "X-Appwrite-Project: %PROJECT_ID%" ^
  -H "X-Appwrite-Key: %API_KEY%" ^
  -H "Content-Type: application/json"
echo.
echo.

echo 🚀 Registering tradingpost.appwrite.network...
curl -X POST "%APPWRITE_ENDPOINT%/projects/%PROJECT_ID%/platforms" ^
  -H "X-Appwrite-Project: %PROJECT_ID%" ^
  -H "X-Appwrite-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"web\",\"name\":\"Trading Post - Main\",\"hostname\":\"tradingpost.appwrite.network\"}"
echo.
echo.

echo 🚀 Registering backup domain...
curl -X POST "%APPWRITE_ENDPOINT%/projects/%PROJECT_ID%/platforms" ^
  -H "X-Appwrite-Project: %PROJECT_ID%" ^
  -H "X-Appwrite-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"web\",\"name\":\"Trading Post - Global\",\"hostname\":\"689cb415001a367e69f8.appwrite.global\"}"
echo.
echo.

echo 🚀 Registering localhost for development...
curl -X POST "%APPWRITE_ENDPOINT%/projects/%PROJECT_ID%/platforms" ^
  -H "X-Appwrite-Project: %PROJECT_ID%" ^
  -H "X-Appwrite-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"web\",\"name\":\"Trading Post - Local\",\"hostname\":\"localhost\"}"
echo.
echo.

echo ✅ Platform registration complete!
echo.
echo 🎯 Test OAuth now at: https://tradingpost.appwrite.network
echo.
pause