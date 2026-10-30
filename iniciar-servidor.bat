@echo off
cd /d "%~dp0"
title IntelliStar 2 XD - Servidor Local Node.js
color 0B
echo ============================================================
echo   THE WEATHER CHANNEL - INTELLISTAR 2 XD EMULATOR
echo   Iniciando Servidor Web Local en Node.js...
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Iniciando servidor local...
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:8080"
node server.js

pause
