import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  HardDrive,
  Sliders,
  Moon,
  Sun,
  Palette,
  Trash2,
  Database,
  Sparkles,
  Folder,
} from "lucide-react";
import type { AppSettings, EngineStatus, StorageStats } from "../types";

interface SettingsModalProps {
  settings: AppSettings | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectFolder: () => Promise<string | null>;
  engineStatus: EngineStatus | null;
  onUpdateEngine: () => void;
  isUpdatingEngine: boolean;
  engineMessage: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onSelectFolder,
  engineStatus,
  onUpdateEngine,
  isUpdatingEngine,
  engineMessage,
}) => {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(false);
  const [isCleaningCache, setIsCleaningCache] = useState<boolean>(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  const loadStorageStats = async () => {
    if (!window.electronAPI?.getStorageStats) return;
    setIsLoadingStorage(true);
    try {
      const stats = await window.electronAPI.getStorageStats();
      setStorageStats(stats);
    } catch (e) {
      console.error("Failed to load storage stats:", e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    loadStorageStats();
  }, [settings?.defaultDownloadPath]);

  const handleCleanTempCache = async () => {
    if (!window.electronAPI?.cleanTempCache) return;
    setIsCleaningCache(true);
    try {
      const res = await window.electronAPI.cleanTempCache();
      if (res.deletedCount > 0) {
        setCleanMessage(
          `Reclaimed ${formatBytes(res.cleanedBytes)} by purging ${res.deletedCount} temporary chunk file${res.deletedCount > 1 ? "s" : ""}!`,
        );
      } else {
        setCleanMessage(
          "Temp cache is already clean! Zero orphan files found.",
        );
      }
      await loadStorageStats();
    } catch (err: any) {
      setCleanMessage(`Failed to clean cache: ${err.message}`);
    } finally {
      setIsCleaningCache(false);
      setTimeout(() => setCleanMessage(null), 5000);
    }
  };

  if (!settings) return null;

  const handleBrowse = async () => {
    const path = await onSelectFolder();
    if (path) {
      onUpdateSettings({ defaultDownloadPath: path });
    }
  };

  const isDark = settings.darkMode ?? true;

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-playful-violet text-white flex items-center justify-center border-2 border-playful-dark shadow-pop-sm rotate-[-4deg]">
          <SettingsIcon
            className="w-5 h-5"
            strokeWidth={2.5}
          />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-playful-dark dark:text-white">
            Preferences & Storage Diagnostics
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Fine-tune download defaults, disk usage analytics, theme appearance,
            and engine binaries
          </p>
        </div>
      </div>

      {/* Storage & Disk Usage Analytics Dashboard */}
      <div className="sticker-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b-2 border-playful-dark/10 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-playful-mint/30 text-playful-dark dark:text-white flex items-center justify-center border-2 border-playful-dark shadow-pop-sm">
              <HardDrive
                className="w-5 h-5 text-playful-dark dark:text-white"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-playful-dark dark:text-white">
                Storage & Drive Analytics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Live capacity tracking for your download destination and app
                data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadStorageStats}
            disabled={isLoadingStorage}
            className="candy-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50"
            title="Refresh Storage Analytics"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingStorage ? "animate-spin" : ""}`}
              strokeWidth={2.5}
            />
            <span>Refresh</span>
          </button>
        </div>

        {cleanMessage && (
          <div className="p-3 bg-playful-mint/20 dark:bg-emerald-950/40 border-2 border-playful-dark dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-heading font-bold flex items-center space-x-2 shadow-pop-sm animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{cleanMessage}</span>
          </div>
        )}

        {/* Drive Capacity Progress Bar */}
        {storageStats && storageStats.totalDiskBytes > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-lg bg-playful-violet text-white text-[11px] border border-playful-dark">
                  {storageStats.driveLetter} Drive
                </span>
                <span>Destination Storage Capacity</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                <span className="font-bold text-playful-dark dark:text-white">
                  {formatBytes(storageStats.freeDiskBytes)} free
                </span>{" "}
                of {formatBytes(storageStats.totalDiskBytes)} (
                {storageStats.diskUsagePercent}% used)
              </div>
            </div>

            <div className="w-full bg-slate-200 dark:bg-[#161b22] h-3.5 rounded-full border-2 border-playful-dark dark:border-slate-700 overflow-hidden shadow-inner p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 border border-playful-dark/30 ${
                  storageStats.diskUsagePercent > 90
                    ? "bg-rose-500"
                    : storageStats.diskUsagePercent > 75
                      ? "bg-playful-amber"
                      : "bg-playful-mint"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(2, storageStats.diskUsagePercent))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 3 Storage Footprint Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Media Library Size */}
          <div className="p-3.5 rounded-2xl bg-playful-violet/10 dark:bg-violet-950/20 border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200 uppercase tracking-wider">
              <Folder className="w-3.5 h-3.5 text-playful-violet dark:text-violet-400" />
              <span>Media Library</span>
            </div>
            <div className="text-base font-heading font-extrabold text-playful-dark dark:text-white">
              {storageStats
                ? formatBytes(storageStats.totalHistoryBytes)
                : "..."}
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {storageStats?.totalHistoryCount || 0} files in download history
            </p>
          </div>

          {/* App & Binaries Footprint */}
          <div className="p-3.5 rounded-2xl bg-playful-mint/15 dark:bg-emerald-950/20 border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-playful-mint dark:text-emerald-400" />
              <span>Engine Binaries</span>
            </div>
            <div className="text-base font-heading font-extrabold text-playful-dark dark:text-white">
              {storageStats ? formatBytes(storageStats.appDataBytes) : "..."}
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              yt-dlp, FFmpeg & configs
            </p>
          </div>

          {/* Temp Download Chunks */}
          <div className="p-3.5 rounded-2xl bg-playful-amber/15 dark:bg-amber-950/20 border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Temp Cache</span>
            </div>
            <div className="text-base font-heading font-extrabold text-playful-dark dark:text-white">
              {storageStats ? formatBytes(storageStats.tempCacheBytes) : "0 B"}
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Interrupted .part chunks
            </p>
          </div>
        </div>

        {/* 1-Click Clean Temp Cache Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm gap-3">
          <div>
            <h4 className="text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200">
              Temporary Cache & Chunk Cleaner
            </h4>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Purges orphan `.part` and `.ytdl` files left over from cancelled
              or interrupted downloads
            </p>
          </div>
          <button
            type="button"
            onClick={handleCleanTempCache}
            disabled={isCleaningCache}
            className="candy-btn px-4 py-2 text-xs font-bold shrink-0 flex items-center space-x-1.5 bg-playful-pink text-white disabled:opacity-50"
          >
            <Trash2
              className="w-3.5 h-3.5"
              strokeWidth={2.5}
            />
            <span>{isCleaningCache ? "Cleaning..." : "Purge Temp Cache"}</span>
          </button>
        </div>

        {/* Destination Path Selector */}
        <div className="space-y-2 pt-2 border-t-2 border-playful-dark/10 dark:border-slate-800">
          <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-playful-dark dark:text-slate-200">
            Default Download Folder
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#0d1117] border-2 border-playful-dark rounded-2xl text-xs font-mono font-medium text-playful-dark dark:text-slate-200 truncate shadow-pop-sm">
              {settings.defaultDownloadPath}
            </div>
            <button
              type="button"
              onClick={handleBrowse}
              className="candy-btn-secondary px-4 py-2.5 text-xs font-bold shrink-0"
            >
              Browse Folder...
            </button>
          </div>
        </div>
      </div>

      {/* Theme Appearance Setting */}
      <div className="sticker-card p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b-2 border-playful-dark/10 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-playful-pink/20 text-playful-dark dark:text-white flex items-center justify-center border-2 border-playful-dark shadow-pop-sm">
            <Palette
              className="w-5 h-5 text-playful-dark dark:text-white"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-playful-dark dark:text-white">
              Visual Appearance
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Choose your preferred color theme
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdateSettings({ darkMode: true })}
            className={`p-4 rounded-2xl border-2 border-playful-dark text-left transition-all flex items-center space-x-3 ${
              isDark
                ? "bg-playful-violet text-white shadow-pop font-bold"
                : "bg-slate-50 dark:bg-[#161b22] text-playful-dark dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] shadow-pop-sm"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 border-playful-dark ${isDark ? "bg-white text-playful-violet" : "bg-playful-violet/20 text-playful-violet"}`}
            >
              <Moon
                className="w-5 h-5"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <div className="text-xs font-heading font-extrabold uppercase tracking-wider">
                Midnight Dark (Recommended)
              </div>
              <div
                className={`text-[11px] ${isDark ? "text-violet-200" : "text-slate-500 dark:text-slate-400"}`}
              >
                Sleek dark obsidian with vibrant neon candy pop accents
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ darkMode: false })}
            className={`p-4 rounded-2xl border-2 border-playful-dark text-left transition-all flex items-center space-x-3 ${
              !isDark
                ? "bg-playful-amber text-playful-dark shadow-pop font-bold"
                : "bg-slate-50 dark:bg-[#161b22] text-playful-dark dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] shadow-pop-sm"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 border-playful-dark ${!isDark ? "bg-white text-playful-dark" : "bg-playful-amber/20 text-playful-dark dark:text-white"}`}
            >
              <Sun
                className="w-5 h-5"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <div className="text-xs font-heading font-extrabold uppercase tracking-wider">
                Paper Cream (Light)
              </div>
              <div
                className={`text-[11px] ${!isDark ? "text-slate-800" : "text-slate-500 dark:text-slate-400"}`}
              >
                Warm retro tactile paper background with bold shadows
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Downloader Engine Status & Updates */}
      <div className="sticker-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-playful-dark/10 dark:border-slate-800 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-playful-amber/20 text-playful-dark dark:text-white flex items-center justify-center border-2 border-playful-dark shadow-pop-sm">
              <Cpu
                className="w-5 h-5 text-playful-dark dark:text-white"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-playful-dark dark:text-white">
                Extraction Engines
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Offline binaries powering video/audio extraction and lossless
                remuxing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onUpdateEngine}
            disabled={isUpdatingEngine}
            className="candy-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isUpdatingEngine ? "animate-spin" : ""}`}
              strokeWidth={2.5}
            />
            <span>
              {isUpdatingEngine ? "Updating..." : "Check yt-dlp Updates"}
            </span>
          </button>
        </div>

        {engineMessage && (
          <div className="p-3 bg-playful-violet/10 dark:bg-playful-violet/20 border-2 border-playful-dark rounded-xl text-xs text-playful-dark dark:text-slate-200 font-mono font-bold shadow-pop-sm">
            {engineMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* yt-dlp status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border-2 border-playful-dark shadow-pop-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-playful-dark dark:text-slate-200">
                yt-dlp Engine
              </span>
              {engineStatus?.ytdlp?.available ? (
                <span className="flex items-center space-x-1 text-playful-dark bg-playful-mint px-2 py-0.5 rounded-lg border border-playful-dark text-[11px] font-extrabold">
                  <CheckCircle2
                    className="w-3.5 h-3.5"
                    strokeWidth={2.5}
                  />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-playful-dark bg-playful-amber px-2 py-0.5 rounded-lg border border-playful-dark text-[11px] font-extrabold">
                  <AlertTriangle
                    className="w-3.5 h-3.5"
                    strokeWidth={2.5}
                  />
                  <span>Auto-Installing</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono truncate">
              Version:{" "}
              {engineStatus?.ytdlp?.version || "Initializing on launch"}
            </p>
            {engineStatus?.ytdlp?.path && (
              <p
                className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate"
                title={engineStatus.ytdlp.path}
              >
                Path: {engineStatus.ytdlp.path}
              </p>
            )}
          </div>

          {/* ffmpeg status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border-2 border-playful-dark shadow-pop-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-playful-dark dark:text-slate-200">
                FFmpeg Processor
              </span>
              {engineStatus?.ffmpeg?.available ? (
                <span className="flex items-center space-x-1 text-playful-dark bg-playful-mint px-2 py-0.5 rounded-lg border border-playful-dark text-[11px] font-extrabold">
                  <CheckCircle2
                    className="w-3.5 h-3.5"
                    strokeWidth={2.5}
                  />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 text-xs font-medium">
                  <span>System Path</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono truncate">
              Status:{" "}
              {engineStatus?.ffmpeg?.version || "Available in Path / Bundled"}
            </p>
            {engineStatus?.ffmpeg?.path && (
              <p
                className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate"
                title={engineStatus.ffmpeg.path}
              >
                Path: {engineStatus.ffmpeg.path}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Storage & Default Paths */}
      <div className="sticker-card p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b-2 border-playful-dark/10 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-playful-mint/30 text-playful-dark dark:text-white flex items-center justify-center border-2 border-playful-dark shadow-pop-sm">
            <HardDrive
              className="w-5 h-5 text-playful-dark dark:text-white"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-playful-dark dark:text-white">
              Storage & Save Location
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Default destination folder on your machine where media files are
              saved
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-playful-dark dark:text-slate-200">
            Default Download Folder
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#0d1117] border-2 border-playful-dark rounded-2xl text-xs font-mono font-medium text-playful-dark dark:text-slate-200 truncate shadow-pop-sm">
              {settings.defaultDownloadPath}
            </div>
            <button
              type="button"
              onClick={handleBrowse}
              className="candy-btn-secondary px-4 py-2.5 text-xs font-bold shrink-0"
            >
              Browse Folder...
            </button>
          </div>
        </div>
      </div>

      {/* Default Extraction Behavior */}
      <div className="sticker-card p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b-2 border-playful-dark/10 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-playful-violet/20 text-playful-dark dark:text-white flex items-center justify-center border-2 border-playful-dark shadow-pop-sm">
            <Sliders
              className="w-5 h-5 text-playful-dark dark:text-white"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-playful-dark dark:text-white">
              Default Extraction Presets
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Applied automatically whenever you paste or analyze a link
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200">
              Default Audio Format
            </label>
            <select
              value={settings.defaultAudioFormat}
              onChange={(e) =>
                onUpdateSettings({ defaultAudioFormat: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-white dark:bg-[#161b22] border-2 border-playful-dark rounded-xl text-xs font-bold text-playful-dark dark:text-slate-100 shadow-pop-sm focus:outline-none focus:border-playful-violet"
            >
              <option value="mp3">MP3 (Universal 320 kbps)</option>
              <option value="m4a">M4A (Apple / AAC)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="opus">OPUS (Native Stream)</option>
              <option value="wav">WAV (Uncompressed)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200">
              Default Video Quality
            </label>
            <select
              value={settings.defaultVideoQuality}
              onChange={(e) =>
                onUpdateSettings({ defaultVideoQuality: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-white dark:bg-[#161b22] border-2 border-playful-dark rounded-xl text-xs font-bold text-playful-dark dark:text-slate-100 shadow-pop-sm focus:outline-none focus:border-playful-violet"
            >
              <option value="best">Best / Highest Available (4K/8K)</option>
              <option value="1080">1080p Full HD</option>
              <option value="720">720p HD</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200">
              Download Speed Limiter (Throttle)
            </label>
            <select
              value={settings.downloadSpeedLimit || "unlimited"}
              onChange={(e) =>
                onUpdateSettings({ downloadSpeedLimit: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-[#161b22] border-2 border-playful-dark rounded-xl text-xs font-bold text-playful-dark dark:text-slate-100 shadow-pop-sm focus:outline-none focus:border-playful-violet"
            >
              <option value="unlimited">Unlimited (Maximum Bandwidth)</option>
              <option value="1M">1 MB/s (Low Background)</option>
              <option value="5M">5 MB/s (Balanced)</option>
              <option value="10M">10 MB/s (Fast)</option>
              <option value="20M">20 MB/s</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-extrabold text-playful-dark dark:text-slate-200">
              Max Concurrent Downloads
            </label>
            <select
              value={settings.maxConcurrentDownloads || 3}
              onChange={(e) =>
                onUpdateSettings({
                  maxConcurrentDownloads: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-white dark:bg-[#161b22] border-2 border-playful-dark rounded-xl text-xs font-bold text-playful-dark dark:text-slate-100 shadow-pop-sm focus:outline-none focus:border-playful-violet"
            >
              <option value="1">1 Download at a time</option>
              <option value="2">2 Concurrent Downloads</option>
              <option value="3">3 Concurrent Downloads (Recommended)</option>
              <option value="5">5 Concurrent Downloads</option>
            </select>
          </div>
        </div>

        <div className="pt-3 space-y-2.5 border-t-2 border-playful-dark/10 dark:border-slate-800">
          <label className="flex items-center space-x-3 cursor-pointer text-xs font-bold text-playful-dark dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={settings.defaultEmbedThumbnail}
              onChange={(e) =>
                onUpdateSettings({ defaultEmbedThumbnail: e.target.checked })
              }
              className="w-4 h-4 rounded border-2 border-playful-dark text-playful-violet focus:ring-0 cursor-pointer"
            />
            <span>
              Always enable Album Art / Thumbnail embedding by default
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer text-xs font-bold text-playful-dark dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={settings.enableNotifications ?? true}
              onChange={(e) =>
                onUpdateSettings({ enableNotifications: e.target.checked })
              }
              className="w-4 h-4 rounded border-2 border-playful-dark text-playful-violet focus:ring-0 cursor-pointer"
            />
            <span>
              Show Windows desktop notification when a download completes
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer text-xs font-bold text-playful-dark dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={settings.minimizeToTray ?? false}
              onChange={(e) =>
                onUpdateSettings({ minimizeToTray: e.target.checked })
              }
              className="w-4 h-4 rounded border-2 border-playful-dark text-playful-violet focus:ring-0 cursor-pointer"
            />
            <span>Minimize to System Tray on close instead of exiting</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer text-xs font-bold text-playful-dark dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={settings.autoPasteClipboard}
              onChange={(e) =>
                onUpdateSettings({ autoPasteClipboard: e.target.checked })
              }
              className="w-4 h-4 rounded border-2 border-playful-dark text-playful-violet focus:ring-0 cursor-pointer"
            />
            <span>Auto-detect media links when copying to clipboard</span>
          </label>
        </div>
      </div>
    </div>
  );
};
