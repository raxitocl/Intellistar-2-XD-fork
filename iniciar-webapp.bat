@echo off
cd /d "%~dp0"
title IntelliStar 2 XD - WebApp de Escritorio (Electron)
color 0A
echo ============================================================
echo   THE WEATHER CHANNEL - INTELLISTAR 2 XD EMULATOR
echo   Iniciando Aplicacion de Escritorio (Electron)...
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\electron" (
    echo Instalando dependencias de Electron por primera vez...
    call npm install
)

echo Lanzando emulador IntelliStar 2 XD...
npx electron .

if %errorlevel% neq 0 (
    echo.
    echo [Aviso] La aplicacion se cerro con codigo %errorlevel%.
    pause
)
