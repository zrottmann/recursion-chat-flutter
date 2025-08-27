@echo off
echo Creating persistent Claude auto-restart task...

:: Create XML task definition for Windows Task Scheduler
set "TASK_XML=%~dp0claude-autorestart-task.xml"
set "SCRIPT_PATH=%~dp0restart-claude-with-debug.bat"

:: Create the task XML
(
echo ^<?xml version="1.0" encoding="UTF-16"?^>
echo ^<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^>
echo   ^<RegistrationInfo^>
echo     ^<Description^>Auto-restart Claude Desktop with MCP support^</Description^>
echo     ^<Author^>Claude Auto-Approval System^</Author^>
echo   ^</RegistrationInfo^>
echo   ^<Triggers^>
echo     ^<LogonTrigger^>
echo       ^<Enabled^>true^</Enabled^>
echo       ^<UserId^>%USERNAME%^</UserId^>
echo       ^<Delay^>PT30S^</Delay^>
echo     ^</LogonTrigger^>
echo   ^</Triggers^>
echo   ^<Principals^>
echo     ^<Principal id="Author"^>
echo       ^<UserId^>%USERNAME%^</UserId^>
echo       ^<LogonType^>InteractiveToken^</LogonType^>
echo       ^<RunLevel^>LimitedUser^</RunLevel^>
echo     ^</Principal^>
echo   ^</Principals^>
echo   ^<Settings^>
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^>
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^>
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^>
echo     ^<AllowHardTerminate^>true^</AllowHardTerminate^>
echo     ^<StartWhenAvailable^>false^</StartWhenAvailable^>
echo     ^<RunOnlyIfNetworkAvailable^>false^</RunOnlyIfNetworkAvailable^>
echo     ^<IdleSettings^>
echo       ^<StopOnIdleEnd^>true^</StopOnIdleEnd^>
echo       ^<RestartOnIdle^>false^</RestartOnIdle^>
echo     ^</IdleSettings^>
echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^>
echo     ^<Enabled^>true^</Enabled^>
echo     ^<Hidden^>false^</Hidden^>
echo     ^<RunOnlyIfIdle^>false^</RunOnlyIfIdle^>
echo     ^<DisallowStartOnRemoteAppSession^>false^</DisallowStartOnRemoteAppSession^>
echo     ^<UseUnifiedSchedulingEngine^>true^</UseUnifiedSchedulingEngine^>
echo     ^<WakeToRun^>false^</WakeToRun^>
echo     ^<ExecutionTimeLimit^>PT72H^</ExecutionTimeLimit^>
echo     ^<Priority^>7^</Priority^>
echo   ^</Settings^>
echo   ^<Actions Context="Author"^>
echo     ^<Exec^>
echo       ^<Command^>"%SCRIPT_PATH%"^</Command^>
echo       ^<WorkingDirectory^>%~dp0^</WorkingDirectory^>
echo     ^</Exec^>
echo   ^</Actions^>
echo ^</Task^>
) > "%TASK_XML%"

:: Import the task
echo Importing task into Windows Task Scheduler...
schtasks /create /tn "Claude Auto-Restart with MCP" /xml "%TASK_XML%" /f

if %ERRORLEVEL% EQU 0 (
    echo ✅ Task created successfully!
    echo The task will run at login and restart Claude Desktop with MCP support.
    echo.
    echo To manage this task:
    echo   • View: taskschd.msc
    echo   • Delete: schtasks /delete /tn "Claude Auto-Restart with MCP" /f
    echo   • Run now: schtasks /run /tn "Claude Auto-Restart with MCP"
    echo.
    choice /c YN /m "Run the task now to test"
    if !ERRORLEVEL! EQU 1 (
        schtasks /run /tn "Claude Auto-Restart with MCP"
        echo Task started. Check if Claude Desktop restarted with debugging enabled.
    )
) else (
    echo ❌ Failed to create task. You may need to run as Administrator.
    echo Try running this script as Administrator.
)

:: Clean up temporary XML file
del "%TASK_XML%" > nul 2>&1

pause