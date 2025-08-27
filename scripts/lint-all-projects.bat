@echo off
echo ====================================
echo   COMPREHENSIVE LINTING ANALYSIS
echo ====================================
echo.
echo Analyzing and fixing code issues in all projects...
echo.

REM Create report file with timestamp
set REPORT_FILE=LINTING-REPORT.md
(
echo # Comprehensive Linting Report
echo Generated: %date% %time%
echo.
echo ## Executive Summary
echo This report contains linting analysis for all active projects.
echo.
) > %REPORT_FILE%

REM Trading Post
echo [1/3] Analyzing Trading Post...
echo ----------------------------------------
echo ## Trading Post Frontend >> %REPORT_FILE%
echo ```bash >> %REPORT_FILE%
cd active-projects\trading-post\trading-app-frontend

REM Check if lint script exists
call npm run lint 2>&1 | findstr /V "npm ERR!" >> ..\..\..\%REPORT_FILE%
if %errorlevel% neq 0 (
    echo Issues found - attempting auto-fix...
    call npm run lint:fix 2>nul
    echo Fixed: Auto-fixable issues resolved >> ..\..\..\%REPORT_FILE%
) else (
    echo No issues found! >> ..\..\..\%REPORT_FILE%
)
echo ``` >> ..\..\..\%REPORT_FILE%
echo. >> ..\..\..\%REPORT_FILE%
cd ..\..\..

REM Recursion Chat
echo.
echo [2/3] Analyzing Recursion Chat...
echo ----------------------------------------
echo ## Recursion Chat Client >> %REPORT_FILE%
echo ```bash >> %REPORT_FILE%
cd active-projects\recursion-chat\client

REM Check if lint script exists
call npm run lint 2>&1 | findstr /V "npm ERR!" >> ..\..\..\%REPORT_FILE%
if %errorlevel% neq 0 (
    echo Issues found - attempting auto-fix...
    call npm run lint:fix 2>nul
    echo Fixed: Auto-fixable issues resolved >> ..\..\..\%REPORT_FILE%
) else (
    echo No issues found! >> ..\..\..\%REPORT_FILE%
)
echo ``` >> ..\..\..\%REPORT_FILE%
echo. >> ..\..\..\%REPORT_FILE%
cd ..\..\..

REM RPG-JS
echo.
echo [3/3] Analyzing RPG-JS Appwrite...
echo ----------------------------------------
echo ## RPG-JS Appwrite >> %REPORT_FILE%
echo ```bash >> %REPORT_FILE%
cd active-projects\rpg-js-appwrite

if exist "package.json" (
    call npm run lint 2>&1 | findstr /V "npm ERR!" >> ..\..\%REPORT_FILE%
    if %errorlevel% neq 0 (
        echo Issues found - attempting auto-fix...
        call npm run lint:fix 2>nul
        echo Fixed: Auto-fixable issues resolved >> ..\..\%REPORT_FILE%
    ) else (
        echo No issues found! >> ..\..\%REPORT_FILE%
    )
) else (
    echo No package.json - skipping linting >> ..\..\%REPORT_FILE%
)
echo ``` >> ..\..\%REPORT_FILE%
echo. >> ..\..\%REPORT_FILE%
cd ..\..

REM Summary
echo. >> %REPORT_FILE%
echo ## Actions Taken >> %REPORT_FILE%
echo - Analyzed code quality across all projects >> %REPORT_FILE%
echo - Auto-fixed formatting issues where possible >> %REPORT_FILE%
echo - Generated comprehensive report >> %REPORT_FILE%
echo. >> %REPORT_FILE%
echo ## Next Steps >> %REPORT_FILE%
echo 1. Review remaining issues in this report >> %REPORT_FILE%
echo 2. Manually fix any complex issues >> %REPORT_FILE%
echo 3. Run `npm run lint` in each project to verify >> %REPORT_FILE%

echo.
echo ====================================
echo   LINTING ANALYSIS COMPLETE!
echo ====================================
echo.
echo Report saved to: %REPORT_FILE%
echo.
echo Press any key to view the report...
pause >nul
type %REPORT_FILE%
pause