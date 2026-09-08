# AnyDownloader — Complete Project Documentation

An offline-first, lossless media downloader desktop application built with **Electron**, **React 19**, **TypeScript**, and **Tailwind CSS**, powered locally by **yt-dlp** and **FFmpeg**.

---

## 📖 Table of Contents

1. [Overview & Motivation](#1-overview--motivation)
2. [Why AnyDownloader Preserves Maximum Quality](#2-why-anydownloader-preserves-maximum-quality)
3. [Architecture & How It Works](#3-architecture--how-it-works)
4. [Complete Feature Breakdown](#4-complete-feature-breakdown)
5. [Project File Structure](#5-project-file-structure)
6. [How to Run, Test, and Build](#6-how-to-run-test-and-build)
7. [Troubleshooting & Best Practices](#7-troubleshooting--best-practices)

---

## 1. Overview & Motivation

Web-based converters (e.g., standard "YouTube to MP3" or "TikTok to MP4" sites) have several critical flaws:

- **Aggressive Server Compression:** They re-encode media on weak cloud servers, degrading high frequencies in audio and introducing blocky compression artifacts in video.
- **Missing High Resolutions:** Video streams higher than 720p (such as 1080p, 1440p 2K, 4K, 8K) are stored on modern platforms as separate video and audio streams. Web converters often don't bother merging them and only provide lower-resolution streams.
- **Security & Reliability:** Online converters are frequently plagued with intrusive advertisements, popups, broken links, and download quotas.

**AnyDownloader** executes the extraction directly on your local computer using the open-source engines `yt-dlp` and `FFmpeg`.

---

## 2. Why AnyDownloader Preserves Maximum Quality

### Video: Lossless Remuxing (Stream-Copy)

- Platforms like YouTube, TikTok, and Twitter serve separate DASH/HLS audio and video tracks for high resolutions.
- AnyDownloader downloads the highest available video stream (e.g. 4K VP9/AV1/H.264) and highest available audio stream (Opus/AAC) and merges them locally into an `.mp4` or `.mkv` container using `FFmpeg` with zero re-encoding loss.

### Audio: High-Fidelity Extraction & Custom Album Art

- **MP3**: Encoded at constant/peak **320 kbps High Quality** (highest quality standard for MP3).
- **FLAC & WAV**: Pure lossless extraction.
- **OPUS**: Native source stream copy without any generational loss.
- **M4A / AAC**: Mobile-optimized, high-efficiency audio.
- **Cover Art Embedding Toggle**: A dedicated switch that embeds the high-resolution video thumbnail directly into the audio file’s ID3/MP4 tags so modern music players, smart cars, and smartphones automatically display album artwork.
- **Metadata Tagging**: Preserves artist, creator, title, and release year in the file header.

---

## 3. Architecture & How It Works

```
┌────────────────────────────────────────────────────────┐
│             React + TypeScript Frontend (UI)           │
│  (Tailwind CSS, Lucide Icons, Glassmorphism, HMR)      │
└──────────────────────────┬─────────────────────────────┘
                           │ IPC Bridge (`contextBridge` / `preload.ts`)
┌──────────────────────────▼─────────────────────────────┐
│                 Electron Main Process                  │
│  • App Lifecycle & Window Manager                      │
│  • Local Storage & Download History Manager            │
│  • Binary Manager (detects/downloads yt-dlp & FFmpeg)  │
│  • YtdlpRunner (spawns child processes & parses stdout)│
└──────────────────────────┬─────────────────────────────┘
                           │ Spawns locally on your machine
              ┌────────────┴────────────┐
              ▼                         ▼
         [ yt-dlp ]                [ FFmpeg ]
   (Stream metadata parser    (Lossless stream merger,
    & direct multi-platform    320k audio converter &
    media stream downloader)   album art embedder)
```

---

## 4. Complete Feature Breakdown

### 🎯 1. Smart URL & Clipboard Detection

- Automatically detects links when pasted or read from your clipboard.
- Supports 1,000+ platforms: **YouTube, TikTok, Facebook, Twitter/X, Instagram, Reddit, SoundCloud, Vimeo, Twitch, and more**.

### ⚙️ 2. Download Options & Configuration

- **Video Tab**:
  - Resolutions: _Best / Original_, _4K (2160p)_, _2K (1440p)_, _1080p FHD_, _720p HD_, _480p_, _360p_.
  - Containers: _MP4_, _MKV_, _WebM_.
  - Subtitles: Option to download and embed subtitles.
- **Audio Only Tab**:
  - Formats: _MP3_, _M4A_, _FLAC_, _OPUS_, _WAV_.
  - Bitrate: _320 kbps_, _256 kbps_, _192 kbps_, _128 kbps_, _Native_.
  - **Album Art / Cover Art Toggle**: Switch to embed thumbnail as official cover artwork.
  - **ID3 Metadata Customizer**: Expandable editor to customize Track Title, Artist Name, Album Name, Release Year, and Genre before downloading.
  - Metadata Tagging: Auto-tags Artist, Title, and Album.

### ✂️ 3. Timestamp / Clip Trimming (Cut Section)

- **Trim / Clip Section Switch**: Specify exact Start Time (e.g. `00:30`) and End Time (e.g. `02:15`).
- Uses `yt-dlp`'s native section downloader (`--download-sections`) and `FFmpeg` to download only that exact snippet without wasting bandwidth on the entire video.

### ✏️ 4. Editable Filename & Windows MAX_PATH Protection

- **Custom Filename Field**: Pre-filled with the media title, fully editable with a 1-click Reset button.
- **Safe Trimming**: Uses `--trim-filenames 120` and character sanitization (`\ / : * ? " < > |`) to prevent Windows path-length errors.

### 📁 4. Destination & Default Presets on Download Page

- **Download Destination Bar**: Displays current save folder with a 1-click **"Change Folder"** dialog.
- **Default Presets**: Expandable drawer to set your preferred default video resolution, default audio format, and default cover art toggle.

### 5. Batch & Playlist Downloading

- **Multi-Track Selection:** Paste a YouTube playlist, album, or multi-video link. The app automatically detects all entries and displays a scrollable batch manager.
- **Select / Deselect Controls:** Choose all tracks or individual items, set global formats (e.g. all to MP3 320k with album art), and batch queue them in 1 click.

### ⚡ 6. Download Speed Limiter & Concurrency Controls

- **Bandwidth Throttle:** Cap download speeds (_Unlimited, 1 MB/s, 5 MB/s, 10 MB/s, 20 MB/s_) using `yt-dlp --limit-rate` to save network bandwidth for other apps.
- **Concurrent Task Manager:** Configurable simultaneous downloads (1 to 5 concurrent streams).

### 🔔 7. Windows Native Notifications & System Tray Minimization

- **Toast Notifications:** Displays native Windows toast notifications when background downloads complete. Clicking the notification opens the file location directly.
- **System Tray:** Optional setting to minimize to the Windows taskbar tray on close.

### 📊 8. Live Download Queue

- Displays real-time download speed (MB/s), ETA countdown, downloaded/total size, and progress bar.
- Phase indicators: _Downloading stream_, _Lossless merging with FFmpeg_, _Converting audio_, _Embedding album cover art_, _Completed_.
- One-click Cancel button.

### 📜 9. Download History

- Searchable and filterable (All, Video, Audio).
- 1-click **Play** (opens in your default media player) and **Show in Folder** (opens Windows File Explorer to the exact file).

### 🔄 10. Self-Contained Engine & 1-Click yt-dlp Updater

- Automatically downloads standalone `yt-dlp` executable to the user data folder if missing on the system.
- Includes a **"Check yt-dlp Updates"** diagnostic tool in Settings to keep the engine up to date when video platforms change.

---

## 5. Project File Structure

```
any-downloader/
├── package.json                   # Dependencies, scripts, and build metadata
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.node.json             # Vite TypeScript configuration
├── vite.config.ts                 # Vite bundler with electron plugin
├── tailwind.config.js             # Tailwind CSS theme configuration
├── postcss.config.js              # PostCSS plugins
├── index.html                     # HTML entry point (bounded viewport)
├── README.md                      # Quick overview guide
├── DOCUMENTATION.md               # Complete architecture and usage manual
│
├── electron/                      # Electron Main (Node.js backend)
│   ├── main.ts                    # Main window lifecycle and IPC handlers
│   ├── preload.ts                 # Secure contextBridge API for React
│   ├── binManager.ts              # Local binary detector, installer, and updater
│   ├── ytdlpRunner.ts             # Metadata inspector, stream runner, progress parser
│   └── store.ts                   # Local JSON storage for history & settings
│
└── src/                           # React Renderer (Frontend UI)
    ├── main.tsx                   # React root entry point
    ├── App.tsx                    # Main container, tab switcher, and layout
    ├── index.css                  # Custom styling, dark theme, and scrollbars
    ├── types/
    │   └── index.ts               # Shared TypeScript interfaces
    ├── hooks/
    │   └── useDownloader.ts       # Application state and IPC communication hook
    └── components/
        ├── Header.tsx             # Top navigation & engine status indicator
        ├── UrlInput.tsx           # URL bar with paste & platform badges
        ├── MediaPreview.tsx       # Media card (thumbnail, author, resolutions)
        ├── OptionsPanel.tsx       # Video/Audio selectors, cover art toggle, filename
        ├── DownloadDefaultsBar.tsx# Download destination path & preset drawer
        ├── DownloadQueue.tsx      # Real-time progress cards with speed & ETA
        ├── HistoryList.tsx        # Searchable completed download history
        └── SettingsModal.tsx      # Engine diagnostics & 1-click updater
```

---

## 6. How to Run, Test, and Build

### Development Mode

```powershell
# 1. Install dependencies (first time only)
npm install

# 2. Start dev server and Electron app
npm run dev
```

### Packaging into a Standalone Windows Installer (.exe)

```powershell
npm run build
```

This will compile TypeScript, build the React production bundle, and generate the Windows desktop installer in the `dist/` directory.

---

## 7. Troubleshooting & Best Practices

1. **Frontend vs. Backend Changes:**
   - Changes in `src/` (React components) hot-reload instantly.
   - Changes in `electron/` (backend Node.js logic) require stopping the app (**Ctrl + C**) and restarting `npm run dev`.
2. **If a website changes its code and downloads fail:**
   - Open the **Settings** tab and click **"Check yt-dlp Updates"**. This will update the local engine to the latest release in seconds.
3. **Audio Cover Art in Music Players:**
   - Make sure the **"Embed Album Art / Thumbnail"** toggle is enabled before clicking Download. MP3, M4A, and FLAC will have the artwork embedded inside the file tags.
