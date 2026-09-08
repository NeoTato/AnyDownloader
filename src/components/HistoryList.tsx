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
  Sparkles,
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
      <div className="sticker-card p-10 text-center space-y-4 max-w-md mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-playful-amber/20 text-playful-dark flex items-center justify-center mx-auto border-2 border-playful-dark shadow-pop-sm rotate-[-3deg]">
          <History className="w-8 h-8" strokeWidth={2.5} />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-heading font-extrabold text-xl text-playful-dark">
            No download history yet!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your downloaded tracks and videos will show up here for easy playback, location tracking, and 1-click folder access.
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
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold border-2 border-playful-dark shadow-pop-sm animate-in fade-in transition-all ${
            notice.type === "warning"
              ? "bg-playful-amber text-playful-dark"
              : notice.type === "info"
                ? "bg-playful-mint text-playful-dark"
                : "bg-playful-pink text-playful-dark"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {notice.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            ) : (
              <Info className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-black/10 rounded-lg transition-colors ml-2"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Search & Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-xl font-heading font-extrabold text-playful-dark flex items-center gap-2">
            <span>Download History</span>
            <Sparkles className="w-4 h-4 text-playful-violet" strokeWidth={2.5} />
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-playful-violet text-white font-mono font-bold border-2 border-playful-dark shadow-pop-sm">
            {history.length}
          </span>
          {missingCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-playful-amber text-playful-dark font-bold border-2 border-playful-dark shadow-pop-sm flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-playful-dark" strokeWidth={2.5} />
              <span>{missingCount} missing</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode filters */}
          <div className="flex items-center bg-white p-1 rounded-2xl border-2 border-playful-dark shadow-pop-sm text-xs">
            {(["all", "video", "audio"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1 rounded-xl font-bold uppercase transition-all ${
                  filterMode === m
                    ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                    : "text-slate-600 hover:text-playful-dark"
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
              className="p-2 bg-white hover:bg-slate-50 text-playful-dark rounded-xl text-xs font-bold border-2 border-playful-dark shadow-pop-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Refresh history and check file status"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}

          {/* Clean Missing button */}
          {missingCount > 0 && onCleanMissing && (
            <button
              onClick={onCleanMissing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-playful-amber hover:brightness-105 text-playful-dark rounded-xl text-xs font-bold border-2 border-playful-dark shadow-pop-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Remove deleted or moved files from history"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">
                Clean Missing ({missingCount})
              </span>
            </button>
          )}

          {/* Clear All button */}
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-1 px-3 py-1.5 bg-playful-pink/20 hover:bg-playful-pink text-playful-dark rounded-xl text-xs font-bold border-2 border-playful-dark shadow-pop-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Clear all history"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search downloaded media by title or format..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-playful-dark rounded-2xl text-xs sm:text-sm text-playful-dark placeholder-slate-400 font-medium shadow-pop-sm focus:outline-none focus:border-playful-violet transition-colors"
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
              className={`p-4 rounded-2xl border-2 border-playful-dark transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isMissing
                  ? "bg-amber-50/80 shadow-pop-amber"
                  : "bg-white shadow-pop hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                {/* Thumbnail */}
                <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border-2 border-playful-dark shadow-pop-sm">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className={`w-full h-full object-cover ${isMissing ? "opacity-60 grayscale-[40%]" : ""}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-playful-dark">
                      {item.mode === "video" ? (
                        <Film className="w-5 h-5 text-playful-violet" strokeWidth={2.5} />
                      ) : (
                        <Music className="w-5 h-5 text-playful-pink" strokeWidth={2.5} />
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-playful-dark text-[8px] font-extrabold uppercase text-white">
                    {item.mode}
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4
                      className={`font-heading font-extrabold text-sm line-clamp-1 ${
                        isMissing ? "text-slate-600" : "text-playful-dark"
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-slate-600">
                    <span className="px-2 py-0.5 rounded-lg bg-playful-violet/10 text-playful-violet font-mono font-bold text-[10px] border border-playful-dark">
                      {item.format} {item.quality}
                    </span>

                    {item.fileSize && (
                      <span className="flex items-center space-x-1 text-[11px] font-mono text-slate-600">
                        <HardDrive className="w-3 h-3 text-slate-500" strokeWidth={2.5} />
                        <span>{item.fileSize}</span>
                      </span>
                    )}

                    <span className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium">
                      <Calendar className="w-3 h-3" strokeWidth={2.5} />
                      <span>{dateStr}</span>
                    </span>

                    {isMissing && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-playful-amber text-playful-dark font-bold text-[10px] border border-playful-dark">
                        <AlertTriangle className="w-3 h-3 text-playful-dark" strokeWidth={2.5} />
                        <span>File Missing / Moved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handlePlay(item)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-playful-dark transition-all ${
                    isMissing
                      ? "bg-slate-100 text-slate-400 hover:text-playful-dark"
                      : "candy-btn text-white"
                  }`}
                  title={
                    isMissing
                      ? "File missing from disk (click for details)"
                      : "Play / Open file"
                  }
                >
                  <ExternalLink
                    className="w-3.5 h-3.5"
                    strokeWidth={2.5}
                  />
                  <span>Play</span>
                </button>

                <button
                  onClick={() => handleFolder(item)}
                  className="p-2 bg-white hover:bg-slate-50 text-playful-dark rounded-xl border-2 border-playful-dark shadow-pop-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title={
                    isMissing
                      ? "Open destination folder location"
                      : "Open folder location"
                  }
                >
                  <Folder className="w-4 h-4 text-playful-dark" strokeWidth={2.5} />
                </button>

                {onRedownload && (
                  <button
                    onClick={() => onRedownload(item.url)}
                    className="p-2 bg-white hover:bg-playful-mint/20 text-playful-dark rounded-xl border-2 border-playful-dark shadow-pop-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    title="Re-open link in Downloader to download again"
                  >
                    <RotateCcw className="w-4 h-4 text-playful-dark" strokeWidth={2.5} />
                  </button>
                )}

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 bg-white hover:bg-playful-pink/20 text-playful-dark rounded-xl border-2 border-playful-dark shadow-pop-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4 text-slate-600 hover:text-playful-dark" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
