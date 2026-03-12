const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectFile: () => ipcRenderer.invoke('dialog:openFile'),
  runPythonScript: (scriptName, args) =>
    ipcRenderer.send('run-python', scriptName, args),
  onPythonResult: (callback) => {
    ipcRenderer.removeAllListeners('python-result');
    ipcRenderer.on('python-result', (event, data) => callback(data));
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFiles: () => ipcRenderer.invoke('select-files'),

  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateChecking: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-checking', listener);
    return () => ipcRenderer.removeListener('update-checking', listener);
  },
  onUpdateAvailable: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  onUpdateNotAvailable: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('update-not-available', listener);
    return () => ipcRenderer.removeListener('update-not-available', listener);
  },
  onUpdateError: (callback) => {
    const listener = (_event, error) => callback(error);
    ipcRenderer.on('update-error', listener);
    return () => ipcRenderer.removeListener('update-error', listener);
  },
  onUpdateDownloadProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('update-download-progress', listener);
    return () => ipcRenderer.removeListener('update-download-progress', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  compareWithOpenAI: (dtMaxFiles, clientSlipsFiles, prompt) =>
    ipcRenderer.invoke('compare-with-openai', {
      dtMaxFiles,
      clientSlipsFiles,
      prompt,
    }),

  generateEmailResponse: (options) =>
    ipcRenderer.invoke('generate-email-response', options),
  fixEmailTemplateWithAI: (templateContent) =>
    ipcRenderer.invoke('fix-email-template-with-ai', templateContent),
  suggestReplies: (query) =>
    ipcRenderer.invoke('rag-suggest-replies', query),

  database: {
    getConfigurations: () => ipcRenderer.invoke('db:getConfigurations'),
    updateConfigurations: (config) =>
      ipcRenderer.invoke('db:updateConfigurations', config),

    getDocTextConfig: () => ipcRenderer.invoke('db:getDocTextConfig'),
    updateDocTextConfig: (config) =>
      ipcRenderer.invoke('db:updateDocTextConfig', config),

    getAllTaxRates: () => ipcRenderer.invoke('db:getAllTaxRates'),
    getTaxRateByProvince: (province) =>
      ipcRenderer.invoke('db:getTaxRateByProvince', province),
    bulkReplaceTaxRates: (rates) =>
      ipcRenderer.invoke('db:bulkReplaceTaxRates', rates),

    getAllPrices: () => ipcRenderer.invoke('db:getAllPrices'),
    bulkReplacePrices: (prices) =>
      ipcRenderer.invoke('db:bulkReplacePrices', prices),

    getInvoiceNumber: () => ipcRenderer.invoke('db:getInvoiceNumber'),
    updateInvoiceNumber: (invoiceNum) =>
      ipcRenderer.invoke('db:updateInvoiceNumber', invoiceNum),

    verifyPassword: (password) =>
      ipcRenderer.invoke('db:verifyPassword', password),
    updatePassword: (oldPassword, newPassword) =>
      ipcRenderer.invoke('db:updatePassword', oldPassword, newPassword),

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
