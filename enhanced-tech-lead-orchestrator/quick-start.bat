@echo off
echo.
echo ========================================
echo  Enhanced Tech-Lead Orchestrator
echo  Quick Start Menu
echo ========================================
echo.
echo 1. Run Demo
echo 2. Plan Mission from File
echo 3. Check System Status
echo 4. Run Tests
echo 5. View Documentation
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo Running demo...
    node simple-demo.js
    pause
) else if "%choice%"=="2" (
    set /p file="Enter requirements file path: "
    node src/index.js plan --file "%file%"
    pause
) else if "%choice%"=="3" (
    node src/index.js status
    pause
) else if "%choice%"=="4" (
    npm test
    pause
) else if "%choice%"=="5" (
    type HOW_TO_USE.md | more
    pause
) else if "%choice%"=="6" (
    exit
) else (
    echo Invalid choice!
    pause
)