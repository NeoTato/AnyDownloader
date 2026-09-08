import React from "react";
import { ClipboardPaste, X, Loader2, Sparkles, Link2 } from "lucide-react";

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  onInspect: (url: string) => void;
  isInspecting: boolean;
  onPasteClipboard: () => void;
}

const SUPPORTED_PLATFORMS = [
  {
    name: "YouTube",
    bg: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/60",
  },
  {
    name: "TikTok",
    bg: "bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-900/60",
  },
  {
    name: "Instagram",
    bg: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/60",
  },
  {
    name: "Facebook",
    bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60",
  },
  {
    name: "X / Twitter",
    bg: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60",
  },
  {
    name: "SoundCloud",
    bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60",
  },
  {
    name: "Reddit",
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900/60",
  },
  {
    name: "+1,000 sites",
    bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60",
  },
];

export const UrlInput: React.FC<UrlInputProps> = ({
  url,
  setUrl,
  onInspect,
  isInspecting,
  onPasteClipboard,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onInspect(url.trim());
    }
  };

  return (
    <div className="w-full space-y-3">
      <form
        onSubmit={handleSubmit}
        className="relative"
      >
        <div className="sticker-card p-1.5 sm:p-2 flex items-center gap-2 bg-white dark:bg-[#161b22] dark:border-slate-700 transition-all focus-within:shadow-pop-lg focus-within:-translate-x-0.5 focus-within:-translate-y-0.5">
          {/* Icon Circle */}
          <div className="w-10 h-10 rounded-full bg-playful-muted dark:bg-[#21262d] border-2 border-playful-dark dark:border-slate-700 flex items-center justify-center text-playful-dark dark:text-slate-100 shrink-0 ml-1">
            <Link2
              className="w-5 h-5 text-playful-violet dark:text-violet-400"
              strokeWidth={2.5}
            />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any media URL (YouTube, TikTok, Instagram, X...)"
            className="flex-1 bg-transparent px-2 py-2 text-playful-dark dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-sans font-medium text-sm sm:text-base outline-none min-w-0"
          />

          {/* Clear or Paste Button */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {url ? (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Clear input"
              >
                <X
                  className="w-4 h-4"
                  strokeWidth={2.5}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={onPasteClipboard}
                className="candy-btn-secondary px-3 py-1.5 text-xs hidden sm:inline-flex"
                title="Paste link from clipboard"
              >
                <ClipboardPaste
                  className="w-3.5 h-3.5 mr-1 text-playful-violet dark:text-violet-400"
                  strokeWidth={2.5}
                />
                <span>Paste</span>
              </button>
            )}

            {/* Submit Candy Button */}
            <button
              type="submit"
              disabled={isInspecting || !url.trim()}
              className="candy-btn px-5 sm:px-6 py-2.5 text-sm"
            >
              {isInspecting ? (
                <>
                  <Loader2
                    className="w-4 h-4 mr-1.5 animate-spin"
                    strokeWidth={2.5}
                  />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles
                    className="w-4 h-4 mr-1.5 text-playful-yellow fill-playful-yellow"
                    strokeWidth={2.5}
                  />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Supported Platforms sticker chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        <span className="text-[11px] font-heading font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
          Supports:
        </span>
        {SUPPORTED_PLATFORMS.map((platform) => (
          <span
            key={platform.name}
            className={`text-[11px] font-heading font-bold px-2.5 py-0.5 rounded-full border-2 border-playful-dark dark:border-slate-700 shadow-pop-sm dark:shadow-[2px_2px_0px_#010409] transition-transform hover:-translate-y-0.5 ${platform.bg}`}
          >
            {platform.name}
          </span>
        ))}
      </div>
    </div>
  );
};
