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

  // Email automation API
  generateEmailResponse: (options) =>
    ipcRenderer.invoke('generate-email-response', options),
  fixEmailTemplateWithAI: (templateContent) =>
    ipcRenderer.invoke('fix-email-template-with-ai', templateContent),

  // Database API
  database: {
    // Configurations
    getConfigurations: () => ipcRenderer.invoke('db:getConfigurations'),
    updateConfigurations: (config) =>
      ipcRenderer.invoke('db:updateConfigurations', config),

    // Tax Rates
    getAllTaxRates: () => ipcRenderer.invoke('db:getAllTaxRates'),
    getTaxRateByProvince: (province) =>
      ipcRenderer.invoke('db:getTaxRateByProvince', province),
    bulkReplaceTaxRates: (rates) =>
      ipcRenderer.invoke('db:bulkReplaceTaxRates', rates),

    // Price List
    getAllPrices: () => ipcRenderer.invoke('db:getAllPrices'),
    bulkReplacePrices: (prices) =>
      ipcRenderer.invoke('db:bulkReplacePrices', prices),

    // Invoice Number
    getInvoiceNumber: () => ipcRenderer.invoke('db:getInvoiceNumber'),
    updateInvoiceNumber: (invoiceNum) =>
      ipcRenderer.invoke('db:updateInvoiceNumber', invoiceNum),

    // Users
    verifyPassword: (password) =>
      ipcRenderer.invoke('db:verifyPassword', password),
    updatePassword: (oldPassword, newPassword) =>
      ipcRenderer.invoke('db:updatePassword', oldPassword, newPassword),

    // Email Templates
    getAllEmailTemplates: () =>
      ipcRenderer.invoke('db:getAllEmailTemplates'),
    getEmailTemplateById: (id) =>
      ipcRenderer.invoke('db:getEmailTemplateById', id),
    getEmailTemplateByName: (templateName) =>
      ipcRenderer.invoke('db:getEmailTemplateByName', templateName),
    createEmailTemplate: (template) =>
      ipcRenderer.invoke('db:createEmailTemplate', template),
    updateEmailTemplate: (id, template) =>
      ipcRenderer.invoke('db:updateEmailTemplate', id, template),
    deleteEmailTemplate: (id) =>
      ipcRenderer.invoke('db:deleteEmailTemplate', id),
  },
});
