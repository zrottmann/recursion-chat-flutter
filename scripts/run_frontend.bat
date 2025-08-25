@echo off
title Trading Post Frontend
cd trading-app-frontend

REM Check if node_modules exists
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

REM Check if build exists
if exist build (
    echo Starting frontend from build directory...
    npx serve -s build -l 3000
) else (
    echo No build found. Starting development server...
    npm start
)