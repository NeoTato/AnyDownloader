import React, { useState } from "react";
import {
  Folder,
  Sliders,
  ChevronDown,
  ChevronUp,
  Check,
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
    <div className="glass-panel rounded-2xl border border-slate-800/80 p-4 transition-all space-y-3">
      {/* Top row: Path & Preset toggle button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Storage path display */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Download Destination
            </div>
            <div
              className="text-xs font-mono text-slate-200 truncate cursor-pointer hover:text-indigo-300 transition-colors"
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
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <span>Change Folder</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isOpen
                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Default Presets</span>
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Default Extraction Presets */}
      {isOpen && (
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
          {/* Default Audio Format */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Default Audio Format
            </label>
            <select
              value={settings.defaultAudioFormat}
              onChange={(e) =>
                onUpdateSettings({ defaultAudioFormat: e.target.value as any })
              }
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="mp3">MP3 (High Quality 320k)</option>
              <option value="m4a">M4A (Apple / AAC)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="opus">OPUS (Native Stream)</option>
              <option value="wav">WAV (Uncompressed)</option>
            </select>
          </div>

          {/* Default Video Quality */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Default Video Quality
            </label>
            <select
              value={settings.defaultVideoQuality}
              onChange={(e) =>
                onUpdateSettings({ defaultVideoQuality: e.target.value as any })
              }
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="best">Best / Highest Resolution</option>
              <option value="2160">4K (2160p)</option>
              <option value="1440">2K (1440p)</option>
              <option value="1080">1080p FHD</option>
              <option value="720">720p HD</option>
            </select>
          </div>

          {/* Download Speed Limiter */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Speed Limiter (Throttle)
            </label>
            <select
              value={settings.downloadSpeedLimit || "unlimited"}
              onChange={(e) =>
                onUpdateSettings({ downloadSpeedLimit: e.target.value })
              }
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="unlimited">Unlimited (Max Speed)</option>
              <option value="1M">1 MB/s (Low Background)</option>
              <option value="5M">5 MB/s (Balanced)</option>
              <option value="10M">10 MB/s (Fast)</option>
              <option value="20M">20 MB/s</option>
            </select>
          </div>

          {/* Checkbox Presets */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-center sm:col-span-2 lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.defaultEmbedThumbnail}
                  onChange={(e) =>
                    onUpdateSettings({
                      defaultEmbedThumbnail: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Embed Album Art / Thumbnail</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.autoPasteClipboard}
                  onChange={(e) =>
                    onUpdateSettings({ autoPasteClipboard: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
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
