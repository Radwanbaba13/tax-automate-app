const { app, Menu, BrowserWindow } = require('electron');

// Function to toggle fullscreen
function toggleFullscreen() {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
  }
}

// Function to toggle dev tools
function toggleDevTools() {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.toggleDevTools();
  }
}

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click() {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        role: 'reload',
      },
      {
        label: 'Toggle Full Screen',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
        click: toggleFullscreen,
      },
      {
        label: 'Toggle Developer Tools',
        accelerator:
          process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click: toggleDevTools,
      },
      {
        type: 'separator',
      },
      {
        label: 'Zoom In',
        accelerator: process.platform === 'darwin' ? 'Command+=' : 'Ctrl+=',
        role: 'zoomIn',
      },
      {
        label: 'Zoom Out',
        accelerator: process.platform === 'darwin' ? 'Command+–' : 'Ctrl+–',
        role: 'zoomOut',
      },
      {
        label: 'Reset Zoom',
        accelerator: process.platform === 'darwin' ? 'Command+0' : 'Ctrl+0',
        role: 'resetZoom',
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
