export interface PlaylistItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  durationString?: string;
  uploader?: string;
}

export interface MediaInfo {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration?: number;
  durationString?: string;
  uploader?: string;
  uploaderUrl?: string;
  extractor?: string;
  platform?: string;
  viewCount?: number;
  availableResolutions: number[];
  hasAudio: boolean;
  hasVideo: boolean;
  isPlaylist?: boolean;
  playlistCount?: number;
  playlistEntries?: PlaylistItem[];
}

export type MediaMode = "video" | "audio";
export type VideoQuality =
  | "best"
  | "2160"
  | "1440"
  | "1080"
  | "720"
  | "480"
  | "360";
export type VideoContainer = "mp4" | "mkv" | "webm";
export type AudioFormat = "mp3" | "m4a" | "flac" | "opus" | "wav";
export type AudioBitrate = "320" | "256" | "192" | "128" | "native";

export interface DownloadOptions {
  id: string;
  url: string;
  title: string;
  customFilename?: string; // Optional custom/trimmed filename
  thumbnail?: string;
  mode: MediaMode;
  videoQuality: VideoQuality;
  videoContainer: VideoContainer;
  audioFormat: AudioFormat;
  audioBitrate: AudioBitrate;
  embedThumbnail: boolean; // Cover art toggle for audio/video
  embedMetadata: boolean;
  embedSubtitles: boolean;
  downloadPath: string;
  speedLimit?: string; // e.g. 'unlimited', '1M', '5M', '10M', '20M'
  // Feature: Timestamp trimming
  clipRange?: {
    enabled: boolean;
    startTime: string; // e.g. "00:30"
    endTime: string; // e.g. "02:15"
  };
  // Feature: Custom ID3 Audio/Video Metadata
  customMetadata?: {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    genre?: string;
  };
}

export type DownloadStatus =
  | "queued"
  | "fetching_meta"
  | "downloading"
  | "processing"
  | "completed"
  | "error"
  | "cancelled";

export interface DownloadProgress {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  mode: MediaMode;
  status: DownloadStatus;
  percent: number;
  speed: string;
  eta: string;
  totalSize: string;
  downloadedSize: string;
  phase: string;
  error?: string;
  filePath?: string;
  startedAt: number;
  completedAt?: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  mode: MediaMode;
  format: string;
  quality: string;
  filePath: string;
  fileSize?: string;
  downloadedAt: number;
  fileExists?: boolean;
}

export interface AppSettings {
  defaultDownloadPath: string;
  defaultMode: MediaMode;
  defaultVideoQuality: VideoQuality;
  defaultVideoContainer: VideoContainer;
  defaultAudioFormat: AudioFormat;
  defaultAudioBitrate: AudioBitrate;
  defaultEmbedThumbnail: boolean;
  defaultEmbedMetadata: boolean;
  maxConcurrentDownloads: number;
  downloadSpeedLimit: string; // 'unlimited' | '1M' | '5M' | '10M' | '20M'
  minimizeToTray: boolean;
  enableNotifications: boolean;
  autoPasteClipboard: boolean;
  darkMode: boolean;
}

export interface EngineStatus {
  ytdlp: {
    available: boolean;
    version: string | null;
    path: string | null;
    updating?: boolean;
    error?: string;
  };
  ffmpeg: {
    available: boolean;
    version: string | null;
    path: string | null;
    error?: string;
  };
}

export interface StorageStats {
  totalHistoryBytes: number;
  totalHistoryCount: number;
  appDataBytes: number;
  freeDiskBytes: number;
  totalDiskBytes: number;
  diskUsagePercent: number;
  tempCacheBytes: number;
  driveLetter: string;
}

export interface ElectronAPI {
  // Metadata & Engine
  inspectUrl: (
    url: string,
  ) => Promise<{ success: boolean; data?: MediaInfo; error?: string }>;
  getEngineStatus: () => Promise<EngineStatus>;
  updateYtdlp: () => Promise<{
    success: boolean;
    message: string;
    version?: string;
  }>;

  // Downloads
  startDownload: (
    options: DownloadOptions,
  ) => Promise<{ success: boolean; id: string; error?: string }>;
  cancelDownload: (id: string) => Promise<{ success: boolean }>;
  onDownloadProgress: (
    callback: (progress: DownloadProgress) => void,
  ) => () => void;

  // Settings & History
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  selectFolder: () => Promise<string | null>;
  getHistory: () => Promise<HistoryItem[]>;
  clearHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  cleanMissingHistory: () => Promise<HistoryItem[]>;
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  showInFolder: (
    filePath: string,
  ) => Promise<{ success: boolean; error?: string; warning?: string }>;

  // Storage & Disk Analytics
  getStorageStats: () => Promise<StorageStats>;
  cleanTempCache: () => Promise<{ cleanedBytes: number; deletedCount: number }>;

  // System / Clipboard
  readClipboard: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
