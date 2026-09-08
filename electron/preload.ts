import { contextBridge, ipcRenderer } from "electron";
import type {
  DownloadOptions,
  DownloadProgress,
  AppSettings,
} from "../src/types";

contextBridge.exposeInMainWorld("electronAPI", {
  // Engine & Metadata
  inspectUrl: (url: string) => ipcRenderer.invoke("inspect-url", url),
  getEngineStatus: () => ipcRenderer.invoke("get-engine-status"),
  updateYtdlp: () => ipcRenderer.invoke("update-ytdlp"),

  // Downloads
  startDownload: (options: DownloadOptions) =>
    ipcRenderer.invoke("start-download", options),
  cancelDownload: (id: string) => ipcRenderer.invoke("cancel-download", id),
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = (_event: any, progress: DownloadProgress) =>
      callback(progress);
    ipcRenderer.on("download-progress", handler);
    return () => {
      ipcRenderer.removeListener("download-progress", handler);
    };
  },

  // Settings & History
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke("save-settings", settings),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getHistory: () => ipcRenderer.invoke("get-history"),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
  deleteHistoryItem: (id: string) =>
    ipcRenderer.invoke("delete-history-item", id),
  cleanMissingHistory: () => ipcRenderer.invoke("clean-missing-history"),
  openPath: (filePath: string) => ipcRenderer.invoke("open-path", filePath),
  showInFolder: (filePath: string) =>
    ipcRenderer.invoke("show-in-folder", filePath),

  // Storage & Disk Analytics
  getStorageStats: () => ipcRenderer.invoke("get-storage-stats"),
  cleanTempCache: () => ipcRenderer.invoke("clean-temp-cache"),

  // System & Clipboard
  readClipboard: () => ipcRenderer.invoke("read-clipboard"),
});
