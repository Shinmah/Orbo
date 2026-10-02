/**
 * Pont minimal et sûr entre l'interface et l'appli de bureau (contextIsolation) :
 * seules ces fonctions sont exposées, sous window.orbo.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orbo', {
  info: () => ipcRenderer.invoke('orbo:info'),
  checkUpdate: () => ipcRenderer.invoke('orbo:check-update'),
  installUpdate: () => ipcRenderer.invoke('orbo:install-update'),
  openDownload: () => ipcRenderer.invoke('orbo:open-download'),
  onProgress: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('orbo:update-progress', handler);
    return () => ipcRenderer.removeListener('orbo:update-progress', handler);
  },
});
