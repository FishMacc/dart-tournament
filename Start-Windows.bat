@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Dart Tournament

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js ist nicht installiert.
    echo Bitte die LTS-Version von https://nodejs.org installieren
    echo und danach diese Datei erneut doppelklicken.
    start "" https://nodejs.org/
    pause
    exit /b 1
)

echo Dart Tournament wird gestartet... Dieses Fenster bitte NICHT schliessen!
node scripts\start.mjs
pause
