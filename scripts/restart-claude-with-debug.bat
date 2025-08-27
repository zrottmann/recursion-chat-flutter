@echo off
echo Restarting Claude Desktop with remote debugging enabled...

:: Kill Claude Desktop processes safely
echo Stopping Claude Desktop...
taskkill /IM claude.exe /F > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Claude Desktop stopped successfully
) else (
    echo No Claude Desktop processes found to stop
)

:: Wait a moment for processes to fully terminate
timeout /t 2 /nobreak > nul

:: Find Claude Desktop executable
set "CLAUDE_PATH="
for /d %%d in ("%LOCALAPPDATA%\Programs\Claude*") do (
    if exist "%%d\Claude.exe" (
        set "CLAUDE_PATH=%%d\Claude.exe"
        goto :found
    )
)

:: Check common installation paths
if exist "%PROGRAMFILES%\Claude\Claude.exe" (
    set "CLAUDE_PATH=%PROGRAMFILES%\Claude\Claude.exe"
    goto :found
)
if exist "%PROGRAMFILES(x86)%\Claude\Claude.exe" (
    set "CLAUDE_PATH=%PROGRAMFILES(x86)%\Claude\Claude.exe"
    goto :found
)

echo ERROR: Could not find Claude Desktop executable
echo Please check your Claude installation
pause
exit /b 1

:found
echo Found Claude Desktop at: %CLAUDE_PATH%

:: Start Claude Desktop with remote debugging enabled
echo Starting Claude Desktop with remote debugging...
start "" "%CLAUDE_PATH%" --remote-debugging-port=9222 --remote-allow-origins=*

:: Wait for startup
timeout /t 3 /nobreak > nul

echo Claude Desktop restarted with remote debugging on port 9222
echo MCP servers should now be loading...

:: Optional: Open Chrome DevTools for debugging
choice /c YN /m "Open Chrome DevTools for debugging"
if %ERRORLEVEL% EQU 1 (
    start "" "chrome://inspect"
)

echo Setup complete! Claude Desktop should now work with MCP auto-approval.
pause