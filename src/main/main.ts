import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { execFile } from 'child_process';
import dotenv from 'dotenv';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import * as db from './database';
import * as apiServices from './apiServices';

if (app.isPackaged) {
  const envPath = path.join(process.resourcesPath, '.env');
  dotenv.config({ path: envPath });
  log.info(`Loaded environment from: ${envPath}`);
} else {
  dotenv.config();
  log.info('Loaded environment from project root');
}

if (!process.env.API_SERVICES_URL || !process.env.API_SERVICES_SANKARI_API_KEY) {
  log.error('CRITICAL: API_SERVICES_URL or API_SERVICES_SANKARI_API_KEY not found in environment');
}

db.initializePool()
  .then(() => db.ensureDocTextBlocks())
  .catch((err: Error) => {
    log.error('❌ Database connection failed:', err.message);
  });

const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

class AppUpdater {
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      if (mainWindow) {
        mainWindow.webContents.send('update-checking');
      }
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      if (mainWindow) {
        mainWindow.webContents.send('update-not-available', info);
      }
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      if (mainWindow) {
        mainWindow.webContents.send('update-error', err);
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Download progress:', progressObj);
      if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', progressObj);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', info);
      }
    });

    // Check for updates on startup (with a short delay to let the window load)
    // and then periodically while the app is running
    if (app.isPackaged) {
      setTimeout(() => this.silentCheck(), 10_000);
      this.checkTimer = setInterval(() => this.silentCheck(), UPDATE_CHECK_INTERVAL);
    }
  }

  private silentCheck() {
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn('Background update check failed:', err?.message || err);
    });
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.filePaths;
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  return result.filePaths;
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  return result.filePaths;
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return {
      available: false,
      message: 'Updates only available in production build',
    };
  }
  try {
    // checkForUpdates() triggers update-available / update-not-available events.
    // Return { checking: true } so the renderer knows to wait for those events.
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn('checkForUpdates failed:', err?.message || err);
    });
    return { checking: true };
  } catch (error: any) {
    log.error('Error checking for updates:', error);
    return { available: false, error: error?.message || String(error) };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: any) {
    log.error('Error downloading update:', error);
    return { success: false, error: error?.message || String(error) };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

function formatComparisonResult(result: import('./apiServices').CompareResult): string {
  if (result.status === 'PASSED') {
    return '✅ REVIEW PASSED - No discrepancies detected. All entries appear accurate.';
  }

  const parts: string[] = [];

  if (result.discrepancies.length > 0) {
    parts.push('❌ DISCREPANCIES FOUND:\n');
    for (const d of result.discrepancies) {
      parts.push(`Where: ${d.payer} - ${d.form}`);
      parts.push(`Field: ${d.box} - ${d.field}`);
      parts.push(`Discrepancy: Expected ${d.expected}, Entered ${d.entered}. ${d.errorType}`);
      parts.push('');
    }
  }

  if (result.missingData.length > 0) {
    parts.push('⚠️ MISSING DATA:\n');
    for (const m of result.missingData) {
      parts.push(`Where: ${m.payer} - ${m.form}`);
      parts.push(`Field: ${m.box} - ${m.field}`);
      parts.push('Status: Missing from DT Max entry');
      parts.push('');
    }
  }

  if (result.summary) {
    parts.push('SUMMARY:');
    parts.push(result.summary);
  }

  return parts.join('\n');
}

ipcMain.handle(
  'compare-with-openai',
  async (_event, { dtMaxFiles, clientSlipsFiles, prompt }) => {
    try {
      const result = await apiServices.compareDocuments(dtMaxFiles, clientSlipsFiles, prompt);
      return {
        success: true,
        result: formatComparisonResult(result),
        cost: result.cost,
        timeSeconds: result.timeSeconds,
        usage: result.usage,
        debug: {
          model: 'api-services',
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
        },
      };
    } catch (error: any) {
      log.error('Error in data review comparison:', error);
      return { success: false, error: error.message || 'Failed to compare files' };
    }
  },
);

ipcMain.handle(
  'generate-email-response',
  async (_event, { customerInquiry, replyMode, templateContent }) => {
    try {
      if (replyMode === 'template') {
        return { success: true, result: templateContent };
      }

      const payload: { customerInquiry?: string; templateContent?: string } = {};
      if (replyMode === 'ai' || replyMode === 'template-ai') {
        if (customerInquiry?.trim()) payload.customerInquiry = customerInquiry;
      }
      if (replyMode === 'template-ai') {
        if (templateContent?.trim()) payload.templateContent = templateContent;
      }

      const result = await apiServices.generateEmail(payload);
      return { success: true, result };
    } catch (error: any) {
      log.error('Error generating email response:', error);
      return { success: false, error: error.message || 'Failed to generate email response' };
    }
  },
);

ipcMain.handle('fix-email-template-with-ai', async (_event, templateContent) => {
  try {
    const result = await apiServices.refineEmail(templateContent);
    return { success: true, result: result.body };
  } catch (error: any) {
    log.error('Error refining email template:', error);
    return { success: false, error: error.message || 'Failed to refine email template' };
  }
});

ipcMain.handle('rag-suggest-replies', async (_event, query) => {
  try {
    const result = await apiServices.suggestReplies(query);
    return { success: true, result };
  } catch (error: any) {
    log.error('Error fetching reply suggestions:', error);
    return { success: false, error: error.message || 'Failed to fetch reply suggestions', code: error.code };
  }
});

function parsePythonError(stderr: string): string {
  if (
    /PermissionError|WinError 32|Access is denied/i.test(stderr)
  ) {
    return 'A file is already open in another application. Please close it and try again.';
  }
  if (/FileNotFoundError/i.test(stderr)) {
    return 'A required file could not be found. Please check your file paths.';
  }
  if (/JSONDecodeError|json\.decoder/i.test(stderr)) {
    return 'There was a configuration error. Please verify your settings in Admin.';
  }
  if (/ModuleNotFoundError/i.test(stderr)) {
    return 'A required component is missing. Please reinstall the application.';
  }
  if (/MemoryError/i.test(stderr)) {
    return 'Not enough memory to complete the operation. Try with fewer files.';
  }

  const lines = stderr.trim().split('\n').filter((l) => l.trim());
  const lastLine = lines[lines.length - 1] ?? '';
  const match = lastLine.match(/\w+Error:\s*(.+)/);
  if (match) {
    return match[1].trim();
  }

  return 'An unexpected error occurred while running the script.';
}

ipcMain.on('run-python', (event, scriptName, args) => {
  let pythonPath: string;

  if (app.isPackaged) {
    const exeName =
      process.platform === 'win32' ? `${scriptName}.exe` : scriptName;
    pythonPath = path.join(
      process.resourcesPath,
      'Python',
      scriptName,
      exeName
    );
  } else {
    const scriptPath = path.join(
      app.getAppPath(),
      'Python',
      `${scriptName}.py`,
    );
    pythonPath = scriptPath;
  }

  // Write large JSON args to temp files to avoid ENAMETOOLONG on Windows
  const fs = require('fs');
  const os = require('os');
  const tempFiles: string[] = [];
  const processedArgs = args.map((arg: string) => {
    if (typeof arg === 'string' && arg.length > 4000 && arg.startsWith('{')) {
      const tmpFile = path.join(os.tmpdir(), `taxapp_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
      fs.writeFileSync(tmpFile, arg, 'utf-8');
      tempFiles.push(tmpFile);
      return `@file:${tmpFile}`;
    }
    return arg;
  });

  const execArgs = app.isPackaged ? processedArgs : [pythonPath, ...processedArgs];
  const execCommand = app.isPackaged ? pythonPath : 'python';

  log.info(`Executing Python: ${execCommand} with args count:`, execArgs.length);

  execFile(execCommand, execArgs, (error, stdout, stderr) => {
    // Clean up temp files
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch (_) { /* ignore */ }
    }

    if (error) {
      log.error(
        `[Python Error] Script: ${scriptName} | ${new Date().toISOString()}\n${stderr}`,
      );
      event.reply('python-result', {
        success: false,
        error: parsePythonError(stderr),
      });
      return;
    }
    log.info('Python script executed successfully');
    event.reply('python-result', { success: true, result: stdout });
  });
});

ipcMain.handle('db:getConfigurations', async () => {
  try {
    const data = await db.getConfigurations();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting configurations:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updateConfigurations', async (event, config) => {
  try {
    const data = await db.updateConfigurations(config);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating configurations:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getDocTextConfig', async () => {
  try {
    const data = await db.getDocTextConfig();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting doc text config:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updateDocTextConfig', async (event, config) => {
  try {
    const data = await db.updateDocTextConfig(config);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating doc text config:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:reseedDocTextConfig', async () => {
  try {
    await db.reseedDocTextBlocks();
    const data = await db.getDocTextConfig();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error reseeding doc text config:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getAllTaxRates', async () => {
  try {
    const data = await db.getAllTaxRates();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting tax rates:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getTaxRateByProvince', async (event, province) => {
  try {
    const data = await db.getTaxRateByProvince(province);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting tax rate by province:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:bulkReplaceTaxRates', async (event, rates) => {
  try {
    const data = await db.bulkReplaceTaxRates(rates);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error bulk replacing tax rates:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getAllPrices', async () => {
  try {
    const data = await db.getAllPrices();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting prices:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:bulkReplacePrices', async (event, prices) => {
  try {
    const data = await db.bulkReplacePrices(prices);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error bulk replacing prices:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getInvoiceNumber', async () => {
  try {
    const data = await db.getInvoiceNumber();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting invoice number:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updateInvoiceNumber', async (event, invoiceNum) => {
  try {
    const data = await db.updateInvoiceNumber(invoiceNum);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating invoice number:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:verifyPassword', async (event, password) => {
  try {
    const data = await db.verifyPassword(password);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error verifying password:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updatePassword', async (event, oldPassword, newPassword) => {
  try {
    const data = await db.updatePassword(oldPassword, newPassword);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating password:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getAllEmailTemplates', async () => {
  try {
    const data = await db.getAllEmailTemplates();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting email templates:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getEmailTemplateById', async (event, id) => {
  try {
    const data = await db.getEmailTemplateById(id);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting email template by id:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getEmailTemplateByName', async (event, templateName) => {
  try {
    const data = await db.getEmailTemplateByName(templateName);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting email template by name:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:createEmailTemplate', async (event, template) => {
  try {
    const data = await db.createEmailTemplate(template);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error creating email template:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updateEmailTemplate', async (event, id, template) => {
  try {
    const data = await db.updateEmailTemplate(id, template);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating email template:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:deleteEmailTemplate', async (event, id) => {
  try {
    const data = await db.deleteEmailTemplate(id);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error deleting email template:', error);
    return { data: null, error: { message: error.message } };
  }
});

app.on('will-quit', async () => {
  await db.closePool();
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    show: false,
    width,
    height,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.maximize();
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  new AppUpdater();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
