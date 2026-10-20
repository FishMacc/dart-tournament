@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Dart Tournament

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed.
    echo Please install the LTS version from https://nodejs.org
    echo and then double-click this file again.
    start "" https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Dart Tournament... Please do NOT close this window!
node scripts\start.mjs
pause
