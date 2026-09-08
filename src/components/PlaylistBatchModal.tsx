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
  Image as ImageIcon,
  X,
  Search,
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
  const videoContainer: VideoContainer = settings?.defaultVideoContainer || "mp4";
  const [audioFormat, setAudioFormat] = useState<AudioFormat>(
    settings?.defaultAudioFormat || "mp3",
  );
  const audioBitrate: AudioBitrate = settings?.defaultAudioBitrate || "320";
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
    <div className="sticker-card p-6 space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-playful-dark/10 pb-4">
        <div className="flex items-start space-x-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-playful-amber/20 text-playful-dark border-2 border-playful-dark shadow-pop-sm flex items-center justify-center shrink-0 rotate-[-4deg]">
            <ListOrdered className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-playful-violet text-white border border-playful-dark shadow-pop-sm">
                Playlist / Batch Extractor
              </span>
              <span className="text-xs text-slate-600 font-mono font-bold">
                {entries.length} items found
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-playful-dark truncate">
              {media.title}
            </h3>
            {media.uploader && (
              <p className="text-xs text-slate-600 font-medium">By {media.uploader}</p>
            )}
          </div>
        </div>

        <button
          onClick={onCancel}
          className="p-1.5 text-slate-500 hover:text-playful-dark rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          title="Close"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Global Batch Format Configuration */}
      <div className="p-4 rounded-2xl bg-slate-50 border-2 border-playful-dark shadow-pop-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white p-1 rounded-2xl border-2 border-playful-dark shadow-pop-sm">
            <button
              type="button"
              onClick={() => setMode("audio")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === "audio"
                  ? "bg-playful-pink text-white border-2 border-playful-dark shadow-pop-sm"
                  : "text-slate-600 hover:text-playful-dark"
              }`}
            >
              <Music className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>All as Audio (MP3 320k)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("video")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === "video"
                  ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                  : "text-slate-600 hover:text-playful-dark"
              }`}
            >
              <Film className="w-3.5 h-3.5" strokeWidth={2.5} />
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
                  className="px-2.5 py-1.5 bg-white border-2 border-playful-dark rounded-xl text-xs text-playful-dark font-bold shadow-pop-sm"
                >
                  <option value="mp3">MP3</option>
                  <option value="m4a">M4A</option>
                  <option value="flac">FLAC</option>
                  <option value="opus">OPUS</option>
                </select>

                <label className="flex items-center space-x-1.5 cursor-pointer text-playful-dark font-bold text-xs select-none">
                  <input
                    type="checkbox"
                    checked={embedThumbnail}
                    onChange={(e) => setEmbedThumbnail(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-2 border-playful-dark text-playful-violet"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
                  <span>Cover Art</span>
                </label>
              </>
            ) : (
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border-2 border-playful-dark rounded-xl text-xs text-playful-dark font-bold shadow-pop-sm"
              >
                <option value="best">Original Best</option>
                <option value="1080">1080p FHD</option>
                <option value="720">720p HD</option>
              </select>
            )}
          </div>
        </div>

        {/* Save Folder */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-playful-dark/10">
          <span className="text-slate-600 truncate max-w-xs font-mono font-medium">
            Save to: {downloadPath || defaultPath}
          </span>
          <button
            type="button"
            onClick={handleBrowseFolder}
            className="text-playful-violet hover:underline font-bold"
          >
            Change Folder
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks or artists in this playlist..."
            className="w-full pl-11 pr-9 py-2 bg-white border-2 border-playful-dark rounded-2xl text-xs font-medium text-playful-dark placeholder-slate-400 shadow-pop-sm focus:outline-none focus:border-playful-violet"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-slate-400 hover:text-playful-dark p-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Filter Pills & Select Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
          {/* Filter Pills: All / Selected / Unselected */}
          <div className="flex items-center bg-white p-1 rounded-2xl border-2 border-playful-dark shadow-pop-sm">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                filterTab === "all"
                  ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                  : "text-slate-600 hover:text-playful-dark"
              }`}
            >
              All ({entries.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("selected")}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                filterTab === "selected"
                  ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                  : "text-slate-600 hover:text-playful-dark"
              }`}
            >
              Selected ({selectedIds.size})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("unselected")}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                filterTab === "unselected"
                  ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                  : "text-slate-600 hover:text-playful-dark"
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
              className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-playful-dark border-2 border-playful-dark shadow-pop-sm font-bold transition-all"
            >
              <CheckSquare className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
              <span>Select {searchQuery ? "Matching" : "All"}</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectVisible}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-playful-dark border-2 border-playful-dark shadow-pop-sm font-bold transition-all"
            >
              <Square className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Deselect {searchQuery ? "Matching" : "All"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks List (Scrollable) */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border-2 border-playful-dark border-dashed">
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
                className={`p-2.5 rounded-2xl border-2 border-playful-dark flex items-center space-x-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-violet-50/80 shadow-pop-sm text-playful-dark font-medium"
                    : "bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by container click
                  className="w-4 h-4 rounded border-2 border-playful-dark text-playful-violet shrink-0 cursor-pointer"
                />

                <span className="text-[11px] font-mono font-bold text-slate-500 w-5 text-right shrink-0">
                  #{index + 1}
                </span>

                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-12 h-8 object-cover rounded-lg shrink-0 bg-slate-100 border border-playful-dark"
                  />
                ) : (
                  <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-playful-dark border border-playful-dark">
                    <Music className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading font-extrabold truncate text-playful-dark">{item.title}</p>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-600">
                    {item.uploader && <span>{item.uploader}</span>}
                    {item.durationString && (
                      <span className="flex items-center space-x-0.5 font-mono">
                        <Clock className="w-2.5 h-2.5" strokeWidth={2.5} />
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
          className="w-full candy-btn py-3.5 text-white font-heading font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2"
        >
          <Download className="w-5 h-5" strokeWidth={2.5} />
          <span>
            Download {selectedIds.size} Selected{" "}
            {selectedIds.size === 1 ? "Track" : "Tracks"}
          </span>
          <Sparkles className="w-4 h-4 text-yellow-300" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
