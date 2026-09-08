import React from "react";
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
} from "lucide-react";
import type { AppSettings, EngineStatus } from "../types";

interface SettingsModalProps {
  settings: AppSettings | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectFolder: () => Promise<string | null>;
  engineStatus: EngineStatus | null;
  onUpdateEngine: () => void;
  isUpdatingEngine: boolean;
  engineMessage: string | null;
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
            Preferences & Engine Diagnostics
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Fine-tune download defaults, storage locations, theme appearance, and engine binaries
          </p>
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
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 border-playful-dark ${isDark ? "bg-white text-playful-violet" : "bg-playful-violet/20 text-playful-violet"}`}>
              <Moon className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xs font-heading font-extrabold uppercase tracking-wider">
                Midnight Dark (Recommended)
              </div>
              <div className={`text-[11px] ${isDark ? "text-violet-200" : "text-slate-500 dark:text-slate-400"}`}>
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
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 border-playful-dark ${!isDark ? "bg-white text-playful-dark" : "bg-playful-amber/20 text-playful-dark dark:text-white"}`}>
              <Sun className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xs font-heading font-extrabold uppercase tracking-wider">
                Paper Cream (Light)
              </div>
              <div className={`text-[11px] ${!isDark ? "text-slate-800" : "text-slate-500 dark:text-slate-400"}`}>
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
