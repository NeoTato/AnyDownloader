import React from "react";
import {
  Download,
  ListOrdered,
  History,
  Settings as SettingsIcon,
  Sparkles,
  CheckCircle2,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setActiveTab("downloader")}
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 text-white">
            <Download className="w-5 h-5" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                AnyDownloader
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Lossless Offline Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero compression • High-fidelity media extraction
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("downloader")}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "downloader"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            onClick={() => setActiveTab("queue")}
            className={`relative flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "queue"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Queue</span>
            {queueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-indigo-400 text-slate-950 animate-pulse">
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Engine Status pill */}
        <div
          onClick={() => setActiveTab("settings")}
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
            isEngineReady
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
          }`}
          title={
            isEngineReady
              ? `yt-dlp: ${engineStatus?.ytdlp?.version || "Ready"}`
              : "Engine initializing or missing"
          }
        >
          {isEngineReady ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline font-mono">
                yt-dlp v{engineStatus?.ytdlp?.version || "Ready"}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>Engine Setup</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
