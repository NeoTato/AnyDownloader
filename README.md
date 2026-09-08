# AnyDownloader — Offline High-Quality Media Downloader

An offline-first desktop application built with **Electron**, **React**, **TypeScript**, and **Tailwind CSS**, designed to download video and audio from 1,000+ platforms (YouTube, TikTok, Facebook, Twitter/X, Instagram, Reddit, SoundCloud, and more) with **zero quality compromise**.

---

## 🚀 Key Highlights & Quality Preservation

### 1. No Compromise on Video Quality (Lossless Remuxing)

- Traditional converter websites re-encode video on their servers, degrading resolution and color bitrates.
- AnyDownloader grabs the raw video stream (1080p FHD, 1440p 2K, 2160p 4K, 8K) and audio stream directly, merging them locally via **FFmpeg** with **stream copy (zero re-compression)**.

### 2. High-Fidelity Audio Extraction with Cover Art Toggle

- **Formats**: MP3 (320 kbps), M4A / AAC, FLAC (Lossless), OPUS (Direct native stream, 0% generation loss), WAV.
- **Album Art / Cover Art Toggle**: A dedicated switch to embed the video thumbnail into ID3/MP4 metadata tags so cover art displays automatically on your smartphone and media players.
- **Auto Metadata Tagging**: Preserves artist, title, and album metadata.

### 3. Local & Offline-First Engine

- Runs locally on your machine with self-managed `yt-dlp` and `FFmpeg` binaries.
- 1-Click `yt-dlp` engine updater in Settings ensures downloads never break when social platforms update their backend.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Desktop Runtime**: Electron 34, Vite + `vite-plugin-electron`
- **Downloader Engine**: `yt-dlp` (Local CLI process)
- **Multimedia Processing**: `FFmpeg` (Lossless remuxing, 320k audio encoding, album art embedding)

---

## 💻 Running the Application

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Mode

```bash
npm run dev
```

### 3. Build Desktop Application

```bash
npm run build
```
