import { useState, useEffect } from "react";
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
  Sparkles,
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
  };

  const activeQueueCount = activeDownloads.filter(
    (d) =>
      d.status === "downloading" ||
      d.status === "processing" ||
      d.status === "queued",
  ).length;

  return (
    <div className="h-screen bg-playful-cream flex flex-col text-playful-dark font-sans select-none overflow-hidden">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={activeQueueCount}
        engineStatus={engineStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {activeTab === "downloader" && (
            <div className="space-y-6">
              {/* Hero Banner if nothing loaded yet */}
              {!mediaInfo && !isInspecting && (
                <div className="text-center space-y-2.5 pt-2 pb-1">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-playful-amber border-2 border-playful-dark shadow-pop-sm text-playful-dark text-xs font-bold rotate-[-1deg]">
                    <Sparkles className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
                    <span>Next-Gen Offline Media Extractor</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight text-playful-dark">
                    Download Any Video or Audio in True Quality
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-medium">
                    Extract lossless 4K/8K video and pristine 320kbps audio with cover art directly on your computer.
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
                    onCancel={() => {}}
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
      <footer className="w-full border-t-2 border-playful-dark bg-white px-6 py-2 text-xs text-playful-dark flex items-center justify-between font-medium">
        <div className="flex items-center space-x-2">
          <HardDriveDownload className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
          <span className="font-mono text-[11px] truncate max-w-sm">
            Save Path: {settings?.defaultDownloadPath || "Standard Downloads"}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-playful-mint border border-playful-dark"></span>
            <span>yt-dlp {engineStatus?.ytdlp?.available ? "Ready" : "Loading"}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-playful-violet border border-playful-dark"></span>
            <span>FFmpeg {engineStatus?.ffmpeg?.available ? "Active" : "Path"}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
