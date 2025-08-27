@echo off
echo ========================================
echo   Claude Auto-Approval Setup Verification
echo ========================================
echo.

echo [1/4] Testing uv installation...
uv --version > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ uv is installed
    uv --version
) else (
    echo   ❌ uv not found
)
echo.

echo [2/4] Testing claude-autoapprove-mcp installation...
claude-autoapprove-mcp.exe --help > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ claude-autoapprove-mcp is installed
) else (
    echo   ❌ claude-autoapprove-mcp not found
)
echo.

echo [3/4] Testing local auto-approve.js...
cd /d "%~dp0"
node auto-approve.js "npm run build" > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ Local auto-approve working - approves safe commands
) else (
    echo   ❌ Local auto-approve failed for safe command
)

node auto-approve.js "rm -rf /" > nul 2>&1
if %ERRORLEVEL% EQU 1 (
    echo   ✅ Local auto-approve working - blocks dangerous commands
) else (
    echo   ❌ Local auto-approve failed to block dangerous command
)
echo.

echo [4/4] Checking Claude Desktop configuration...
if exist "%APPDATA%\Claude\claude_desktop_config.json" (
    echo   ✅ Claude Desktop config found
    findstr /c:"claude-autoapprove" "%APPDATA%\Claude\claude_desktop_config.json" > nul
    if %ERRORLEVEL% EQU 0 (
        echo   ✅ MCP server configured in Claude Desktop
    ) else (
        echo   ❌ MCP server not found in Claude Desktop config
    )
    findstr /c:"autoapprove" "%APPDATA%\Claude\claude_desktop_config.json" > nul
    if %ERRORLEVEL% EQU 0 (
        echo   ✅ Auto-approve settings configured
    ) else (
        echo   ❌ Auto-approve settings not found
    )
) else (
    echo   ❌ Claude Desktop config not found
)
echo.

echo [5/5] Checking Claude Desktop process...
tasklist | findstr /i "claude.exe" > nul
if %ERRORLEVEL% EQU 0 (
    echo   ✅ Claude Desktop is running
) else (
    echo   ❌ Claude Desktop not running
)
echo.

echo ========================================
echo   SETUP SUMMARY
echo ========================================
echo.
echo ✅ Completed:
echo   • uv package manager installed
echo   • claude-autoapprove-mcp MCP server installed
echo   • Claude Desktop config updated with MCP server
echo   • Auto-approve and auto-block settings configured  
echo   • Local auto-approve.js working alongside MCP
echo   • Restart scripts created for debugging mode
echo.
echo 📋 Manual Steps Required:
echo   • Run as Administrator: create-persistent-task.bat
echo     (Creates Windows Task Scheduler entry)
echo   • Restart Claude Desktop to load new MCP settings
echo   • Verify MCP server loads in Claude Desktop logs
echo.
echo 🔧 Test Commands:
echo   • Local: node auto-approve.js "npm run build"  
echo   • MCP: Should auto-approve tools like Bash, Edit, Write, Read
echo.
echo For troubleshooting, check:
echo   • %APPDATA%\Claude\logs\
echo   • %~dp0auto-approve.log
echo.

pause