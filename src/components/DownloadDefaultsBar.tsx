import React, { useState } from "react";
import {
  Folder,
  Sliders,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  HardDrive,
} from "lucide-react";
import type { AppSettings } from "../types";

interface DownloadDefaultsBarProps {
  settings: AppSettings | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectFolder: () => Promise<string | null>;
}

export const DownloadDefaultsBar: React.FC<DownloadDefaultsBarProps> = ({
  settings,
  onUpdateSettings,
  onSelectFolder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!settings) return null;

  const handleBrowse = async () => {
    const path = await onSelectFolder();
    if (path) {
      onUpdateSettings({ defaultDownloadPath: path });
    }
  };

  return (
    <div className="sticker-card p-3 sm:p-4 bg-white dark:bg-[#161b22] dark:border-slate-700 transition-all space-y-3">
      {/* Top row: Path & Preset toggle button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Storage path display */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-playful-yellow/20 dark:bg-yellow-950/50 text-slate-900 dark:text-yellow-400 border-2 border-playful-dark dark:border-slate-700 flex items-center justify-center shrink-0 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409]">
            <HardDrive
              className="w-4 h-4 text-slate-800 dark:text-yellow-400"
              strokeWidth={2.5}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-heading font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Download Destination
            </div>
            <div
              className="text-xs font-mono font-bold text-playful-dark dark:text-slate-200 truncate cursor-pointer hover:text-playful-violet dark:hover:text-violet-400 transition-colors"
              onClick={handleBrowse}
              title={settings.defaultDownloadPath}
            >
              {settings.defaultDownloadPath || "Standard Downloads Folder"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleBrowse}
            className="candy-btn-secondary px-3 py-1.5 text-xs font-heading font-bold"
          >
            <Folder
              className="w-3.5 h-3.5 mr-1 text-playful-violet dark:text-violet-400"
              strokeWidth={2.5}
            />
            <span>Change Folder</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-heading font-bold border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409] transition-playful ${
              isOpen
                ? "bg-playful-violet text-white"
                : "bg-white dark:bg-[#21262d] text-playful-dark dark:text-slate-200 hover:bg-playful-yellow dark:hover:bg-slate-700"
            }`}
          >
            <Sliders
              className="w-3.5 h-3.5"
              strokeWidth={2.5}
            />
            <span>Presets</span>
            {isOpen ? (
              <ChevronUp
                className="w-3.5 h-3.5 ml-0.5"
                strokeWidth={2.5}
              />
            ) : (
              <ChevronDown
                className="w-3.5 h-3.5 ml-0.5"
                strokeWidth={2.5}
              />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Default Extraction Presets */}
      {isOpen && (
        <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
          {/* Default Audio Format */}
          <div className="space-y-1 p-2.5 rounded-2xl bg-playful-muted dark:bg-[#21262d] border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409]">
            <label className="text-[10px] font-heading font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Default Audio Format
            </label>
            <select
              value={settings.defaultAudioFormat}
              onChange={(e) =>
                onUpdateSettings({ defaultAudioFormat: e.target.value as any })
              }
              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0d1117] border-2 border-playful-dark dark:border-slate-700 rounded-xl text-xs font-heading font-bold text-playful-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-playful-violet"
            >
              <option value="mp3">MP3 (320 kbps)</option>
              <option value="m4a">M4A (Apple / AAC)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="opus">OPUS (Native Stream)</option>
              <option value="wav">WAV (Uncompressed)</option>
            </select>
          </div>

          {/* Default Video Quality */}
          <div className="space-y-1 p-2.5 rounded-2xl bg-playful-muted dark:bg-[#21262d] border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409]">
            <label className="text-[10px] font-heading font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Default Video Quality
            </label>
            <select
              value={settings.defaultVideoQuality}
              onChange={(e) =>
                onUpdateSettings({ defaultVideoQuality: e.target.value as any })
              }
              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0d1117] border-2 border-playful-dark dark:border-slate-700 rounded-xl text-xs font-heading font-bold text-playful-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-playful-violet"
            >
              <option value="best">Best / Highest Resolution</option>
              <option value="2160">4K (2160p)</option>
              <option value="1440">2K (1440p)</option>
              <option value="1080">1080p FHD</option>
              <option value="720">720p HD</option>
            </select>
          </div>

          {/* Download Speed Limiter */}
          <div className="space-y-1 p-2.5 rounded-2xl bg-playful-muted dark:bg-[#21262d] border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409]">
            <label className="text-[10px] font-heading font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Speed Limiter
            </label>
            <select
              value={settings.downloadSpeedLimit || "unlimited"}
              onChange={(e) =>
                onUpdateSettings({ downloadSpeedLimit: e.target.value })
              }
              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0d1117] border-2 border-playful-dark dark:border-slate-700 rounded-xl text-xs font-heading font-bold text-playful-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-playful-violet"
            >
              <option value="unlimited">Unlimited (Max Speed)</option>
              <option value="1M">1 MB/s (Throttle)</option>
              <option value="5M">5 MB/s (Balanced)</option>
              <option value="10M">10 MB/s (Fast)</option>
              <option value="20M">20 MB/s</option>
            </select>
          </div>

          {/* Checkbox Presets */}
          <div className="p-2.5 rounded-2xl bg-playful-muted dark:bg-[#21262d] border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409] sm:col-span-2 lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-heading font-bold text-playful-dark dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.defaultEmbedThumbnail}
                  onChange={(e) =>
                    onUpdateSettings({
                      defaultEmbedThumbnail: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-2 border-playful-dark dark:border-slate-700 text-playful-violet focus:ring-playful-violet accent-playful-violet"
                />
                <ImageIcon
                  className="w-3.5 h-3.5 text-playful-violet dark:text-violet-400"
                  strokeWidth={2.5}
                />
                <span>Embed Album Art / Cover Thumbnail</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-heading font-bold text-playful-dark dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.autoPasteClipboard}
                  onChange={(e) =>
                    onUpdateSettings({ autoPasteClipboard: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-2 border-playful-dark dark:border-slate-700 text-playful-violet focus:ring-playful-violet accent-playful-violet"
                />
                <span>Auto-detect links from clipboard</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
