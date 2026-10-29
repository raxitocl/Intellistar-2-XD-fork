/**
 * electron-main.js
 * Proceso Principal de la aplicación de escritorio Electron para IntelliStar 2 XD.
 * Proporciona arranque directo broadcast, gestión de modos de pantalla (ventana, sin bordes,
 * pantalla completa), reproducción de audio sin restricción y puente IPC con la UI.
 */

const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const path = require('path');

// Desactivar restricciones de reproducción de audio para emular emisión broadcast inmediata
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-features', 'WebAssembly,SharedArrayBuffer');

let mainWindow = null;
let currentDisplayMode = 'windowed'; // 'windowed' | 'borderless' | 'fullscreen'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    title: 'The Weather Channel - IntelliStar 2 XD',
    icon: path.join(__dirname, 'assets', 'logos', 'favicon.png'),
    backgroundColor: '#0c121e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Mantener relación de aspecto 16:9 durante el redimensionamiento
  mainWindow.setAspectRatio(16 / 9);

  // Cargar directamente la interfaz desde el sistema de archivos local
  mainWindow.loadFile('index.html');

  // Registrar atajos locales cuando la ventana tenga foco
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F11: Alternar Pantalla Completa
    if (input.key === 'F11' && input.type === 'keyDown') {
      event.preventDefault();
      toggleFullscreen();
    }
    // F2 o Ctrl+, : Alternar Panel de Configuración On-Demand
    if (((input.key === 'F2') || (input.control && input.key === ',')) && input.type === 'keyDown') {
      event.preventDefault();
      mainWindow.webContents.send('toggle-settings');
    }
    // F12 o Ctrl+Shift+I : DevTools
    if (((input.key === 'F12') || (input.control && input.shift && input.key.toLowerCase() === 'i')) && input.type === 'keyDown') {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
    }
    // F5 o Ctrl+R : Recargar
    if (((input.key === 'F5') || (input.control && input.key.toLowerCase() === 'r')) && input.type === 'keyDown') {
      event.preventDefault();
      mainWindow.reload();
    }
    // Esc: Salir de pantalla completa a ventana
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (mainWindow.isFullScreen()) {
        event.preventDefault();
        applyDisplayMode('windowed');
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function applyDisplayMode(mode) {
  if (!mainWindow) return;

  currentDisplayMode = mode;
  if (mode === 'fullscreen') {
    mainWindow.setFullScreen(true);
  } else if (mode === 'borderless') {
    mainWindow.setFullScreen(false);
    mainWindow.maximize();
  } else {
    // windowed
    mainWindow.setFullScreen(false);
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    }
    mainWindow.setSize(1280, 720);
    mainWindow.center();
  }
}

function toggleFullscreen() {
  if (!mainWindow) return;
  const isFull = mainWindow.isFullScreen();
  applyDisplayMode(isFull ? 'windowed' : 'fullscreen');
}

// Handlers IPC para comunicación con el Frontend
ipcMain.on('set-display-mode', (event, mode) => {
  applyDisplayMode(mode);
});

ipcMain.handle('get-display-mode', () => {
  return currentDisplayMode;
});

ipcMain.on('toggle-devtools', () => {
  if (mainWindow) mainWindow.webContents.toggleDevTools();
});

// Ciclo de vida de la aplicación
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

