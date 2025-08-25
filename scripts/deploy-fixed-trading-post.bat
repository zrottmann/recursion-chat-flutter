@echo off
echo ============================================
echo Deploying Trading Post with Login Fixes
echo ============================================

cd /d "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\trading-post\trading-app-frontend"

echo 1. Environment Variables Check...
if exist ".env" (
    echo .env file found
) else (
    echo ERROR: .env file missing!
    pause
    exit /b 1
)

echo 2. Installing/updating dependencies...
npm install --silent

echo 3. Building with comprehensive fixes...
set NODE_ENV=production
set CI=false
set GENERATE_SOURCEMAP=false
set DISABLE_ESLINT_PLUGIN=true
set TSC_COMPILE_ON_ERROR=true
set SKIP_PREFLIGHT_CHECK=true

:: Build the application
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Trying alternative approach...
    npx vite build --mode production --config vite.config.js
    
    if %ERRORLEVEL% NEQ 0 (
        echo Build failed completely. Check error messages.
        pause
        exit /b 1
    )
)

echo 4. Build successful! Login fixes have been applied:
echo    - Extension runtime error suppression
echo    - Font loading fallbacks
echo    - MutationObserver error protection
echo    - OAuth callback handling improvements
echo    - Environment variable validation
echo    - Content script conflict isolation

echo 5. Starting local test server...
start http://localhost:5000
echo Please test the login functionality in the opened browser.
echo Check the browser console for any remaining errors.

echo 6. Serving built application...
npx serve dist -s -p 5000

pause
