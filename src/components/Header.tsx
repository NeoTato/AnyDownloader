import React from "react";
import {
  Download,
  ListOrdered,
  History,
  Settings as SettingsIcon,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import type { EngineStatus } from "../types";

interface HeaderProps {
  activeTab: "downloader" | "queue" | "history" | "settings";
  setActiveTab: (tab: "downloader" | "queue" | "history" | "settings") => void;
  queueCount: number;
  engineStatus: EngineStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  engineStatus,
}) => {
  const isEngineReady = engineStatus?.ytdlp?.available;

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-playful-dark bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Sticker */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab("downloader")}
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-playful-violet border-2 border-playful-dark shadow-pop-sm text-white transition-transform group-hover:rotate-6 group-hover:scale-105">
            <Download className="w-5 h-5" strokeWidth={2.5} />
            <Sparkles className="w-3.5 h-3.5 absolute -top-1.5 -right-1.5 text-playful-yellow drop-shadow-sm fill-playful-yellow animate-bounce-subtle" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-playful-dark">
                AnyDownloader
              </span>
              <span className="text-[10px] uppercase font-heading font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-playful-yellow text-slate-900 border-2 border-playful-dark shadow-pop-sm hidden sm:inline-block">
                Lossless
              </span>
            </div>
            <p className="text-[11px] font-medium text-playful-mutedFg hidden md:block">
              Zero-compression media extractor
            </p>
          </div>
        </div>

        {/* Navigation Candy Tabs */}
        <nav className="flex items-center bg-playful-muted p-1 rounded-full border-2 border-playful-dark shadow-pop-sm gap-0.5 sm:gap-1">
          <button
            onClick={() => setActiveTab("downloader")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-heading font-bold transition-playful ${
              activeTab === "downloader"
                ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
            <span>Download</span>
          </button>

          <button
            onClick={() => setActiveTab("queue")}
            className={`relative flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-heading font-bold transition-playful ${
              activeTab === "queue"
                ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
            <span>Queue</span>
            {queueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-playful-pink text-white border border-playful-dark shadow-pop-sm">
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-heading font-bold transition-playful ${
              activeTab === "history"
                ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-heading font-bold transition-playful ${
              activeTab === "settings"
                ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </nav>

        {/* Engine Status Sticker */}
        <div
          onClick={() => setActiveTab("settings")}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-heading font-bold cursor-pointer border-2 border-playful-dark shadow-pop-sm transition-playful hover:translate-x-[-1px] hover:translate-y-[-1px] ${
            isEngineReady
              ? "bg-emerald-100 text-emerald-900"
              : "bg-amber-100 text-amber-900"
          }`}
          title={
            isEngineReady
              ? `yt-dlp: ${engineStatus?.ytdlp?.version || "Ready"}`
              : "Engine initializing or missing"
          }
        >
          {isEngineReady ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline font-mono">
                v{engineStatus?.ytdlp?.version || "Ready"}
              </span>
              <span className="md:hidden">Ready</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.5} />
              <span>Setup</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
