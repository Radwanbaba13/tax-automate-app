const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectFile: () => ipcRenderer.invoke('dialog:openFile'),
  runPythonScript: (scriptName, args) =>
    ipcRenderer.send('run-python', scriptName, args),
  onPythonResult: (callback) =>
    ipcRenderer.on('python-result', (event, data) => callback(data)),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
});
