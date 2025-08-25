@echo off
echo 🚀 Building Trading Post Frontend for Appwrite Site: 689bdee000098bd9d55c

cd trading-app-frontend

echo 📦 Installing dependencies...
call npm install --legacy-peer-deps

echo 🔧 Setting environment variables...
set NODE_ENV=production
set REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
set REACT_APP_APPWRITE_PROJECT_ID=689bdee000098bd9d55c
set REACT_APP_APPWRITE_PROJECT_NAME=Trading Post Frontend
set VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
set VITE_APPWRITE_PROJECT_ID=689bdee000098bd9d55c
set REACT_APP_APPWRITE_DATABASE_ID=trading_post_db
set REACT_APP_APPWRITE_USERS_COLLECTION_ID=users
set REACT_APP_APPWRITE_ITEMS_COLLECTION_ID=items
set REACT_APP_APPWRITE_WANTS_COLLECTION_ID=wants
set REACT_APP_APPWRITE_TRADES_COLLECTION_ID=trades
set REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID=messages
set REACT_APP_APPWRITE_REVIEWS_COLLECTION_ID=reviews
set REACT_APP_APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications
set REACT_APP_APPWRITE_ITEM_IMAGES_BUCKET_ID=item_images
set REACT_APP_APPWRITE_PROFILE_IMAGES_BUCKET_ID=profile_images
set REACT_APP_APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID=chat_attachments
set REACT_APP_ENVIRONMENT=production
set REACT_APP_ENABLE_SSO=true
set REACT_APP_ENABLE_OAUTH=true
set REACT_APP_ENABLE_EMAIL_AUTH=true
set REACT_APP_OAUTH_PROVIDERS=google,github,facebook
set REACT_APP_ENABLE_ANALYTICS=false

echo 🔨 Building frontend application...
call npm run build

echo ✅ Build completed! Files are in the build/ directory
echo 📋 Build Summary:
echo    • Project ID: 689bdee000098bd9d55c
echo    • Build output: trading-app-frontend/build
echo    • Ready for deployment to Appwrite or static hosting

pause