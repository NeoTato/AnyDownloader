import React from "react";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Folder,
  Loader2,
  Film,
  Music,
  Trash2,
  Clock,
  Zap,
} from "lucide-react";
import type { DownloadProgress } from "../types";

interface DownloadQueueProps {
  downloads: DownloadProgress[];
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenFile: (filePath: string) => void;
  onShowInFolder: (filePath: string) => void;
}

export const DownloadQueue: React.FC<DownloadQueueProps> = ({
  downloads,
  onCancel,
  onRemove,
  onOpenFile,
  onShowInFolder,
}) => {
  if (downloads.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
          <Download className="w-8 h-8 opacity-60" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-slate-200">
            No active downloads
          </h3>
          <p className="text-sm text-slate-400">
            Paste a media link in the Downloader tab and click Download to start
            extracting offline media.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-100">Active Queue</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
            {downloads.length} {downloads.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {downloads.map((item) => {
          const isCompleted = item.status === "completed";
          const isError = item.status === "error";
          const isCancelled = item.status === "cancelled";
          const isProcessing = item.status === "processing";
          const isDownloading = item.status === "downloading";

          return (
            <div
              key={item.id}
              className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800/80 shadow-lg space-y-3 transition-all hover:border-slate-700"
            >
              <div className="flex items-start gap-3.5">
                {/* Thumbnail / Mode icon */}
                <div className="relative w-20 h-14 sm:w-28 sm:h-18 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      {item.mode === "video" ? (
                        <Film className="w-6 h-6" />
                      ) : (
                        <Music className="w-6 h-6" />
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold uppercase text-white">
                    {item.mode}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-200 line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {isCompleted && item.filePath && (
                        <>
                          <button
                            onClick={() => onOpenFile(item.filePath!)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Play / Open file"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onShowInFolder(item.filePath!)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Show in destination folder"
                          >
                            <Folder className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {(isDownloading ||
                        isProcessing ||
                        item.status === "queued") && (
                        <button
                          onClick={() => onCancel(item.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Cancel download"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {(isCompleted || isError || isCancelled) && (
                        <button
                          onClick={() => onRemove(item.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Dismiss from queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phase & Status pill */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {isCompleted ? (
                      <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Download Complete</span>
                      </span>
                    ) : isError ? (
                      <span className="flex items-center space-x-1 text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Error</span>
                      </span>
                    ) : isCancelled ? (
                      <span className="flex items-center space-x-1 text-amber-400 font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelled</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-indigo-300 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>{item.phase || "Processing stream..."}</span>
                      </span>
                    )}

                    {/* Stats */}
                    {isDownloading && (
                      <div className="flex items-center space-x-3 text-slate-400 text-[11px] font-mono ml-auto">
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-indigo-400" />
                          <span>{item.speed}</span>
                        </div>
                        {item.eta && item.eta !== "--:--" && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>ETA {item.eta}</span>
                          </div>
                        )}
                        <span>{item.totalSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isError
                          ? "bg-rose-500"
                          : isCancelled
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 animate-pulse-subtle"
                    }`}
                    style={{
                      width: `${Math.max(1, Math.min(100, item.percent))}%`,
                    }}
                  />
                </div>

                {isError && item.error && (
                  <p className="text-[11px] text-rose-300 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 line-clamp-2">
                    {item.error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
