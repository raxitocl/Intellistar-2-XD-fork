/**
 * preload.js
 * Puente seguro de contexto (ContextBridge) entre el Proceso Principal de Electron
 * y el Proceso de Renderizado (UI de IntelliStar 2 XD).
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  setDisplayMode: (mode) => ipcRenderer.send('set-display-mode', mode),
  getDisplayMode: () => ipcRenderer.invoke('get-display-mode'),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  onToggleSettings: (callback) => {
    ipcRenderer.on('toggle-settings', () => {
      if (typeof callback === 'function') callback();
    });
  }
});

