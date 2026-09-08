import React from "react";
import {
  Settings as SettingsIcon,
  Folder,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  HardDrive,
  Sliders,
  Sparkles,
  Info,
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-slate-100">
          Preferences & Engine Diagnostics
        </h2>
      </div>

      {/* Downloader Engine Status & Updates */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Extraction Engine
              </h3>
              <p className="text-xs text-slate-400">
                Offline binaries powering video/audio extraction and lossless
                remuxing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onUpdateEngine}
            disabled={isUpdatingEngine}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isUpdatingEngine ? "animate-spin text-indigo-400" : ""}`}
            />
            <span>
              {isUpdatingEngine ? "Updating..." : "Check yt-dlp Updates"}
            </span>
          </button>
        </div>

        {engineMessage && (
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 font-mono">
            {engineMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* yt-dlp status */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                yt-dlp Engine
              </span>
              {engineStatus?.ytdlp?.available ? (
                <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Missing / Installing</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">
              Version:{" "}
              {engineStatus?.ytdlp?.version || "Auto-installing on launch"}
            </p>
            {engineStatus?.ytdlp?.path && (
              <p
                className="text-[10px] text-slate-500 font-mono truncate"
                title={engineStatus.ytdlp.path}
              >
                Path: {engineStatus.ytdlp.path}
              </p>
            )}
          </div>

          {/* ffmpeg status */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                FFmpeg Processor
              </span>
              {engineStatus?.ffmpeg?.available ? (
                <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-slate-400 text-xs">
                  <span>System Path</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">
              Status:{" "}
              {engineStatus?.ffmpeg?.version || "Available in Path / Bundled"}
            </p>
            {engineStatus?.ffmpeg?.path && (
              <p
                className="text-[10px] text-slate-500 font-mono truncate"
                title={engineStatus.ffmpeg.path}
              >
                Path: {engineStatus.ffmpeg.path}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Storage & Default Paths */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <HardDrive className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              Storage & Download Path
            </h3>
            <p className="text-xs text-slate-400">
              Default destination on your computer where downloaded media files
              are saved
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Default Download Folder
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 truncate">
              {settings.defaultDownloadPath}
            </div>
            <button
              type="button"
              onClick={handleBrowse}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shrink-0"
            >
              Change...
            </button>
          </div>
        </div>
      </div>

      {/* Default Extraction Behavior */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              Default Extraction Presets
            </h3>
            <p className="text-xs text-slate-400">
              Default settings applied when you paste a new link
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Default Audio Format
            </label>
            <select
              value={settings.defaultAudioFormat}
              onChange={(e) =>
                onUpdateSettings({ defaultAudioFormat: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="mp3">MP3 (Universal 320 kbps)</option>
              <option value="m4a">M4A (Apple / AAC)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="opus">OPUS (Native Stream)</option>
              <option value="wav">WAV (Uncompressed)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Default Video Quality
            </label>
            <select
              value={settings.defaultVideoQuality}
              onChange={(e) =>
                onUpdateSettings({ defaultVideoQuality: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="best">Best / Highest Available (4K/8K)</option>
              <option value="1080">1080p Full HD</option>
              <option value="720">720p HD</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Download Speed Limiter (Throttle)
            </label>
            <select
              value={settings.downloadSpeedLimit || "unlimited"}
              onChange={(e) =>
                onUpdateSettings({ downloadSpeedLimit: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="unlimited">Unlimited (Maximum Bandwidth)</option>
              <option value="1M">1 MB/s (Low Background)</option>
              <option value="5M">5 MB/s (Balanced)</option>
              <option value="10M">10 MB/s (Fast)</option>
              <option value="20M">20 MB/s</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Max Concurrent Downloads
            </label>
            <select
              value={settings.maxConcurrentDownloads || 3}
              onChange={(e) =>
                onUpdateSettings({
                  maxConcurrentDownloads: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="1">1 Download at a time</option>
              <option value="2">2 Concurrent Downloads</option>
              <option value="3">3 Concurrent Downloads (Recommended)</option>
              <option value="5">5 Concurrent Downloads</option>
            </select>
          </div>
        </div>

        <div className="pt-2 space-y-2 border-t border-slate-800/80">
          <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settings.defaultEmbedThumbnail}
              onChange={(e) =>
                onUpdateSettings({ defaultEmbedThumbnail: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
            />
            <span>
              Always enable Album Art / Thumbnail embedding by default
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settings.enableNotifications ?? true}
              onChange={(e) =>
                onUpdateSettings({ enableNotifications: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
            />
            <span>Show Windows notification when a download completes</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settings.minimizeToTray ?? false}
              onChange={(e) =>
                onUpdateSettings({ minimizeToTray: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
            />
            <span>Minimize to System Tray on close instead of exiting</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settings.autoPasteClipboard}
              onChange={(e) =>
                onUpdateSettings({ autoPasteClipboard: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
            />
            <span>Auto-detect media links when copying to clipboard</span>
          </label>
        </div>
      </div>
    </div>
  );
};
