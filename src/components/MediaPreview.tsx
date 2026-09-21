import React from "react";
import { User, Clock, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import type { MediaInfo } from "../types";
import React, { useState } from "react";
import {
  User,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import type { MediaInfo, AppSettings, CookieSource } from "../types";

interface MediaPreviewProps {
  media: MediaInfo | null;
  error: string | null;
  currentUrl?: string;
  settings?: AppSettings | null;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
  onRetryInspect?: (url: string) => void;
  onSelectCookieFile?: () => Promise<string | null>;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ media, error }) => {
export const MediaPreview: React.FC<MediaPreviewProps> = ({
  media,
  error,
  currentUrl,
  settings,
  onUpdateSettings,
  onRetryInspect,
  onSelectCookieFile,
}) => {
  const isAuthError = Boolean(
    error &&
    (error.toLowerCase().includes("age-restricted") ||
      error.toLowerCase().includes("sign in to confirm your age") ||
      error.toLowerCase().includes("cookies") ||
      error.toLowerCase().includes("private video") ||
      error.toLowerCase().includes("sign in") ||
      error.toLowerCase().includes("bot")),
  );

  const [selectedBrowser, setSelectedBrowser] = useState<CookieSource>(
    settings?.cookieSource && settings.cookieSource !== "none"
      ? settings.cookieSource
      : "zen",
  );
  const [isRetrying, setIsRetrying] = useState(false);

  const handleUnlockAndRetry = async () => {
    if (onUpdateSettings) {
      onUpdateSettings({ cookieSource: selectedBrowser });
    }
    if (onRetryInspect && currentUrl) {
      setIsRetrying(true);
      await onRetryInspect(currentUrl);
      setIsRetrying(false);
    }
  };

  const handleBrowseCookieFile = async () => {
    if (onSelectCookieFile && onUpdateSettings) {
      const file = await onSelectCookieFile();
      if (file) {
        onUpdateSettings({ cookieSource: "file", cookieFilePath: file });
        if (onRetryInspect && currentUrl) {
          setIsRetrying(true);
          await onRetryInspect(currentUrl);
          setIsRetrying(false);
        }
      }
    }
  };

  if (error) {
    if (isAuthError) {
      return (
        <div className="w-full sticker-card p-5 bg-amber-50 dark:bg-[#1a140a] border-2 border-amber-500/80 dark:border-amber-600 shadow-pop space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-amber-200 dark:border-amber-900/60 pb-3">
            <div className="flex items-start space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 border-2 border-playful-dark shadow-pop-sm mt-0.5">
                <KeyRound
                  className="w-5 h-5"
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-heading font-extrabold text-base text-amber-950 dark:text-amber-100">
                    Age-Restricted Video Detected
                  </h4>
                  <span className="text-[10px] font-heading font-extrabold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-400">
                    18+ Gate
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-300 font-medium mt-0.5">
                  YouTube requires account authentication to verify age. Select
                  your browser to borrow your active login session:
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedBrowser}
              onChange={(e) =>
                setSelectedBrowser(e.target.value as CookieSource)
              }
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-[#0d1117] border-2 border-playful-dark dark:border-slate-700 rounded-xl text-xs font-heading font-bold text-playful-dark dark:text-slate-100 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409] focus:outline-none focus:border-playful-violet"
            >
              <option value="zen">Zen Browser (Auto-detect profile)</option>
              <option value="chrome">Google Chrome</option>
              <option value="edge">Microsoft Edge</option>
              <option value="firefox">Mozilla Firefox</option>
              <option value="brave">Brave Browser</option>
              <option value="opera">Opera / Opera GX</option>
              <option value="vivaldi">Vivaldi</option>
              <option value="file">Custom cookies.txt File...</option>
            </select>

            {selectedBrowser === "file" ? (
              <button
                type="button"
                onClick={handleBrowseCookieFile}
                className="candy-btn px-5 py-2.5 text-xs flex items-center justify-center space-x-1.5"
              >
                <FolderOpen
                  className="w-4 h-4"
                  strokeWidth={2.5}
                />
                <span>Select File & Unlock</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUnlockAndRetry}
                disabled={isRetrying}
                className="candy-btn px-5 py-2.5 text-xs flex items-center justify-center space-x-1.5"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
                  strokeWidth={2.5}
                />
                <span>
                  {isRetrying
                    ? "Authenticating..."
                    : `Unlock with ${selectedBrowser === "zen" ? "Zen" : selectedBrowser.toUpperCase()} & Retry`}
                </span>
              </button>
            )}
          </div>

          <div className="p-3 bg-amber-100/60 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-900/60 text-[11px] text-amber-900/90 dark:text-amber-200">
            <span className="font-bold">Pro-tip for 100% bypass:</span> If your browser has database lock protection while open, you can export a <code className="bg-amber-200/60 dark:bg-black/40 px-1 py-0.5 rounded font-mono font-bold">cookies.txt</code> using any cookie exporter extension (e.g. <em>Get cookies.txt LOCALLY</em>) and select it above with our built-in JavaScript challenge solver (<code className="bg-amber-200/60 dark:bg-black/40 px-1 py-0.5 rounded font-mono font-bold">--remote-components ejs:github</code>).
          </div>

          {error && (
            <details className="text-[11px] text-amber-900/70 dark:text-amber-400/80 font-mono">
              <summary className="cursor-pointer font-bold hover:underline">
                View technical error details
              </summary>
              <p className="mt-1.5 p-2 rounded-lg bg-amber-100/50 dark:bg-black/30 border border-amber-300 dark:border-amber-900/50 break-all">
                {error}
              </p>
            </details>
          )}
        </div>
      );
    }

    return (
      <div className="w-full p-4 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border-2 border-playful-dark dark:border-rose-900 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409] text-rose-900 dark:text-rose-200 flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 border-2 border-playful-dark dark:border-rose-700">
          <AlertCircle
            className="w-4 h-4"
            strokeWidth={2.5}
          />
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-heading font-bold text-rose-950 dark:text-rose-100">
            Could not inspect media URL
          </p>
          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-mono">
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
    <div className="sticker-card p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start bg-white dark:bg-[#161b22] dark:border-slate-700">
      {/* Thumbnail Sticker */}
      <div className="relative w-full md:w-64 aspect-video md:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 shrink-0 border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409] group">
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
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-playful-dark text-white rounded-xl text-xs font-mono font-bold border-2 border-white dark:border-slate-700 shadow-sm flex items-center space-x-1">
            <Clock
              className="w-3 h-3 text-playful-yellow"
              strokeWidth={2.5}
            />
            <span>{media.durationString}</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-playful-yellow text-slate-950 border-2 border-playful-dark dark:border-slate-700 rounded-full text-[10px] font-heading font-extrabold uppercase tracking-wider shadow-pop-sm dark:shadow-[2px_2px_0px_#010409]">
          {media.platform || "Media"}
        </div>
      </div>

      {/* Metadata Details */}
      <div className="flex-1 min-w-0 space-y-3 py-1">
        <h3 className="font-heading font-extrabold text-base sm:text-lg text-playful-dark dark:text-slate-100 line-clamp-2 leading-snug">
          {media.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {media.uploader && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-playful-muted dark:bg-[#21262d] border-2 border-playful-dark dark:border-slate-700 rounded-full font-heading font-bold text-slate-800 dark:text-slate-200 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409]">
              <User
                className="w-3.5 h-3.5 text-playful-violet dark:text-violet-400"
                strokeWidth={2.5}
              />
              <span className="truncate max-w-[200px]">{media.uploader}</span>
            </div>
          )}

          {formattedViews && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-full font-heading font-semibold text-slate-600 dark:text-slate-300">
              <Eye
                className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                strokeWidth={2.5}
              />
              <span>{formattedViews} views</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border-2 border-playful-dark dark:border-emerald-800 font-heading font-bold shadow-pop-sm dark:shadow-[2px_2px_0px_#010409]">
            <CheckCircle2
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
              strokeWidth={2.5}
            />
            <span>Stream Verified</span>
          </div>
        </div>

        {/* Available Resolutions pills */}
        {media.availableResolutions &&
          media.availableResolutions.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-heading font-bold text-slate-500 dark:text-slate-400 mr-1">
                Quality options:
              </span>
              {media.availableResolutions.slice(0, 6).map((res) => (
                <span
                  key={res}
                  className="px-2 py-0.5 rounded-lg bg-playful-muted dark:bg-[#21262d] text-playful-dark dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono font-bold text-[10px]"
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
