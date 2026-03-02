const { app, Menu, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

function toggleFullscreen() {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
  }
}

function toggleDevTools() {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.toggleDevTools();
  }
}

async function checkForUpdates() {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  if (!app.isPackaged) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Development Mode',
      message: 'Update checks are only available in production builds.',
      buttons: ['OK'],
    });
    return;
  }

  try {
    log.info('Manual update check triggered');

    dialog.showMessageBox({
      type: 'info',
      title: 'Checking for Updates',
      message: 'Checking for updates...',
      buttons: ['OK'],
    });

    const result = await autoUpdater.checkForUpdates();

    if (!result || !result.updateInfo) {
      dialog.showMessageBox({
        type: 'info',
        title: 'No Updates',
        message: 'You are running the latest version.',
        buttons: ['OK'],
      });
    } else {
      log.info('Update found:', result.updateInfo);
    }
  } catch (error) {
    log.error('Error checking for updates:', error);
    dialog.showMessageBox({
      type: 'error',
      title: 'Update Check Failed',
      message: 'Unable to check for updates. Please try again later.',
      buttons: ['OK'],
    });
  }
}

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Check for Updates...',
        click: checkForUpdates,
      },
      { type: 'separator' },
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
        accelerator: process.platform === 'darwin' ? 'Command+-' : 'Ctrl+-',
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
