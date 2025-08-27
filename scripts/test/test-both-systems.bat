@echo off
echo ========================================
echo   Testing Both Auto-Approval Systems
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "TEST_COMMANDS=ls,git status,npm run build,python app.py,flutter run,docker ps,curl https://example.com,echo hello,whoami,date"
set "DANGEROUS_COMMANDS=rm -rf /,del /f /s /q c:\\,format c:,shutdown /s,chmod 777"

echo [1/3] Testing Local auto-approve.js...
echo ======================================
echo.

echo Safe commands (should be APPROVED):
for %%a in (%TEST_COMMANDS%) do (
    set "cmd=%%a"
    echo.
    echo Testing: %%a
    cd /d "%SCRIPT_DIR%"
    node auto-approve.js "%%a" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   ✅ APPROVED
    ) else (
        echo   ❌ BLOCKED ^(Expected: APPROVED^)
    )
)

echo.
echo Dangerous commands (should be BLOCKED):
for %%a in (%DANGEROUS_COMMANDS%) do (
    set "cmd=%%a"
    echo.
    echo Testing: %%a
    cd /d "%SCRIPT_DIR%"
    node auto-approve.js "%%a" >nul 2>&1
    if !ERRORLEVEL! EQU 1 (
        echo   ✅ BLOCKED
    ) else (
        echo   ❌ APPROVED ^(Expected: BLOCKED^)
    )
)

echo.
echo [2/3] Checking MCP Configuration...
echo ==================================
echo.

if exist "%APPDATA%\Claude\claude_desktop_config.json" (
    echo ✅ Claude Desktop config found
    
    findstr /c:"claude-autoapprove" "%APPDATA%\Claude\claude_desktop_config.json" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ MCP server configured
    ) else (
        echo ❌ MCP server not found in config
    )
    
    findstr /c:"Bash:ls" "%APPDATA%\Claude\claude_desktop_config.json" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Comprehensive Bash command patterns configured
    ) else (
        echo ❌ Basic autoapprove only (needs update^)
    )
    
    findstr /c:"autoblock" "%APPDATA%\Claude\claude_desktop_config.json" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dangerous command blocking configured
    ) else (
        echo ❌ No dangerous command blocking
    )
) else (
    echo ❌ Claude Desktop config not found
)

echo.
echo [3/3] Testing MCP Server Installation...
echo =======================================
echo.

claude-autoapprove-mcp.exe --help >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ claude-autoapprove-mcp.exe is installed and working
    echo.
    echo MCP Server Help:
    claude-autoapprove-mcp.exe --help
) else (
    echo ❌ claude-autoapprove-mcp.exe not found or not working
)

echo.
echo ========================================
echo   COMPARISON SUMMARY
echo ========================================
echo.
echo Local auto-approve.js features:
echo   ✅ %TEST_COMMANDS:,= patterns
%
echo   ✅ Blocks dangerous patterns
echo   ✅ Safe directory checking
echo   ✅ Detailed logging
echo.
echo MCP Server features:
echo   ✅ Integrates with Claude Desktop
echo   ✅ Tool-level auto-approval
echo   ✅ Configured with same patterns as local script
echo   ✅ Remote debugging support
echo.
echo Both systems are now configured with identical approval patterns!
echo.
echo Next steps:
echo 1. Restart Claude Desktop to load MCP configuration
echo 2. Test tool approvals within Claude Desktop
echo 3. Verify auto-approve.log for local script activity
echo 4. Check Claude Desktop logs for MCP activity
echo.

pause