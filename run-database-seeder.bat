@echo off
echo.
echo ================================================================
echo  Trading Post Database Seeder - Test Data Creation
echo ================================================================
echo.
echo This script will help you create comprehensive test data for the
echo Trading Post application using the new Database Seeder service.
echo.
echo Prerequisites:
echo - Trading Post application must be running
echo - You must be logged in to the application
echo - Browser must be open to the Trading Post site
echo.
echo ================================================================
echo.

set /p choice="Do you want to continue? (Y/N): "
if /i "%choice%"=="N" goto :end
if /i "%choice%"=="n" goto :end

echo.
echo Opening Trading Post application...
start "" "https://tradingpost.appwrite.network"

echo.
echo Waiting 5 seconds for application to load...
timeout /t 5 /nobreak >nul

echo.
echo ================================================================
echo  INSTRUCTIONS FOR MANUAL TESTING
echo ================================================================
echo.
echo 1. Make sure you are logged into the Trading Post application
echo.
echo 2. Open Browser Developer Console (F12)
echo.
echo 3. Look for the Test Data Manager button in the bottom-right corner
echo    (It should show "🧪 Test Data" - only visible in development mode)
echo.
echo 4. Click the Test Data Manager button
echo.
echo 5. Choose one of the seeding options:
echo    - 🌱 Full Seed: Complete comprehensive database seeding
echo    - 🎯 Sample Data: Alternative sample data creation
echo    - 👥 Demo Users: Create 5 predefined demo users with items
echo    - ➕ My Items: Add test items to your current account only
echo.
echo 6. Adjust seeding options if needed (user count, items per user)
echo.
echo 7. Click the desired seeding button and wait for completion
echo.
echo 8. Check the results summary to verify data creation
echo.
echo ================================================================
echo  CONSOLE TESTING (ADVANCED)
echo ================================================================
echo.
echo Alternatively, you can test directly in the browser console:
echo.
echo 1. In the console, run: await window.seedDatabase()
echo.
echo 2. Or run the test script: await window.runFullSeederTest()
echo.
echo 3. To cleanup: await window.cleanupSeededData()
echo.
echo ================================================================
echo.
echo The application should now be open. Follow the instructions above
echo to test the database seeding functionality.
echo.
pause
echo.
echo Database seeding test complete!
echo.
goto :end

:end
echo.
echo Thank you for testing the Trading Post Database Seeder!
echo.
pause