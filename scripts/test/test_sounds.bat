@echo off
REM Test Claude Code Audio Notification Sounds
REM This script tests all three notification sound types

echo Claude Code Audio Notification Sound Test
echo ==========================================

echo Testing Notification sound (complete.mp3 - Permission needed)...
powershell -ExecutionPolicy Bypass -File "C:\Users\Zrott\OneDrive\Desktop\Claude\.claude\scripts\play_complete.ps1"
timeout /t 2 /nobreak > nul

echo Testing Stop sound (complete.mp3 - Task complete)...  
powershell -ExecutionPolicy Bypass -File "C:\Users\Zrott\OneDrive\Desktop\Claude\.claude\scripts\play_complete.ps1"
timeout /t 2 /nobreak > nul

echo Testing SubagentStop sound (System Hand sound)...
powershell -Command "[System.Media.SystemSounds]::Hand.Play()"
timeout /t 2 /nobreak > nul

echo.
echo Sound test complete\!
echo If you heard three different system sounds, the audio notifications are working.
echo.

echo Alternative beep test (if system sounds did not work)...
echo Testing simple beeps...
echo  
timeout /t 1 /nobreak > nul
echo Testing console beep 1...
echo 
timeout /t 1 /nobreak > nul
echo Testing console beep 2...
echo 
timeout /t 1 /nobreak > nul
echo Testing console beep 3...
echo 

echo.
echo Press any key to exit...
pause >nul
