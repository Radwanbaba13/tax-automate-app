const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectFile: () => ipcRenderer.invoke('dialog:openFile'),
  runPythonScript: (scriptName, args) =>
    ipcRenderer.send('run-python', scriptName, args),
  onPythonResult: (callback) => {
    // Remove all previous listeners first to prevent duplicates
    ipcRenderer.removeAllListeners('python-result');
    ipcRenderer.on('python-result', (event, data) => callback(data));
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFiles: () => ipcRenderer.invoke('select-files'),

  // Auto-update API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateChecking: (callback) =>
    ipcRenderer.on('update-checking', () => callback()),
  onUpdateAvailable: (callback) =>
    ipcRenderer.on('update-available', (event, info) => callback(info)),
  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on('update-not-available', (event, info) => callback(info)),
  onUpdateError: (callback) =>
    ipcRenderer.on('update-error', (event, error) => callback(error)),
  onUpdateDownloadProgress: (callback) =>
    ipcRenderer.on('update-download-progress', (event, progress) =>
      callback(progress),
    ),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // OpenAI comparison API
  compareWithOpenAI: (dtMaxFiles, clientSlipsFiles, prompt) =>
    ipcRenderer.invoke('compare-with-openai', {
      dtMaxFiles,
      clientSlipsFiles,
      prompt,
    }),
});
