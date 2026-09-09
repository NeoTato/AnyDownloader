# 📼 AnyDownloader — Lossless Offline Media Engine

<p align="center">
  <img src="public/icon.svg" width="128" height="128" alt="AnyDownloader Icon" />
</p>

<p align="center">
  <strong>The fast, playful, offline-first media downloader powered by yt-dlp & FFmpeg.</strong><br>
  Download high-fidelity video (4K/8K) and audio (320 kbps MP3, FLAC, M4A, OPUS) from 1,000+ platforms with zero quality loss.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-8B5CF6.svg?style=for-the-badge" alt="Version 1.1.0" />
  <img src="https://img.shields.io/badge/Electron-44.2.0-475569.svg?style=for-the-badge&logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6.svg?style=for-the-badge&logo=windows" alt="Windows" />
</p>

---

## Downloads & Installation

You can download the latest pre-built Windows binaries from the **[GitHub Releases](https://github.com/NeoTato/AnyDownloader/releases)** page:

| Package | Type | Description |
| :--- | :--- | :--- |
| **`AnyDownloader Setup 1.1.0.exe`** | **Installer** | Installs AnyDownloader, creates Desktop & Start Menu shortcuts, and supports auto-updates. |
| **`AnyDownloader 1.1.0.exe`** | **Portable** | Single standalone `.exe` — run immediately without installation from any folder or USB drive. |

---

##  Key Features

### 1. Lossless Video & High-Fidelity Audio
- **True Direct Remuxing**: Fetches uncompressed video and audio streams and merges them locally using **FFmpeg stream copy** (0% re-encoding quality degradation).
- **Video Qualities**: Best / 4K (2160p) / 2K (1440p) / 1080p FHD / 720p HD (MP4, MKV, WebM).
- **Audio Formats**: MP3 (up to 320 kbps), FLAC (Lossless), M4A / AAC, OPUS (Native stream copy), and WAV.

### 2. ID3 Album Artwork & Metadata Customizer
- **Cover Art Embedding**: Embeds high-resolution video thumbnails as album artwork directly inside MP3/M4A audio files for display in music players and smartphones.
- **Custom ID3 Tag Editor**: Edit Title, Artist, Album, Release Year, and Genre before downloading.

### 3. Timestamp Trimming / Clip Section
- Download only specific segments of long videos, concerts, or podcasts with custom `Start Time` and `End Time` inputs (MM:SS / HH:MM:SS format).

### 4. Playlist & Batch Extractor
- Detects playlists, albums, and multi-video links automatically.
- **Live Search & Filters**: Search tracks inside large playlists and filter by **All**, **Selected**, or **Unselected**.

### 5. Storage Analytics & Temp Cache Cleaner
- **Drive Free Space Bar**: Live capacity monitor for your download destination drive.
- **Media Library Footprint**: Tracks total downloaded size and file count.
- **1-Click Temp Cache Purge**: Safely removes orphan `.part` or `.ytdl` files left over from interrupted downloads.

### 6. Desktop Integration & Offline Binaries
- Windows native completion notifications and System Tray minimization.
- Automatic clipboard URL detection.
- Self-managed offline binaries for `yt-dlp` and `FFmpeg` with a 1-click in-app updater in Settings.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Desktop Runtime**: Electron 44, Vite + `vite-plugin-electron`
- **Packaging & Installer**: `electron-builder` (NSIS + Portable)
- **Extraction Engine**: `yt-dlp`
- **Multimedia Processing**: `FFmpeg`

---

## Development & Building

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/NeoTato/AnyDownloader.git
cd AnyDownloader
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build & Typecheck
```bash
npm run build
```

### 4. Package Standalone Windows Executables
```bash
npm run dist
```
The output installers and executables will be generated in the `release/` directory:
- `release/AnyDownloader Setup 1.1.0.exe`
- `release/AnyDownloader 1.1.0.exe`

---

## 📄 License
MIT License © 2026 [AnyDownloader](https://github.com/NeoTato/AnyDownloader)

