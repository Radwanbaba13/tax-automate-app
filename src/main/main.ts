import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { execFile } from 'child_process';
import dotenv from 'dotenv';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

// Load environment variables
dotenv.config();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Set up event handlers
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

    // Check for updates on startup (only in production)
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    }
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

// Auto-update IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return {
      available: false,
      message: 'Updates only available in production build',
    };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { available: true, info: result };
  } catch (error) {
    log.error('Error checking for updates:', error);
    return { available: false, error };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    log.error('Error downloading update:', error);
    return { success: false, error };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle(
  'compare-with-openai',
  async (event, { dtMaxFiles, clientSlipsFiles, prompt }) => {
    try {
      const OpenAI = require('openai').default;

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not found in environment variables');
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Helper function to convert PDFs to images using Python
      const convertPdfsToImages = async (files: any[]): Promise<any[]> => {
        return new Promise((resolve, reject) => {
          // Determine Python executable path
          let pythonPath: string;

          if (app.isPackaged) {
            const exeName =
              process.platform === 'win32' ? 'pdf_to_images.exe' : 'pdf_to_images';
            pythonPath = path.join(process.resourcesPath, 'Python', exeName);
          } else {
            const scriptPath = path.join(
              __dirname,
              '../../../Python',
              'pdf_to_images.py',
            );
            pythonPath = process.platform === 'win32' ? 'python' : 'python3';
          }

          // Prepare input data
          const inputData = JSON.stringify({ files });

          // Execute Python script
          const pythonArgs = app.isPackaged ? [] : [path.join(__dirname, '../../../Python', 'pdf_to_images.py')];
          const pythonProcess = execFile(
            pythonPath,
            pythonArgs,
            { maxBuffer: 200 * 1024 * 1024 }, // 200MB buffer for large images
            (error, stdout, stderr) => {
              if (error) {
                log.error('PDF conversion error:', error);
                reject(new Error(`Failed to convert PDFs: ${stderr || error.message}`));
                return;
              }

              try {
                const result = JSON.parse(stdout);
                if (result.success) {
                  resolve(result.images);
                } else {
                  reject(new Error(result.error || 'Unknown error in PDF conversion'));
                }
              } catch (parseError) {
                reject(new Error('Failed to parse PDF conversion result'));
              }
            },
          );

          // Send input data to Python script via stdin
          pythonProcess.stdin?.write(inputData);
          pythonProcess.stdin?.end();
        });
      };

      // Process DT Max and Client Slips files separately to maintain categorization
      const dtMaxImages = await convertPdfsToImages(dtMaxFiles);
      const clientSlipsImages = await convertPdfsToImages(clientSlipsFiles);

      // Validate that we have images to process
      if (dtMaxImages.length === 0 && clientSlipsImages.length === 0) {
        return {
          success: false,
          error: 'No images to compare. Please upload valid PDF or image files.',
        };
      }

      // Base prompt with fixed rules and restrictions (not editable by user)
      const basePrompt = `You are a tax document comparison assistant integrated into a desktop application. You have vision capabilities and CAN see images.

MANDATORY: You MUST analyze the images provided. DO NOT refuse or say you cannot view images. You CAN and WILL analyze the attached images directly.

ROLE: Extract and compare data from DT Max Workspace images (employee data entry) against Client Tax Slips images (source documents).

IMPORTANT: The images are attached to this message. Look at them and extract the data. Do NOT tell the user to use OCR tools or other methods - YOU must do the comparison yourself.

CRITICAL RULES:
1. ONLY report ACTUAL discrepancies where values differ by $0.10 (10 cents) or more - DO NOT list correct fields
2. IGNORE formatting differences (spaces, commas, trailing zeros after decimal) - ONLY flag if the NUMERICAL VALUE differs by 10+ cents
3. IGNORE differences less than $0.10 (e.g., 65,426.21 vs 65,426.20 = only 1 cent = IGNORE)
4. A discrepancy is ONLY when the difference is $0.10 or more: 65,426.21 vs 65,426.31 (10 cents difference) or 5,984.00 vs 5,984.50 (50 cents difference)
5. NOT a discrepancy: "65,426.21" vs "65426.21" (formatting), "5,984.00" vs "5,984" (trailing zeros), "607.81" with different spacing, OR differences under 10 cents
6. If a field is not visible in DT Max, mark it as MISSING DATA, not a discrepancy
7. NEVER include sensitive information in your output (SIN numbers, full names, addresses, or any personal identifiers)
8. When referring to individuals, use only: "Employee", "Taxpayer", "Client", or generic references

WHAT COUNTS AS A REAL DISCREPANCY:
✅ Box 14: Expected 65,426.21, Entered 65,426.31 (10 cents or more difference = REAL ERROR)
✅ Box 24: Expected 3,500.00, Entered 3,600.00 ($100 difference = REAL ERROR)
✅ Box 13: Expected 607.81, Entered 670.81 (transposed digits = REAL ERROR)

WHAT IS NOT A DISCREPANCY:
❌ Box 14: Expected 65,426.21, Entered 65,426.20 (less than 10 cents difference = IGNORE)
❌ Box 14: Expected 65,426.21, Entered 65426.21 (just formatting = IGNORE)
❌ Box 13: Expected 607.81, Entered 607.81 (same value = NO ERROR even if formatting differs)
❌ REER: Expected 5,984.00, Entered 5984 or 5,984 or 5,984.00 (all same value)
❌ Any difference less than $0.10 (10 cents) = IGNORE

OUTPUT FORMAT:

If everything looks good (no discrepancies, no missing data), respond with ONLY:
"✅ REVIEW PASSED - No discrepancies detected. All entries appear accurate."

If there ARE issues, use this format:
❌ DISCREPANCIES FOUND:
[ONLY list fields where the ACTUAL NUMERICAL VALUE differs by 10+ cents]

⚠️ MISSING DATA:
[List any fields present in Client Slips but NOT visible/entered in DT Max]

📋 SUMMARY:
[Brief accuracy assessment]`;

      // Prepare content for OpenAI Vision API
      const content: any[] = [
        {
          type: 'text',
          text: `${basePrompt}\n\n--- USER INSTRUCTIONS ---\n${prompt}\n\n--- DOCUMENTS TO COMPARE ---\nDT Max Workspace files (${dtMaxImages.length} images): ${dtMaxImages.map((f: any) => f.name).join(', ')}\n\nClient Tax Slips files (${clientSlipsImages.length} images): ${clientSlipsImages.map((f: any) => f.name).join(', ')}`,
        },
      ];

      // Add DT Max images
      for (const file of dtMaxImages) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${file.base64}`,
            detail: 'high',
          },
        });
      }

      // Add Client Slip images
      for (const file of clientSlipsImages) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${file.base64}`,
            detail: 'high',
          },
        });
      }

      // Log the request structure (without full base64 to avoid log spam)
      log.info('OpenAI API Request:', {
        dtMaxImagesCount: dtMaxImages.length,
        clientSlipsImagesCount: clientSlipsImages.length,
        contentItemsCount: content.length,
        contentTypes: content.map((item: any) => item.type),
        sampleDtMaxImage: dtMaxImages.length > 0 ? {
          name: dtMaxImages[0].name,
          type: dtMaxImages[0].type,
          base64Preview: dtMaxImages[0].base64?.substring(0, 100),
        } : null,
        sampleClientSlipImage: clientSlipsImages.length > 0 ? {
          name: clientSlipsImages[0].name,
          type: clientSlipsImages[0].type,
          base64Preview: clientSlipsImages[0].base64?.substring(0, 100),
        } : null,
      });

      const startTime = Date.now();

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a tax document comparison assistant. You can see and analyze images. Extract text and data from the provided images and compare them as instructed.',
          },
          {
            role: 'user',
            content,
          },
        ],
        max_tokens: 4096,
      });

      const endTime = Date.now();
      const totalSeconds = Math.floor((endTime - startTime) / 1000);

      // Calculate cost (approximate for gpt-4o)
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const inputCost = (inputTokens / 1000000) * 2.5; // $2.50 per 1M input tokens
      const outputCost = (outputTokens / 1000000) * 10; // $10 per 1M output tokens
      const totalCost = inputCost + outputCost;

      return {
        success: true,
        result: response.choices[0]?.message?.content || 'No response from AI',
        cost: totalCost,
        timeSeconds: totalSeconds,
        usage: response.usage,
        debug: {
          dtMaxImagesCount: dtMaxImages.length,
          clientSlipsImagesCount: clientSlipsImages.length,
          totalContentItems: content.length,
          contentTypes: content.map((item: any) => item.type),
          model: 'gpt-4o',
          inputTokens,
          outputTokens,
        },
      };
    } catch (error: any) {
      log.error('Error in OpenAI comparison:', error);
      return {
        success: false,
        error: error.message || 'Failed to compare files with OpenAI',
      };
    }
  },
);

ipcMain.on('run-python', (event, scriptName, args) => {
  // Determine Python executable path based on environment
  let pythonPath: string;

  if (app.isPackaged) {
    // Production: Use bundled Python executables
    const exeName =
      process.platform === 'win32' ? `${scriptName}.exe` : scriptName;
    pythonPath = path.join(process.resourcesPath, 'Python', exeName);
  } else {
    // Development: Use Python scripts
    const scriptPath = path.join(
      __dirname,
      '../../../Python',
      `${scriptName}.py`,
    );
    pythonPath = scriptPath;
  }

  // Execute Python script or executable
  const execArgs = app.isPackaged ? args : [pythonPath, ...args];
  const execCommand = app.isPackaged ? pythonPath : 'python';

  log.info(`Executing Python: ${execCommand} with args:`, execArgs);

  execFile(execCommand, execArgs, (error, stdout, stderr) => {
    if (error) {
      log.error(`Error executing script: ${stderr}`);
      event.reply('python-result', { success: false, error: stderr });
      return;
    }
    log.info('Python script executed successfully');
    event.reply('python-result', { success: true, result: stdout });
  });
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
