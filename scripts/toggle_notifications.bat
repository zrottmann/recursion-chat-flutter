@echo off
REM Toggle Claude Code Audio Notifications
REM This script enables/disables Claude Code notifications by setting/unsetting CLAUDE_NOTIFICATIONS_DISABLED

echo Claude Code Audio Notifications Toggle
echo =====================================

if defined CLAUDE_NOTIFICATIONS_DISABLED (
    echo Current Status: DISABLED
    echo Enabling notifications...
    set "CLAUDE_NOTIFICATIONS_DISABLED="
    setx CLAUDE_NOTIFICATIONS_DISABLED ""
    echo Notifications are now ENABLED
) else (
    echo Current Status: ENABLED  
    echo Disabling notifications...
    set "CLAUDE_NOTIFICATIONS_DISABLED=1"
    setx CLAUDE_NOTIFICATIONS_DISABLED "1"
    echo Notifications are now DISABLED
)

echo.
echo Changes will take effect for new Claude Code sessions.
echo Press any key to exit...
pause >nul
