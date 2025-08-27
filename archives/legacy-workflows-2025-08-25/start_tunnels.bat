@echo off
echo Starting Cloudflare tunnels...

echo.
echo Starting tunnel for localhost:3001...
start /B cmd /c "C:\Users\Zrott\bin\cloudflared.exe tunnel --url http://localhost:3001 2>&1 | findstr /C:trycloudflare.com && pause"

timeout /t 5 /nobreak > nul

echo.
echo Starting tunnel for localhost:5174...
start /B cmd /c "C:\Users\Zrott\bin\cloudflared.exe tunnel --url http://localhost:5174 2>&1 | findstr /C:trycloudflare.com && pause"

echo.
echo Tunnels are starting. Check the console windows for URLs.
pause