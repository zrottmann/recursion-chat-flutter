@echo off
echo.
echo ========================================
echo      SLUMLORD - DUNGEON ENHANCED
echo ========================================
echo.
echo Starting SlumLord with Dungeon Exploration System...
echo.
echo Features:
echo - Camera following system
echo - Enterable buildings (Casino, Bank, Courthouse, Grocery)
echo - Comedic themed enemies
echo - Interactive objects and loot
echo.

cd /d "C:\Users\Zrott\OneDrive\Desktop\Claude\SlumLord"

echo Running Flutter pub get...
"C:\Users\Zrott\OneDrive\Desktop\Claude\flutter\bin\flutter" pub get

echo.
echo Launching game on http://localhost:8080
echo.

"C:\Users\Zrott\OneDrive\Desktop\Claude\flutter\bin\flutter" run -d chrome --web-port=8080 --target=lib/main_dungeon_enhanced.dart

echo.
echo Game session ended.
pause