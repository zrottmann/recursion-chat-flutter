@echo off
echo ========================================
echo   SlumLord Codebase Reorganization
echo ========================================
echo.

echo Step 1: Creating backup...
git stash push -m "pre-reorganization-backup-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%"

echo.
echo Step 2: Creating proper folder structure...
if not exist flutter mkdir flutter

echo.
echo Step 3: Moving Flutter game from misnamed 'unity' folder...
if exist unity\slumlord-game (
    echo Moving Flutter game to correct location...
    git mv unity/slumlord-game flutter/slumlord-game
    echo Flutter game moved successfully!
) else (
    echo Warning: unity/slumlord-game not found
)

echo.
echo Step 4: Cleaning up Unity folder...
if exist unity (
    echo Removing empty unity folder...
    git rm -r unity/
    echo Unity folder removed
)

echo.
echo Step 5: Creating proper Unity placeholder...
mkdir unity
echo # Placeholder for actual Unity C# game > unity\README.md
git add unity\README.md

echo.
echo Step 6: Checking git status...
git status

echo.
echo ========================================
echo   Reorganization Complete!
echo ========================================
echo.
echo Technology folders now correctly organized:
echo - flutter/slumlord-game/ (Flutter/Dart game)
echo - mobile/ (React Native mobile app)
echo - web/ (RPG.js web game)
echo - multiplayer/ (Node.js/TypeScript server)
echo - unity/ (Placeholder for actual Unity C# code)
echo.
echo Next steps:
echo 1. Review changes: git diff --cached
echo 2. Test functionality: start.bat
echo 3. Commit changes: git commit -m "fix: reorganize codebase by technology platform"
echo.
pause