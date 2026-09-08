import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  clipboard,
  Tray,
  Menu,
  Notification,
  nativeImage,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import { BinManager } from "./binManager";
import { YtdlpRunner } from "./ytdlpRunner";
import { AppStore } from "./store";
import type { DownloadOptions } from "../src/types";

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app?.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const preload = path.join(__dirname, "preload.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, "index.html");

let binManager: BinManager;
let ytdlpRunner: YtdlpRunner;
let appStore: AppStore;

async function createWindow() {
  win = new BrowserWindow({
    title: "AnyDownloader - Offline Media Engine",
    width: 1100,
    height: 800,
    minWidth: 880,
    minHeight: 650,
    backgroundColor: "#0D1117",
    show: false,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  win.setMenuBarVisibility(false);

  win.once("ready-to-show", () => {
    win?.show();
  });

  // Minimize to tray behavior
  win.on("close", (event: any) => {
    const settings = appStore?.getSettings();
    if (settings?.minimizeToTray && !isQuitting) {
      event.preventDefault();
      win?.hide();
      if (tray && Notification.isSupported()) {
        new Notification({
          title: "AnyDownloader Running in Background",
          body: "Downloads continue in the background. Click the tray icon to restore.",
        }).show();
      }
    }
  });

  if (url) {
    win.loadURL(url);
  } else {
    win.loadFile(indexHtml);
  }
}

function createTray() {
  if (tray) return;

  // Simple tray icon fallback
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("AnyDownloader - Offline Media Engine");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open AnyDownloader",
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: "Open Downloads Folder",
      click: () => {
        const dest = appStore?.getSettings().defaultDownloadPath;
        if (dest) shell.openPath(dest);
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
}

app.whenReady().then(async () => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.anydownloader.app");
  }
  appStore = new AppStore();
  binManager = new BinManager();
  ytdlpRunner = new YtdlpRunner(binManager);
  await binManager.init();

  createTray();
  setupIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      win?.show();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  const settings = appStore?.getSettings();
  if (!settings?.minimizeToTray && process.platform !== "darwin") {
    app.quit();
  }
});

function setupIpcHandlers() {
  // Inspect URL (handles playlists and single media)
  ipcMain.handle("inspect-url", async (_event, targetUrl: string) => {
    try {
      const data = await ytdlpRunner.inspectUrl(targetUrl);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to inspect URL" };
    }
  });

  // Engine Status
  ipcMain.handle("get-engine-status", async () => {
    return binManager.getStatus();
  });

  // Update yt-dlp
  ipcMain.handle("update-ytdlp", async () => {
    return binManager.updateYtdlp();
  });

  // Start Download
  ipcMain.handle("start-download", async (_event, options: DownloadOptions) => {
    try {
      ytdlpRunner.startDownload(
        options,
        (progress) => {
          if (win && !win.isDestroyed()) {
            win.webContents.send("download-progress", progress);
          }
        },
        (historyItem) => {
          appStore.addHistoryItem(historyItem);

          // Native Windows Toast Notification on Completion
          const settings = appStore.getSettings();
          if (settings.enableNotifications && Notification.isSupported()) {
            const notif = new Notification({
              title: "Download Complete! 🎉",
              body: `${historyItem.title} (${historyItem.format})`,
              silent: false,
            });
            notif.on("click", () => {
              if (historyItem.filePath) {
                shell.showItemInFolder(historyItem.filePath);
              } else if (win) {
                win.show();
                win.focus();
              }
            });
            notif.show();
          }
        },
        (errMsg) => {
          console.error(`Download error for ${options.id}:`, errMsg);
        },
      );
      return { success: true, id: options.id };
    } catch (err: any) {
      return { success: false, id: options.id, error: err.message };
    }
  });

  // Cancel Download
  ipcMain.handle("cancel-download", async (_event, id: string) => {
    const success = ytdlpRunner.cancelDownload(id);
    return { success };
  });

  // App Settings
  ipcMain.handle("get-settings", async () => {
    return appStore.getSettings();
  });

  ipcMain.handle("save-settings", async (_event, newSettings) => {
    return appStore.saveSettings(newSettings);
  });

  // Select Folder dialog
  ipcMain.handle("select-folder", async () => {
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"],
      title: "Select Download Destination Folder",
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Download History
  ipcMain.handle("get-history", async () => {
    const rawHistory = appStore.getHistory();
    return rawHistory.map((item) => ({
      ...item,
      fileExists: item.filePath ? fs.existsSync(item.filePath) : false,
    }));
  });

  ipcMain.handle("clear-history", async () => {
    appStore.clearHistory();
  });

  ipcMain.handle("delete-history-item", async (_event, id: string) => {
    appStore.deleteHistoryItem(id);
  });

  ipcMain.handle("clean-missing-history", async () => {
    const cleaned = appStore.cleanMissingHistory((filePath) =>
      fs.existsSync(filePath),
    );
    return cleaned.map((item) => ({
      ...item,
      fileExists: true,
    }));
  });

  // Shell Actions
  ipcMain.handle("open-path", async (_event, filePath: string) => {
    if (!filePath) {
      return { success: false, error: "No file path specified." };
    }
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error:
          "File not found on disk. It may have been moved, renamed, or deleted.",
      };
    }
    try {
      const err = await shell.openPath(filePath);
      if (err) {
        return { success: false, error: err };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("show-in-folder", async (_event, filePath: string) => {
    if (!filePath) {
      return { success: false, error: "No file path specified." };
    }
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return { success: true };
    }

    // If file is missing, try opening parent directory
    const parentDir = path.dirname(filePath);
    if (fs.existsSync(parentDir)) {
      await shell.openPath(parentDir);
      return {
        success: true,
        warning:
          "Target file was not found, so the destination folder was opened instead.",
      };
    }

    return {
      success: false,
      error: "Neither the file nor its destination folder exist on disk.",
    };
  });

  // Clipboard
  ipcMain.handle("read-clipboard", async () => {
    return clipboard.readText();
  });
}
