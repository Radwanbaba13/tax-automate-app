export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
  releaseName?: string;
  releaseNotesFile?: string;
}

export interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

export interface ElectronAPI {
  // File dialogs
  selectFile: () => Promise<string[]>;
  selectDirectory: () => Promise<string[]>;
  selectFiles: () => Promise<string[]>;

  // Python execution
  runPythonScript: (scriptName: string, args: string[]) => void;
  onPythonResult: (
    callback: (data: {
      success: boolean;
      result?: string;
      error?: string;
    }) => void,
  ) => void;

  // Auto-update API
  checkForUpdates: () => Promise<{
    available: boolean;
    info?: any;
    message?: string;
    error?: any;
  }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: any }>;
  installUpdate: () => void;
  onUpdateChecking: (callback: () => void) => void;
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateError: (callback: (error: Error) => void) => () => void;
  onUpdateDownloadProgress: (
    callback: (progress: ProgressInfo) => void,
  ) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;

  // OpenAI comparison API
  compareWithOpenAI: (
    dtMaxFiles: any[],
    clientSlipsFiles: any[],
    prompt: string,
  ) => Promise<{
    success: boolean;
    result?: string;
    error?: string;
    cost?: number;
    timeSeconds?: number;
    usage?: any;
    debug?: any;
  }>;

  // Email automation API
  generateEmailResponse: (options: {
    customerInquiry: string;
    replyMode: 'ai' | 'template' | 'template-ai';
    templateContent?: string;
  }) => Promise<{
    success: boolean;
    result?: string;
    error?: string;
  }>;
  fixEmailTemplateWithAI: (
    templateContent: string,
  ) => Promise<{
    success: boolean;
    result?: string;
    error?: string;
  }>;

  // Database API
  database: {
    // Configurations
    getConfigurations: () => Promise<{ data: any; error: any }>;
    updateConfigurations: (config: any) => Promise<{ data: any; error: any }>;

    // Tax Rates
    getAllTaxRates: () => Promise<{ data: any; error: any }>;
    getTaxRateByProvince: (
      province: string,
    ) => Promise<{ data: any; error: any }>;
    bulkReplaceTaxRates: (rates: any[]) => Promise<{ data: any; error: any }>;

    // Price List
    getAllPrices: () => Promise<{ data: any; error: any }>;
    bulkReplacePrices: (prices: any[]) => Promise<{ data: any; error: any }>;

    // Invoice Number
    getInvoiceNumber: () => Promise<{ data: any; error: any }>;
    updateInvoiceNumber: (
      invoiceNum: number,
    ) => Promise<{ data: any; error: any }>;

    // Users
    verifyPassword: (password: string) => Promise<{ data: any; error: any }>;
    updatePassword: (
      oldPassword: string,
      newPassword: string,
    ) => Promise<{ data: any; error: any }>;

    // Email Templates
    getAllEmailTemplates: () => Promise<{ data: any; error: any }>;
    getEmailTemplateById: (id: number) => Promise<{ data: any; error: any }>;
    getEmailTemplateByName: (
      templateName: string,
    ) => Promise<{ data: any; error: any }>;
    createEmailTemplate: (template: {
      template_name: string;
      subject_en: string;
      subject_fr: string;
      content_en: string;
      content_fr: string;
    }) => Promise<{ data: any; error: any }>;
    updateEmailTemplate: (
      id: number,
      template: {
        template_name: string;
        subject_en: string;
        subject_fr: string;
        content_en: string;
        content_fr: string;
      },
    ) => Promise<{ data: any; error: any }>;
    deleteEmailTemplate: (id: number) => Promise<{ data: any; error: any }>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
