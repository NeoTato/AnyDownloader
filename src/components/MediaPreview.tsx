import React from "react";
import { User, Clock, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import type { MediaInfo } from "../types";

interface MediaPreviewProps {
  media: MediaInfo | null;
  error: string | null;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ media, error }) => {
  if (error) {
    return (
      <div className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-rose-200">
            Could not extract media info
          </p>
          <p className="text-xs text-rose-300/80 leading-relaxed font-mono">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!media) return null;

  const formattedViews = media.viewCount
    ? new Intl.NumberFormat("en-US", {
        notation: "compact",
        compactDisplay: "short",
      }).format(media.viewCount)
    : null;

  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start border border-slate-800 shadow-xl">
      {/* Thumbnail */}
      <div className="relative w-full md:w-56 h-36 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 group">
        {media.thumbnail ? (
          <img
            src={media.thumbnail}
            alt={media.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <span>No Thumbnail</span>
          </div>
        )}

        {media.durationString && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-sm rounded text-[11px] font-mono font-semibold text-white flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-300" />
            <span>{media.durationString}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600/90 backdrop-blur-sm rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
          {media.platform}
        </div>
      </div>

      {/* Metadata Details */}
      <div className="flex-1 min-w-0 space-y-2 py-1">
        <h3 className="font-bold text-base text-slate-100 line-clamp-2 leading-snug">
          {media.title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          {media.uploader && (
            <div className="flex items-center space-x-1 text-slate-300">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium truncate max-w-[200px]">
                {media.uploader}
              </span>
            </div>
          )}

          {formattedViews && (
            <div className="flex items-center space-x-1 text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{formattedViews} views</span>
            </div>
          )}

          <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready for offline download</span>
          </div>
        </div>

        {/* Available Resolutions pills */}
        {media.availableResolutions &&
          media.availableResolutions.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">
                Available streams:
              </span>
              {media.availableResolutions.slice(0, 6).map((res) => (
                <span
                  key={res}
                  className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  {res >= 2160
                    ? "4K (2160p)"
                    : res >= 1440
                      ? "2K (1440p)"
                      : `${res}p`}
                </span>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};
