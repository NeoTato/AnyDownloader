# Issues, Solutions & Roadmap Log

This document records all the technical challenges encountered during the development of **AnyDownloader**, how each issue was diagnosed and resolved, and the suggestions and roadmap for future enhancements.

---

## 🛠️ Issues Encountered & How They Were Solved

### 1. Viewport Scrolling Locked in Settings & Main Views

- **Symptom:** In the Settings panel (and other long views), content expanded past the bottom of the window, but the user was unable to scroll up or down.
- **Root Cause:**
  - The outer wrapper in `src/App.tsx` used `min-h-screen` while `index.html`'s `<body>` had `overflow-hidden`.
  - In CSS Flexbox, without an explicit fixed height constraint (`h-screen` = 100vh) on the root ancestor, the `<main className="flex-1 overflow-y-auto">` container expanded indefinitely instead of triggering a scroll context.
- **Solution:**
  - Updated `index.html` to specify `<html class="dark h-screen">` and `<body class="h-screen overflow-hidden">`.
  - Updated `src/App.tsx` root container to `<div className="h-screen bg-[#0b0f19] flex flex-col overflow-hidden">`.
  - Content now scrolls smoothly with styled scrollbars across all screen sizes.

---

### 2. UX Optimization: Storage Path & Presets on the Download Page

