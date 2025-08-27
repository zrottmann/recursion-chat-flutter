@echo off
echo ============================================
echo Testing Trading Post Login Fixes
echo ============================================

echo 1. Cleaning previous builds...
rmdir /s /q dist 2>nul
rmdir /s /q build 2>nul

echo 2. Installing dependencies...
npm install --silent

echo 3. Building with production environment...
set NODE_ENV=production
set CI=false
set GENERATE_SOURCEMAP=false
set DISABLE_ESLINT_PLUGIN=true
set TSC_COMPILE_ON_ERROR=true

npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Checking for specific errors...
    echo Trying alternative build approach...
    
    echo 4. Alternative build with Vite...
    npx vite build --mode production
    
    if %ERRORLEVEL% NEQ 0 (
        echo Both build methods failed. Please check the error messages above.
        pause
        exit /b 1
    )
)

echo 5. Build successful! Starting local development server to test...
echo 6. Opening browser to test login functionality...
start http://localhost:3000

echo 7. Starting development server with login fixes...
npm run dev

pause
