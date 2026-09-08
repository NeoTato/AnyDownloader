import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { UrlInput } from "./components/UrlInput";
import { MediaPreview } from "./components/MediaPreview";
import { OptionsPanel } from "./components/OptionsPanel";
import { PlaylistBatchModal } from "./components/PlaylistBatchModal";
import { DownloadDefaultsBar } from "./components/DownloadDefaultsBar";
import { DownloadQueue } from "./components/DownloadQueue";
import { HistoryList } from "./components/HistoryList";
import { SettingsModal } from "./components/SettingsModal";
import { useDownloader } from "./hooks/useDownloader";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Music2,
  Film,
  CheckCircle2,
  HardDriveDownload,
} from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<
    "downloader" | "queue" | "history" | "settings"
  >("downloader");

  const {
    url,
    setUrl,
    isInspecting,
    inspectError,
    mediaInfo,
    inspect,
    startDownload,
    cancelDownload,
    activeDownloads,
    removeDownloadFromQueue,
    history,
    refreshHistory,
    clearHistory,
    deleteHistoryItem,
    cleanMissingHistory,
    settings,
    updateSettings,
    selectDownloadFolder,
    openFile,
    showInFolder,
    engineStatus,
    updateEngine,
    isUpdatingEngine,
    engineMessage,
    readClipboard,
  } = useDownloader();

  // Refresh history whenever history tab is selected
  useEffect(() => {
    if (activeTab === "history") {
      refreshHistory();
    }
  }, [activeTab, refreshHistory]);

  // Re-download an item from History
  const handleRedownloadFromHistory = (targetUrl: string) => {
    setUrl(targetUrl);
    inspect(targetUrl);
    setActiveTab("downloader");
  };

  // Clipboard auto-detect
  const handlePasteClipboard = async () => {
    try {
      const clipText = await readClipboard();
      if (
        clipText &&
        (clipText.startsWith("http://") || clipText.startsWith("https://"))
      ) {
        setUrl(clipText.trim());
        inspect(clipText.trim());
      }
    } catch {
      // ignore
    }
  };

  const handleStartDownloadAndSwitch = (options: any) => {
    startDownload(options);
    setActiveTab("queue");
  };

  const handleStartBatchDownload = (items: any[]) => {
    for (const item of items) {
      startDownload(item);
    }
    setActiveTab("queue");
    setMediaInfo(null);
  };

  const activeQueueCount = activeDownloads.filter(
    (d) =>
      d.status === "downloading" ||
      d.status === "processing" ||
      d.status === "queued",
  ).length;

  return (
    <div className="h-screen bg-[#0b0f19] flex flex-col text-slate-100 font-sans select-none overflow-hidden">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={activeQueueCount}
        engineStatus={engineStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {activeTab === "downloader" && (
            <div className="space-y-6">
              {/* Hero Banner if nothing loaded yet */}
              {!mediaInfo && !isInspecting && (
                <div className="text-center space-y-3 pt-4 pb-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Next-Gen Offline Media Extractor</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                    Download Any Video or Audio in True Quality
                  </h1>
                  <p className="text-sm text-slate-400 max-w-xl mx-auto">
                    Bypass ad-filled websites and low-bitrate compression.
                    Extract lossless video up to 4K/8K and pristine
                    320kbps/lossless audio with cover art directly on your
                    computer.
                  </p>
                </div>
              )}

              {/* URL Input Bar */}
              <UrlInput
                url={url}
                setUrl={setUrl}
                onInspect={inspect}
                isInspecting={isInspecting}
                onPasteClipboard={handlePasteClipboard}
              />

              {/* Storage Path & Default Presets Bar */}
              <DownloadDefaultsBar
                settings={settings}
                onUpdateSettings={updateSettings}
                onSelectFolder={selectDownloadFolder}
              />

              {/* Media Preview Details */}
              {(mediaInfo || inspectError) && (
                <MediaPreview
                  media={mediaInfo}
                  error={inspectError}
                />
              )}

              {/* Download Options Panel (or Playlist Batch Modal) */}
              {mediaInfo &&
                (mediaInfo.isPlaylist &&
                (mediaInfo.playlistEntries?.length || 0) > 0 ? (
                  <PlaylistBatchModal
                    media={mediaInfo}
                    settings={settings}
                    defaultPath={settings?.defaultDownloadPath || ""}
                    onSelectFolder={selectDownloadFolder}
                    onStartBatchDownload={handleStartBatchDownload}
                    onCancel={() => setMediaInfo(null)}
                  />
                ) : (
                  <OptionsPanel
                    media={mediaInfo}
                    defaultPath={settings?.defaultDownloadPath || ""}
                    settings={settings}
                    onSelectFolder={selectDownloadFolder}
                    onStartDownload={handleStartDownloadAndSwitch}
                  />
                ))}

              {/* Feature Highlights cards */}
              {!mediaInfo && !isInspecting && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Film className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">
                      Lossless Remuxing
                    </h3>
                    <p className="text-xs text-slate-400">
                      Merges original 1080p, 2K, and 4K DASH video streams with
                      the best audio track with zero re-encoding loss.
                    </p>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Music2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">
                      Audio + Album Art
                    </h3>
                    <p className="text-xs text-slate-400">
                      Extract crystal clear MP3 (320 kbps), M4A, or FLAC with
                      custom toggle to embed high-res cover art.
                    </p>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">
                      100% Offline & Private
                    </h3>
                    <p className="text-xs text-slate-400">
                      Runs entirely on your local machine. No shady websites, no
                      data collection, no download throttles.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "queue" && (
            <DownloadQueue
              downloads={activeDownloads}
              onCancel={cancelDownload}
              onRemove={removeDownloadFromQueue}
              onOpenFile={openFile}
              onShowInFolder={showInFolder}
            />
          )}

          {activeTab === "history" && (
            <HistoryList
              history={history}
              onOpenFile={openFile}
              onShowInFolder={showInFolder}
              onDeleteItem={deleteHistoryItem}
              onClearHistory={clearHistory}
              onCleanMissing={cleanMissingHistory}
              onRedownload={handleRedownloadFromHistory}
              onRefresh={refreshHistory}
            />
          )}

          {activeTab === "settings" && (
            <SettingsModal
              settings={settings}
              onUpdateSettings={updateSettings}
              onSelectFolder={selectDownloadFolder}
              engineStatus={engineStatus}
              onUpdateEngine={updateEngine}
              isUpdatingEngine={isUpdatingEngine}
              engineMessage={engineMessage}
            />
          )}
        </div>
      </main>

      {/* Bottom Bar Status */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm px-6 py-2.5 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HardDriveDownload className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-[11px] truncate max-w-sm">
            Save Path: {settings?.defaultDownloadPath || "Standard Downloads"}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-[11px] text-slate-400">
            Engine:{" "}
            {engineStatus?.ytdlp?.available
              ? "yt-dlp Ready"
              : "Initializing Engine"}
          </span>
          <span className="text-[11px] text-slate-400">
            FFmpeg: {engineStatus?.ffmpeg?.available ? "Active" : "Available"}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
