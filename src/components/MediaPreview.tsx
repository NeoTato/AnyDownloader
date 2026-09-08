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
      <div className="w-full p-4 rounded-2xl bg-rose-100 border-2 border-playful-dark shadow-pop-sm text-rose-900 flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 border-2 border-playful-dark">
          <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-heading font-bold text-rose-950">
            Could not inspect media URL
          </p>
          <p className="text-xs text-rose-800 leading-relaxed font-mono">
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
    <div className="sticker-card p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start bg-white">
      {/* Thumbnail Sticker */}
      <div className="relative w-full md:w-64 aspect-video md:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 shrink-0 border-2 border-playful-dark shadow-pop-sm group">
        {media.thumbnail ? (
          <img
            src={media.thumbnail}
            alt={media.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-heading font-bold">
            <span>No Thumbnail</span>
          </div>
        )}

        {media.durationString && (
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-playful-dark text-white rounded-xl text-xs font-mono font-bold border-2 border-white shadow-sm flex items-center space-x-1">
            <Clock className="w-3 h-3 text-playful-yellow" strokeWidth={2.5} />
            <span>{media.durationString}</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-playful-yellow text-slate-950 border-2 border-playful-dark rounded-full text-[10px] font-heading font-extrabold uppercase tracking-wider shadow-pop-sm">
          {media.platform || "Media"}
        </div>
      </div>

      {/* Metadata Details */}
      <div className="flex-1 min-w-0 space-y-3 py-1">
        <h3 className="font-heading font-extrabold text-base sm:text-lg text-playful-dark line-clamp-2 leading-snug">
          {media.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {media.uploader && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-playful-muted border-2 border-playful-dark rounded-full font-heading font-bold text-slate-800 shadow-pop-sm">
              <User className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
              <span className="truncate max-w-[200px]">{media.uploader}</span>
            </div>
          )}

          {formattedViews && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-slate-100 border border-slate-300 rounded-full font-heading font-semibold text-slate-600">
              <Eye className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} />
              <span>{formattedViews} views</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border-2 border-playful-dark font-heading font-bold shadow-pop-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
            <span>Stream Verified</span>
          </div>
        </div>

        {/* Available Resolutions pills */}
        {media.availableResolutions &&
          media.availableResolutions.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-heading font-bold text-slate-500 mr-1">
                Quality options:
              </span>
              {media.availableResolutions.slice(0, 6).map((res) => (
                <span
                  key={res}
                  className="px-2 py-0.5 rounded-lg bg-playful-muted text-playful-dark border border-slate-300 font-mono font-bold text-[10px]"
                >
                  {res >= 2160
                    ? "4K"
                    : res >= 1440
                      ? "2K"
                      : res >= 1080
                        ? "1080p FHD"
                        : `${res}p`}
                </span>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};
