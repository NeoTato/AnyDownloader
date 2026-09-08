import React from "react";
import {
  Search,
  ClipboardPaste,
  X,
  Loader2,
  Globe2,
  Sparkles,
} from "lucide-react";

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  onInspect: (url: string) => void;
  isInspecting: boolean;
  onPasteClipboard: () => void;
}

const SUPPORTED_PLATFORMS = [
  { name: "YouTube", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { name: "TikTok", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  {
    name: "Facebook",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    name: "X / Twitter",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    name: "Instagram",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    name: "Reddit",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    name: "SoundCloud",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    name: "+1000 more",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
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
        className="relative flex items-center"
      >
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-indigo-400" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste media link here (e.g. YouTube, TikTok, Facebook, Twitter, Instagram...)"
            className="w-full pl-12 pr-28 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-xl transition-all text-sm sm:text-base"
          />

          <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1.5">
            {url ? (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onPasteClipboard}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-all shadow-sm"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-indigo-400" />
                <span>Paste</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isInspecting || !url.trim()}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              {isInspecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Supported Platforms tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <div className="flex items-center text-xs text-slate-400 mr-1">
          <Globe2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span>Supported:</span>
        </div>
        {SUPPORTED_PLATFORMS.map((platform) => (
          <span
            key={platform.name}
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${platform.color}`}
          >
            {platform.name}
          </span>
        ))}
      </div>
    </div>
  );
};
