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
      <div className="sticker-card p-10 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-8 bg-white">
        <div className="w-16 h-16 rounded-2xl bg-playful-yellow border-2 border-playful-dark text-slate-950 flex items-center justify-center mx-auto shadow-pop rotate-[-3deg]">
          <Download className="w-8 h-8" strokeWidth={2.5} />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-heading font-extrabold text-xl text-playful-dark">
            Queue is Empty!
          </h3>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
            Paste a link in the Downloader tab and click Download to start extracting offline media in full fidelity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-xl font-heading font-extrabold text-playful-dark">
            Active Queue
          </h2>
          <span className="text-xs px-3 py-1 rounded-full bg-playful-violet text-white font-heading font-extrabold border-2 border-playful-dark shadow-pop-sm">
            {downloads.length} {downloads.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {downloads.map((item) => {
          const isCompleted = item.status === "completed";
          const isError = item.status === "error";
          const isCancelled = item.status === "cancelled";
          const isProcessing = item.status === "processing";
          const isDownloading = item.status === "downloading";

          return (
            <div
              key={item.id}
              className="sticker-card p-4 sm:p-5 bg-white border-2 border-playful-dark shadow-pop space-y-3.5 transition-playful"
            >
              <div className="flex items-start gap-3.5">
                {/* Thumbnail / Mode sticker */}
                <div className="relative w-20 h-14 sm:w-28 sm:h-20 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border-2 border-playful-dark shadow-pop-sm">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      {item.mode === "video" ? (
                        <Film className="w-6 h-6" strokeWidth={2.5} />
                      ) : (
                        <Music className="w-6 h-6" strokeWidth={2.5} />
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-playful-dark text-[8px] font-heading font-extrabold uppercase text-white border border-white">
                    {item.mode}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-heading font-bold text-sm text-playful-dark line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {isCompleted && item.filePath && (
                        <>
                          <button
                            onClick={() => onOpenFile(item.filePath!)}
                            className="p-1.5 bg-playful-muted hover:bg-playful-violet hover:text-white text-playful-dark rounded-xl border-2 border-playful-dark shadow-pop-sm transition-playful"
                            title="Play / Open file"
                          >
                            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => onShowInFolder(item.filePath!)}
                            className="p-1.5 bg-playful-muted hover:bg-playful-yellow text-playful-dark rounded-xl border-2 border-playful-dark shadow-pop-sm transition-playful"
                            title="Show in destination folder"
                          >
                            <Folder className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                        </>
                      )}

                      {(isDownloading ||
                        isProcessing ||
                        item.status === "queued") && (
                        <button
                          onClick={() => onCancel(item.id)}
                          className="p-1.5 bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-800 rounded-xl border-2 border-playful-dark shadow-pop-sm transition-playful"
                          title="Cancel download"
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      )}

                      {(isCompleted || isError || isCancelled) && (
                        <button
                          onClick={() => onRemove(item.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded-xl border border-slate-300 transition-colors"
                          title="Dismiss from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phase & Status pill */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {isCompleted ? (
                      <span className="flex items-center space-x-1 text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border-2 border-playful-dark font-heading font-bold shadow-pop-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                        <span>Completed</span>
                      </span>
                    ) : isError ? (
                      <span className="flex items-center space-x-1 text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-full border-2 border-playful-dark font-heading font-bold shadow-pop-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" strokeWidth={2.5} />
                        <span>Error</span>
                      </span>
                    ) : isCancelled ? (
                      <span className="flex items-center space-x-1 text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border-2 border-playful-dark font-heading font-bold shadow-pop-sm">
                        <XCircle className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.5} />
                        <span>Cancelled</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1.5 text-playful-dark bg-playful-violet/15 px-2.5 py-0.5 rounded-full border-2 border-playful-dark font-heading font-bold shadow-pop-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-playful-violet" strokeWidth={2.5} />
                        <span>{item.phase || "Processing stream..."}</span>
                      </span>
                    )}

                    {/* Stats */}
                    {isDownloading && (
                      <div className="flex items-center space-x-3 text-slate-600 text-[11px] font-mono font-bold ml-auto">
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-playful-violet" strokeWidth={2.5} />
                          <span>{item.speed}</span>
                        </div>
                        {item.eta && item.eta !== "--:--" && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                            <span>ETA {item.eta}</span>
                          </div>
                        )}
                        <span>{item.totalSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chunky Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-playful-muted rounded-full h-3 overflow-hidden border-2 border-playful-dark p-0.5">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isError
                          ? "bg-rose-500"
                          : isCancelled
                            ? "bg-amber-400"
                            : "bg-playful-violet"
                    }`}
                    style={{
                      width: `${Math.max(2, Math.min(100, item.percent))}%`,
                    }}
                  />
                </div>

                {isError && item.error && (
                  <p className="text-[11px] font-mono text-rose-900 bg-rose-100 p-2.5 rounded-xl border-2 border-playful-dark line-clamp-2">
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
