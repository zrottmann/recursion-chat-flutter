@echo off
echo Trading Post Frontend Deployment Script
echo ========================================

echo Step 1: Building the application...
npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo Choose your deployment option:
echo 1. Netlify
echo 2. Vercel
echo 3. Manual deployment (serve locally for testing)
echo.
set /p choice=Enter your choice (1-3): 

if "%choice%"=="1" goto netlify
if "%choice%"=="2" goto vercel
if "%choice%"=="3" goto serve

echo Invalid choice!
pause
exit /b 1

:netlify
echo.
echo Deploying to Netlify...
echo Please make sure you're logged in to Netlify CLI
echo Run: netlify login (if not already logged in)
echo.
netlify deploy --prod --dir=build
if %errorlevel% neq 0 (
    echo Netlify deployment failed!
    echo Make sure you have Netlify CLI installed: npm install -g netlify-cli
    echo And that you're logged in: netlify login
)
goto end

:vercel
echo.
echo Deploying to Vercel...
echo Please make sure you're logged in to Vercel CLI
echo Run: vercel login (if not already logged in)
echo.
vercel --prod
if %errorlevel% neq 0 (
    echo Vercel deployment failed!
    echo Make sure you're logged in: vercel login
)
goto end

:serve
echo.
echo Serving the application locally for testing...
echo The app will be available at http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
npx serve -s build -l 3000
goto end

:end
echo.
echo Deployment script completed.
echo Don't forget to:
echo 1. Update OAuth callback URLs in AppWrite console
echo 2. Update CORS settings in AppWrite console
echo 3. Test the deployed application
echo.
pause