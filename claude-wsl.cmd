@ECHO off
SETLOCAL ENABLEDELAYEDEXPANSION

REM ===================================================================
REM Claude WSL Integration Batch Wrapper
REM 
REM This batch file replaces the original Windows Claude CLI command
REM and provides seamless integration with WSL bash environment.
REM 
REM Installation:
REM 1. Save this file as 'claude-wsl.cmd' in a directory in your PATH
REM 2. Ensure the claude-wsl-wrapper.js is in the same directory
REM 3. Rename or backup the original claude.cmd
REM 4. Create a symbolic link: mklink claude.cmd claude-wsl.cmd
REM 
REM Author: Claude Code Assistant
REM Version: 1.0.0
REM ===================================================================

REM Get the directory where this batch file is located
SET SCRIPT_DIR=%~dp0

REM Path to the Node.js wrapper script
SET WRAPPER_SCRIPT=%SCRIPT_DIR%claude-wsl-wrapper.js

REM Check if Node.js is available
where node >nul 2>nul
IF ERRORLEVEL 1 (
    ECHO Error: Node.js is not installed or not in PATH
    ECHO Please install Node.js to use the Claude WSL wrapper
    EXIT /B 1
)

REM Check if the wrapper script exists
IF NOT EXIST "%WRAPPER_SCRIPT%" (
    ECHO Error: Wrapper script not found at %WRAPPER_SCRIPT%
    ECHO Please ensure claude-wsl-wrapper.js is in the same directory as this batch file
    EXIT /B 1
)

REM Enable debug mode if CLAUDE_WSL_DEBUG is set
IF "%CLAUDE_WSL_DEBUG%"=="1" (
    ECHO [DEBUG] Claude WSL Wrapper starting...
    ECHO [DEBUG] Script directory: %SCRIPT_DIR%
    ECHO [DEBUG] Wrapper script: %WRAPPER_SCRIPT%
    ECHO [DEBUG] Arguments: %*
)

REM Execute the Node.js wrapper with all arguments
node "%WRAPPER_SCRIPT%" %*

REM Exit with the same code as the wrapper
EXIT /B %ERRORLEVEL%