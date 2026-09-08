import React, { useState } from "react";
import {
  History,
  Search,
  ExternalLink,
  Folder,
  Trash2,
  Film,
  Music,
  Calendar,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  X,
  Info,
} from "lucide-react";
import type { HistoryItem } from "../types";

interface HistoryListProps {
  history: HistoryItem[];
  onOpenFile: (filePath: string) => Promise<any> | void;
  onShowInFolder: (filePath: string) => Promise<any> | void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onCleanMissing?: () => void;
  onRedownload?: (url: string) => void;
  onRefresh?: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onOpenFile,
  onShowInFolder,
  onDeleteItem,
  onClearHistory,
  onCleanMissing,
  onRedownload,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "video" | "audio">(
    "all",
  );
  const [notice, setNotice] = useState<{
    type: "info" | "warning" | "error";
    message: string;
  } | null>(null);

  const showNotice = (
    message: string,
    type: "info" | "warning" | "error" = "warning",
  ) => {
    setNotice({ type, message });
    setTimeout(() => {
      setNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const missingCount = history.filter(
    (item) => item.fileExists === false,
  ).length;

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.format.toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode === "all" || item.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const handlePlay = async (item: HistoryItem) => {
    if (item.fileExists === false) {
      showNotice(
        `"${item.title}" was not found at its original path. It may have been moved, renamed, or deleted from disk.`,
        "warning",
      );
      return;
    }
    const res: any = await onOpenFile(item.filePath);
    if (res && res.success === false) {
      showNotice(res.error || "Could not open file.", "warning");
    }
  };

  const handleFolder = async (item: HistoryItem) => {
    const res: any = await onShowInFolder(item.filePath);
    if (res && res.warning) {
      showNotice(res.warning, "info");
    } else if (res && res.success === false) {
      showNotice(res.error || "Destination folder does not exist.", "warning");
    }
  };

  if (history.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
          <History className="w-8 h-8 opacity-60" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-slate-200">
            No download history
          </h3>
          <p className="text-sm text-slate-400">
            Downloaded media will appear here for easy playback, location
            tracking, and quick access to your local files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border animate-in fade-in transition-all ${
            notice.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : notice.type === "info"
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {notice.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-100">Download History</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
            {history.length}
          </span>
          {missingCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{missingCount} missing</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode filters */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(["all", "video", "audio"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1 rounded-lg font-semibold uppercase transition-all ${
                  filterMode === m
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
              title="Refresh history and check file status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Clean Missing button */}
          {missingCount > 0 && onCleanMissing && (
            <button
              onClick={onCleanMissing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-semibold border border-amber-500/20 transition-all"
              title="Remove deleted or moved files from history"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                Clean Missing ({missingCount})
              </span>
            </button>
          )}

          {/* Clear All button */}
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/20 transition-all"
            title="Clear all history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search downloaded media by title or format..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const dateStr = new Date(item.downloadedAt).toLocaleDateString(
            undefined,
            {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          );
          const isMissing = item.fileExists === false;

          return (
            <div
              key={item.id}
              className={`glass-panel p-4 rounded-2xl border transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isMissing
                  ? "border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50"
                  : "border-slate-800/80 hover:border-slate-700/80"
              }`}
            >
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                {/* Thumbnail */}
                <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className={`w-full h-full object-cover ${isMissing ? "opacity-60 grayscale-[40%]" : ""}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      {item.mode === "video" ? (
                        <Film className="w-5 h-5" />
                      ) : (
                        <Music className="w-5 h-5" />
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-bold uppercase text-white">
                    {item.mode}
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4
                      className={`font-bold text-sm line-clamp-1 ${
                        isMissing ? "text-slate-300" : "text-slate-200"
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-500/20">
                      {item.format} {item.quality}
                    </span>

                    {item.fileSize && (
                      <span className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{item.fileSize}</span>
                      </span>
                    )}

                    <span className="flex items-center space-x-1 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </span>

                    {isMissing && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold text-[10px] border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>File Missing / Moved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handlePlay(item)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isMissing
                      ? "bg-slate-800/50 text-slate-500 border-slate-800 hover:border-amber-500/40 hover:text-amber-300"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700"
                  }`}
                  title={
                    isMissing
                      ? "File missing from disk (click for details)"
                      : "Play / Open file"
                  }
                >
                  <ExternalLink
                    className={`w-3.5 h-3.5 ${isMissing ? "text-slate-500" : "text-indigo-400"}`}
                  />
                  <span>Play</span>
                </button>

                <button
                  onClick={() => handleFolder(item)}
                  className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
                  title={
                    isMissing
                      ? "Open destination folder location"
                      : "Open folder location"
                  }
                >
                  <Folder className="w-4 h-4 text-slate-400" />
                </button>

                {onRedownload && (
                  <button
                    onClick={() => onRedownload(item.url)}
                    className="p-1.5 bg-slate-800/80 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-xl border border-slate-700 transition-all"
                    title="Re-open link in Downloader to download again"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-300 rounded-xl transition-all"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
