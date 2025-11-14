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
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateError: (callback: (error: Error) => void) => void;
  onUpdateDownloadProgress: (
    callback: (progress: ProgressInfo) => void,
  ) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