- **Suggestion from User:** Navigating to Settings just to check the download folder or adjust default quality presets caused unnecessary friction.
- **Solution:**
  - Created [`src/components/DownloadDefaultsBar.tsx`](file:///c:/ProgrammingStuff/Projects/any-downloader/src/components/DownloadDefaultsBar.tsx).
  - Placed a clean **Download Destination** bar directly on the **Download** page with a 1-click folder chooser dialog.
  - Added an expandable **Default Presets** drawer where users can change their default audio format, default video resolution, and default cover art toggle.
  - Connected `OptionsPanel.tsx` to automatically inherit these active presets for newly analyzed links.

---

### 3. Windows Path Length Limit (`MAX_PATH`) & Long Title Errors

- **Symptom:** Downloading videos with exceptionally long titles (over 100+ characters) or special characters (`: * ? " < > | / \`) resulted in download failures on Windows.
- **Root Cause:** Windows has a default 260-character maximum path limit and rejects specific characters in filenames.
- **Solution:**
  - **Engine Level (`electron/ytdlpRunner.ts`):**
    - Added `--trim-filenames 120` to `yt-dlp` arguments to ensure no filename exceeds safe length boundaries.
    - Added automatic filename sanitization to replace invalid Windows characters with underscores `_`.
  - **User Control Level (`src/components/OptionsPanel.tsx`):**
    - Added an editable **Output Filename** input box pre-filled with the title.
    - Added a **Reset** button to restore the original title at any time.
    - Added a visual warning badge when title length exceeds 100 characters.

---

### 4. Custom Filename Not Applying on First Run (Electron Backend vs. Frontend HMR)

- **Symptom:** The user typed a custom filename in the UI, but the downloaded file on disk still used the original title.
- **Root Cause:**
  - In an Electron + Vite environment, React frontend modifications in `src/` hot-reload instantly in the UI.
  - However, backend Node.js code in `electron/` (such as `ytdlpRunner.ts`) is executed by the Electron main process, which only reloads when the Electron process restarts.
  - Additionally, `progressState.title` and `historyItem.title` were defaulting to `options.title` instead of `options.customFilename || options.title`.
- **Solution:**
  - Updated `ytdlpRunner.ts` and `useDownloader.ts` to consistently prioritize `options.customFilename || options.title`.
  - Restarted the Electron development process (`Ctrl+C` then `npm run dev`) to load the updated backend into memory.

### 5. FFmpeg Postprocessing "Error opening output files: Invalid argument" Fix

- **Symptom:** When downloading audio with custom metadata containing spaces or punctuation, FFmpeg failed during audio conversion with `Error opening output files: Invalid argument`.
- **Root Cause:** Passing raw string arguments via `--postprocessor-args ffmpeg:-metadata title=...` caused Windows CLI argument splitters to treat words after spaces as positional output filenames.
- **Solution:** Switched to `yt-dlp`'s native `--parse-metadata` system (e.g. `--parse-metadata "TITLE:%(title)s"`), which safely handles all spaces, emojis, and special characters without command-line escaping issues. Also added `--js-runtimes node` to eliminate YouTube JS runtime warnings.

### 6. Video Trimming Bounds & Duration Validation

- **Requirement:** Prevent users from entering start or end times that exceed the video's total duration or entering start times greater than end times.
- **Solution:** Built timestamp-to-seconds parser in `OptionsPanel.tsx` that validates `clipStart` and `clipEnd` against `media.duration`. If an invalid time or out-of-bounds duration is entered, an error banner appears, the download button is safely disabled, and a 1-click **"Reset Range"** button allows quick recovery.

### 7. React Render Crash & Error Boundary Protection

- **Symptom:** The app screen went blank/black upon analyzing a video link.
- **Root Cause:** A `ReferenceError` occurred inside `OptionsPanel.tsx` when a callback (`handleBrowseFolder`) was accidentally omitted during a line replacement.
- **Solution:** Restored `handleBrowseFolder` and wrapped the root application inside a custom `<ErrorBoundary>` ([`src/components/ErrorBoundary.tsx`](file:///c:/ProgrammingStuff/Projects/any-downloader/src/components/ErrorBoundary.tsx)) so any future UI exceptions render a user-friendly error card rather than a blank window.

### 8. Batch & Playlist Downloading (Completed ✅)

- **Feature:** Added automatic playlist detection via `yt-dlp --flat-playlist` and created [`PlaylistBatchModal.tsx`](file:///c:/ProgrammingStuff/Projects/any-downloader/src/components/PlaylistBatchModal.tsx). Users can select individual tracks with checkboxes or "Select All", configure global formats (MP3/MP4, quality, cover art), and queue the entire batch in 1 click.

### 9. Download Speed Limiter & Concurrency Manager (Completed ✅)

- **Feature:** Added bandwidth throttle controls (_Unlimited, 1 MB/s, 5 MB/s, 10 MB/s, 20 MB/s_) using `yt-dlp --limit-rate`, plus a configurable concurrent task manager (1 to 5 simultaneous streams) in Settings and on the Download page.

### 10. System Tray Minimization & Windows Native Notifications (Completed ✅)

- **Feature:** Added native Windows Toast Notifications that pop up when downloads finish in the background (clicking them reveals the file in File Explorer). Added System Tray integration with an option to keep downloads running in the background when closing the window.

### 11. Windows Process-Tree Cancellation (`taskkill /T /F`) Fix (Completed ✅)

- **Symptom:** Clicking the Cancel button (red X) during an active download did not stop `yt-dlp` or `ffmpeg`, and the UI did not transition to the Cancelled state.
- **Root Cause:** On Windows, Node.js `child.kill('SIGTERM')` does not terminate child processes spawned by the process wrapper (`yt-dlp.exe` and `ffmpeg.exe`).
- **Solution:** Updated `ytdlpRunner.ts` to execute `taskkill /pid <PID> /T /F` on Windows, immediately stop stream output parsing, and broadcast `{ status: 'cancelled', phase: 'Cancelled by user' }` to the renderer. Also added optimistic instant UI cancellation in `useDownloader.ts`.

### 12. Missing & Moved File Detection in History (Completed ✅)

- **Feature:** History now verifies on-disk file existence dynamically using `fs.existsSync`.
- **Missing File Badge:** Displays an amber **"File Missing / Moved"** badge with dimmed thumbnail if the file was deleted or moved outside the app.
- **Graceful Error Handling:** If the user clicks **Play** on a missing file, an inline warning banner appears rather than failing silently. Clicking **Folder** on a missing file automatically opens the parent directory if it exists.
- **Clean Missing & Re-download:** Added a 1-click **"Clean Missing (N)"** button to purge deleted records, and a 1-click **"Re-download"** button to re-queue any item back into the Downloader.

---

## 🚀 Summary of All Capabilities Built

- **100% Offline-First Media Engine:** Powered locally by `yt-dlp` and `FFmpeg` without cloud servers or lossy compression.
- **Full Video & Audio Support:** 4K/8K lossless stream remuxing, MP3 (320 kbps), M4A, FLAC, OPUS native stream, and uncompressed WAV.
- **Album Art & Tag Editor:** Embed high-res video thumbnails as official cover artwork, with full ID3 tag customization (Title, Artist, Album, Year, Genre).
- **Time Trimming & Clipping:** Native `--download-sections` integration with duration bounds validation.
- **Batch & Playlist Extraction:** Full multi-item selection with thumbnail previews and batch queue dispatching.
- **Queue & History:** Real-time speed and ETA tracking, cancellable tasks, and searchable history with 1-click **Play** and **Show in Folder**.
- **Self-Updating Engine:** 1-click `yt-dlp` binary updater to maintain compatibility across 1,000+ media sites.
