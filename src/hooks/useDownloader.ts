import { useState, useEffect, useCallback } from "react";
import type {
  MediaInfo,
  DownloadOptions,
  DownloadProgress,
  HistoryItem,
  AppSettings,
  EngineStatus,
} from "../types";

export function useDownloader() {
  const [url, setUrl] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);

  const [activeDownloads, setActiveDownloads] = useState<
    Map<string, DownloadProgress>
  >(new Map());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);
  const [engineMessage, setEngineMessage] = useState<string | null>(null);

  // Load initial settings, history, and engine status
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.getSettings().then(setSettings).catch(console.error);
    api.getHistory().then(setHistory).catch(console.error);
    api.getEngineStatus().then(setEngineStatus).catch(console.error);

    // Subscribe to progress events from main process
    const cleanup = api.onDownloadProgress((progress) => {
      setActiveDownloads((prev) => {
        const next = new Map(prev);
        next.set(progress.id, progress);
        return next;
      });

      // If completed or failed, refresh history
      if (progress.status === "completed") {
        api.getHistory().then(setHistory).catch(console.error);
      }
    });

    return () => {
      cleanup();
    };
  }, []);

  // Inspect URL
  const inspect = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setIsInspecting(true);
    setInspectError(null);
    setMediaInfo(null);

    try {
      const res = await window.electronAPI.inspectUrl(targetUrl.trim());
      if (res.success && res.data) {
        setMediaInfo(res.data);
      } else {
        setInspectError(res.error || "Could not fetch media info.");
      }
    } catch (err: any) {
      setInspectError(err.message || "Error communicating with engine");
    } finally {
      setIsInspecting(false);
    }
  }, []);

  // Start Download
  const startDownload = useCallback(
    async (options: Omit<DownloadOptions, "id">) => {
      const id = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fullOptions: DownloadOptions = { ...options, id };

      // Set initial queued item
      setActiveDownloads((prev) => {
        const next = new Map(prev);
        next.set(id, {
          id,
          url: options.url,
          title: options.customFilename || options.title,
          thumbnail: options.thumbnail,
          mode: options.mode,
          status: "queued",
          percent: 0,
          speed: "--",
          eta: "--",
          totalSize: "Starting...",
          downloadedSize: "0 MB",
          phase: "Queued",
          startedAt: Date.now(),
        });
        return next;
      });

      try {
        const res = await window.electronAPI.startDownload(fullOptions);
        if (!res.success) {
          setActiveDownloads((prev) => {
            const next = new Map(prev);
            const item = next.get(id);
            if (item) {
              next.set(id, {
                ...item,
                status: "error",
                error: res.error || "Failed to start",
              });
            }
            return next;
          });
        }
      } catch (err: any) {
        setActiveDownloads((prev) => {
          const next = new Map(prev);
          const item = next.get(id);
          if (item) {
            next.set(id, { ...item, status: "error", error: err.message });
          }
          return next;
        });
      }
    },
    [],
  );

  // Cancel Download
  const cancelDownload = useCallback(async (id: string) => {
    setActiveDownloads((prev) => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) {
        next.set(id, {
          ...item,
          status: "cancelled",
          phase: "Cancelled by user",
        });
      }
      return next;
    });
    await window.electronAPI.cancelDownload(id);
  }, []);

  // Clear completed downloads from queue
  const removeDownloadFromQueue = useCallback((id: string) => {
    setActiveDownloads((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Update Settings
  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updated = await window.electronAPI.saveSettings(newSettings);
      setSettings(updated);
    },
    [],
  );

  // Pick download folder
  const selectDownloadFolder = useCallback(async () => {
    const path = await window.electronAPI.selectFolder();
    return path;
  }, []);

  // History Operations
  const refreshHistory = useCallback(async () => {
    try {
      const items = await window.electronAPI.getHistory();
      setHistory(items);
    } catch (e) {
      console.error("Failed to refresh history:", e);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    await window.electronAPI.clearHistory();
    setHistory([]);
  }, []);

  const deleteHistoryItem = useCallback(async (id: string) => {
    await window.electronAPI.deleteHistoryItem(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const cleanMissingHistory = useCallback(async () => {
    try {
      const remaining = await window.electronAPI.cleanMissingHistory();
      setHistory(remaining);
    } catch (e) {
      console.error("Failed to clean missing history:", e);
    }
  }, []);

  // Shell actions
  const openFile = useCallback(async (filePath: string) => {
    return window.electronAPI.openPath(filePath);
  }, []);

  const showInFolder = useCallback(async (filePath: string) => {
    return window.electronAPI.showInFolder(filePath);
  }, []);

  // Engine Update
  const updateEngine = useCallback(async () => {
    setIsUpdatingEngine(true);
    setEngineMessage("Updating yt-dlp engine...");
    try {
      const res = await window.electronAPI.updateYtdlp();
      setEngineMessage(res.message);
      const status = await window.electronAPI.getEngineStatus();
      setEngineStatus(status);
    } catch (err: any) {
      setEngineMessage(`Update error: ${err.message}`);
    } finally {
      setIsUpdatingEngine(false);
    }
  }, []);

  // Read Clipboard
  const readClipboard = useCallback(async () => {
    return window.electronAPI.readClipboard();
  }, []);

  return {
    url,
    setUrl,
    isInspecting,
    inspectError,
    mediaInfo,
    setMediaInfo,
    inspect,
    startDownload,
    cancelDownload,
    activeDownloads: Array.from(activeDownloads.values()),
    removeDownloadFromQueue,
    history,
    refreshHistory,
    clearHistory,
    deleteHistoryItem,
    cleanMissingHistory,
    settings,
    updateSettings,
    selectDownloadFolder,
    openFile,
    showInFolder,
    engineStatus,
    updateEngine,
    isUpdatingEngine,
    engineMessage,
    readClipboard,
  };
}
