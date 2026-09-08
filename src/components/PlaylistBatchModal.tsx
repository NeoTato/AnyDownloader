import React, { useState } from "react";
import {
  ListOrdered,
  CheckSquare,
  Square,
  Film,
  Music,
  Download,
  Clock,
  Sparkles,
  Folder,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Search,
  Check,
  Filter,
} from "lucide-react";
import type {
  MediaInfo,
  MediaMode,
  VideoQuality,
  VideoContainer,
  AudioFormat,
  AudioBitrate,
  DownloadOptions,
  PlaylistItem,
  AppSettings,
} from "../types";

interface PlaylistBatchModalProps {
  media: MediaInfo;
  settings: AppSettings | null;
  defaultPath: string;
  onSelectFolder: () => Promise<string | null>;
  onStartBatchDownload: (items: Omit<DownloadOptions, "id">[]) => void;
  onCancel: () => void;
}

export const PlaylistBatchModal: React.FC<PlaylistBatchModalProps> = ({
  media,
  settings,
  defaultPath,
  onSelectFolder,
  onStartBatchDownload,
  onCancel,
}) => {
  const entries: PlaylistItem[] = media.playlistEntries || [];

  // Search & Tab Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterTab, setFilterTab] = useState<"all" | "selected" | "unselected">(
    "all",
  );

  // Selected track IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(entries.map((e) => e.id)),
  );

  // Global format choices for the batch
  const [mode, setMode] = useState<MediaMode>(settings?.defaultMode || "audio");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(
    settings?.defaultVideoQuality || "1080",
  );
  const [videoContainer, setVideoContainer] = useState<VideoContainer>(
    settings?.defaultVideoContainer || "mp4",
  );
  const [audioFormat, setAudioFormat] = useState<AudioFormat>(
    settings?.defaultAudioFormat || "mp3",
  );
  const [audioBitrate, setAudioBitrate] = useState<AudioBitrate>(
    settings?.defaultAudioBitrate || "320",
  );
  const [embedThumbnail, setEmbedThumbnail] = useState<boolean>(
    settings ? settings.defaultEmbedThumbnail : true,
  );
  const [downloadPath, setDownloadPath] = useState<string>(
    settings?.defaultDownloadPath || defaultPath,
  );

  // Filtered tracks based on search and selected tab
  const filteredEntries = entries.filter((e) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      e.title.toLowerCase().includes(query) ||
      (e.uploader && e.uploader.toLowerCase().includes(query));

    const isSelected = selectedIds.has(e.id);
    if (filterTab === "selected") return matchesSearch && isSelected;
    if (filterTab === "unselected") return matchesSearch && !isSelected;
    return matchesSearch;
  });

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all currently visible / matching tracks
  const handleSelectVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredEntries.forEach((e) => next.add(e.id));
      return next;
    });
  };

  // Deselect all currently visible / matching tracks
  const handleDeselectVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredEntries.forEach((e) => next.delete(e.id));
      return next;
    });
  };

  const handleBrowseFolder = async () => {
    const selected = await onSelectFolder();
    if (selected) {
      setDownloadPath(selected);
    }
  };

  const handleSubmit = () => {
    const selectedEntries = entries.filter((e) => selectedIds.has(e.id));
    if (selectedEntries.length === 0) return;

    const downloadTasks: Omit<DownloadOptions, "id">[] = selectedEntries.map(
      (e) => ({
        url: e.url,
        title: e.title,
        customFilename: e.title,
        thumbnail: e.thumbnail || media.thumbnail,
        mode,
        videoQuality,
        videoContainer,
        audioFormat,
        audioBitrate,
        embedThumbnail: mode === "audio" ? embedThumbnail : true,
        embedMetadata: true,
        embedSubtitles: false,
        downloadPath: downloadPath || defaultPath,
        speedLimit: settings?.downloadSpeedLimit || "unlimited",
      }),
    );

    onStartBatchDownload(downloadTasks);
  };

  const unselectedCount = entries.length - selectedIds.size;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                Playlist / Batch Extractor
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {entries.length} items found
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-100 truncate">
              {media.title}
            </h3>
            {media.uploader && (
              <p className="text-xs text-slate-400">By {media.uploader}</p>
            )}
          </div>
        </div>

        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Global Batch Format Configuration */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode("audio")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "audio"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>All as Audio (MP3 320k)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("video")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "video"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>All as Video (MP4)</span>
            </button>
          </div>

          {/* Quick Format & Quality Selectors */}
          <div className="flex items-center space-x-2 text-xs">
            {mode === "audio" ? (
              <>
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium"
                >
                  <option value="mp3">MP3</option>
                  <option value="m4a">M4A</option>
                  <option value="flac">FLAC</option>
                  <option value="opus">OPUS</option>
                </select>

                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 text-xs">
                  <input
                    type="checkbox"
                    checked={embedThumbnail}
                    onChange={(e) => setEmbedThumbnail(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 bg-slate-800"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cover Art</span>
                </label>
              </>
            ) : (
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium"
              >
                <option value="best">Original Best</option>
                <option value="1080">1080p FHD</option>
                <option value="720">720p HD</option>
              </select>
            )}
          </div>
        </div>

        {/* Save Folder */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-400 truncate max-w-xs font-mono">
            Save to: {downloadPath || defaultPath}
          </span>
          <button
            type="button"
            onClick={handleBrowseFolder}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Change Folder
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks or artists in this playlist..."
            className="w-full pl-10 pr-9 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & Select Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
          {/* Filter Pills: All / Selected / Unselected */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterTab === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({entries.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("selected")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterTab === "selected"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Selected ({selectedIds.size})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("unselected")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterTab === "unselected"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unselected ({unselectedCount})
            </button>
          </div>

          {/* Quick Select/Deselect visible */}
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSelectVisible}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select {searchQuery ? "Matching" : "All"}</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectVisible}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Deselect {searchQuery ? "Matching" : "All"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks List (Scrollable) */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800/80">
            {searchQuery
              ? `No tracks matching "${searchQuery}" in ${filterTab} view.`
              : `No tracks found in ${filterTab} view.`}
          </div>
        ) : (
          filteredEntries.map((item, index) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item.id)}
                className={`p-2.5 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-950/40 border-indigo-500/40 text-slate-100"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by container click
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-800 shrink-0"
                />

                <span className="text-[11px] font-mono text-slate-500 w-5 text-right shrink-0">
                  #{index + 1}
                </span>

                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-12 h-8 object-cover rounded shrink-0 bg-slate-950 border border-slate-800"
                  />
                ) : (
                  <div className="w-12 h-8 rounded bg-slate-950 flex items-center justify-center shrink-0 text-slate-600">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.title}</p>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                    {item.uploader && <span>{item.uploader}</span>}
                    {item.durationString && (
                      <span className="flex items-center space-x-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{item.durationString}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Button */}
      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedIds.size === 0}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
        >
          <Download className="w-4 h-4" />
          <span>
            Download {selectedIds.size} Selected{" "}
            {selectedIds.size === 1 ? "Track" : "Tracks"}
          </span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </button>
      </div>
    </div>
  );
};
