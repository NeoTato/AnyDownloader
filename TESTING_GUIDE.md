# AnyDownloader — Step-by-Step Testing Guide & Test Cases

This testing guide provides complete, step-by-step test scenarios with sample URLs, expected behaviors, and verification checks for all features in **AnyDownloader**.

---

## 🧪 Test Case Matrix

| #         | Test Scenario                      | Feature Under Test                  | Expected Result                                                             |
| --------- | ---------------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| **TC-01** | High-Quality MP3 with Album Art    | Audio Extraction + Cover Art        | Clean 320 kbps MP3 with embedded cover art in ID3 tags                      |
| **TC-02** | Lossless 1080p/4K Video Remux      | Video Extraction + FFmpeg Remux     | Crisp video stream merged with best audio, zero recompression               |
| **TC-03** | Custom Filename & MAX_PATH Guard   | Filename Editor & Auto-Trim         | File saved with custom name without hitting Windows path errors             |
| **TC-04** | Custom ID3 Metadata Tags           | ID3 Tag Customizer                  | Track displays custom Artist, Album, Year, and Genre in music player        |
| **TC-05** | Video / Audio Clip Trimming        | Timestamp Trimmer & Duration Check  | Only the clipped segment is downloaded (e.g. 00:30 to 01:15)                |
| **TC-06** | Trimming Duration Out-of-Bounds    | Duration Validation Guard           | Error displayed, Download button disabled if times exceed length            |
| **TC-07** | Playlist & Batch Download          | Playlist Batch Modal                | Detects all tracks; allows selective or "Select All" batch queuing          |
| **TC-08** | Speed Limiter (Bandwidth Throttle) | `--limit-rate` Engine Flag          | Download speed throttles to selected cap (e.g. ~1 MB/s or 5 MB/s)           |
| **TC-09** | Background Notifications & Tray    | System Tray & Windows Toast         | Native Windows toast popup on completion, minimizable to tray               |
| **TC-10** | Download History & File Actions    | History List & File Explorer        | 1-click **Play** opens default player, **Folder** reveals file in Explorer  |
| **TC-11** | Live Download Cancellation         | Process Tree Termination (taskkill) | Instantly terminates process tree, marks queue item Cancelled               |
| **TC-12** | Missing & Moved File Detection     | Dynamic `fs.existsSync` & Cleanup   | Amber badge for deleted/moved files, warning banners, 1-click clean missing |

---

## 📋 Detailed Test Scenarios

### 🔹 Test Case 01: High-Quality MP3 with Album Art

1. **Action:** Paste a YouTube music video or song link (e.g., any official music video).
2. **Steps:**
   - Click **Analyze**.
   - In the **Download Configuration** card, select **Audio Only**.
   - Choose **MP3** (320 kbps).
   - Ensure the **"Embed Album Art / Thumbnail"** toggle is **ON**.
   - Click **Extract Audio (MP3 320k + Cover Art)**.
3. **Verification:**
   - Once completed, click the **Folder** icon to open the file in Windows Explorer.
   - Open the `.mp3` file in Windows Media Player, Groove Music, VLC, or iTunes.
   - ✅ **Check:** The high-resolution YouTube thumbnail appears as the song's album artwork and audio sounds crisp.

---

### 🔹 Test Case 02: Lossless Video Remuxing (1080p / 4K)

1. **Action:** Paste any 1080p or 4K video link.
2. **Steps:**
   - Click **Analyze**.
   - In the **Download Configuration** card, leave it on the **Video** tab.
   - Select **1080p FHD** or **Best / Original**.
   - Choose **MP4** or **MKV**.
   - Click **Download Video**.
3. **Verification:**
   - In the **Queue** tab, observe the phase: _Downloading video stream..._ followed by _Lossless merging with FFmpeg..._.
   - ✅ **Check:** The resulting file plays at full 1080p/4K resolution with perfectly synchronized audio.

---

### 🔹 Test Case 03: Custom Filename & Safe Trimming

1. **Action:** Paste a video with an excessively long title (or emojis/symbols).
2. **Steps:**
   - In the **Output Filename** input box, change the title to something short, e.g., `"Test Custom Name 123"`.
   - Click the **Reset** button to verify it restores the original video title.
   - Change it back to `"My Short Name"` and click **Download**.
3. **Verification:**
   - ✅ **Check:** The file saved on your hard drive is named `My Short Name.mp3` or `My Short Name.mp4`.

---

### 🔹 Test Case 04: Custom ID3 Metadata Tags

1. **Action:** Extract audio with custom song tags.
2. **Steps:**
   - Select **Audio Only** -> **MP3** or **FLAC**.
   - Click **"Customize ID3 Tags"** to expand the metadata editor.
   - Enter:
     - **Track Title:** `My Custom Song Title`
     - **Artist / Creator:** `My Favorite Artist`
     - **Album Name:** `Greatest Hits 2026`
     - **Year:** `2026`
     - **Genre:** `Rock`
   - Click **Extract Audio**.
3. **Verification:**
   - Right-click the downloaded `.mp3` file -> **Properties** -> **Details** tab (or check in VLC/Spotify).
   - ✅ **Check:** Title, Contributing Artist, Album, Year, and Genre match your custom tags.

---

### 🔹 Test Case 05: Timestamp Trimming / Clip Cutter

1. **Action:** Download only a 30-second snippet of a long video.
2. **Steps:**
   - Toggle the **"Trim / Clip Section"** switch to **ON**.
   - Enter **Start Time:** `00:10`
   - Enter **End Time:** `00:40`
   - Click **Download Video** or **Extract Audio**.
3. **Verification:**
   - Open the completed file in your media player.
   - ✅ **Check:** The file length is exactly 30 seconds long (starting from second 10 of the original video).

---

### 🔹 Test Case 06: Trimming Duration Validation Guard

1. **Action:** Test that typing an invalid or out-of-bounds duration is blocked.
2. **Steps:**
   - Toggle **"Trim / Clip Section"** to **ON**.
   - For a 3-minute video, type **End Time:** `99:00` (exceeds video length).
   - Or type **Start Time:** `02:00` and **End Time:** `01:00` (start after end).
3. **Verification:**
   - ✅ **Check:** A red alert appears _(e.g. "End Time exceeds maximum video duration of 03:00")_, and the primary Download button is safely disabled.
   - Click **"Reset Range"** -> the inputs reset to `00:00` and the video's actual end time.

---

### 🔹 Test Case 07: Playlist Search, Filter Tabs & Batch Download

1. **Action:** Paste any YouTube playlist link (e.g., `https://www.youtube.com/playlist?list=...`).
2. **Steps:**
   - Click **Analyze**.
   - In the **Playlist / Batch Extractor** view:
     - Type a keyword in the **Search tracks** bar (e.g., `"acoustic"` or artist name) -> verify matching results filter instantly.
     - Click **Select Matching** -> checks only the search results.
     - Switch to the **Selected** filter tab -> verify only checked tracks are visible for easy review.
     - Switch to the **Unselected** filter tab -> verify unchecked tracks are shown.
     - Choose **All as Audio (MP3 320k)**.
     - Click **Download Selected Tracks**.
3. **Verification:**
   - The app switches to the **Queue** tab.
   - ✅ **Check:** Selected tracks appear in the queue and download with the chosen format and album art.

---

### 🔹 Test Case 08: Download Speed Limiter

1. **Action:** Throttle download speed to save network bandwidth.
2. **Steps:**
   - In the **Default Presets** drawer (or in **Settings**), change **Speed Limiter** from _Unlimited_ to **1 MB/s**.
   - Start downloading a video.
3. **Verification:**
   - In the **Queue** tab, monitor the live speed indicator.
   - ✅ **Check:** The speed stays capped near `1.0 MB/s` (or selected rate) instead of using full connection speed.

---

### 🔹 Test Case 09: Windows Native Toast Notifications & System Tray

1. **Action:** Test background download notifications.
2. **Steps:**
   - In **Settings**, ensure **"Show Windows notification when a download completes"** is enabled.
   - Start a download and minimize the app window or switch to your browser.
3. **Verification:**
   - When the download finishes:
   - ✅ **Check:** A native Windows notification card pops up in the bottom-right of your screen showing `Download Complete! [Title]`.
   - Click the notification -> it opens Windows File Explorer directly to the file.

---

### 🔹 Test Case 10: Download History & Quick File Actions

1. **Action:** Test the History tab.
2. **Steps:**
   - Switch to the **History** tab.
   - Type in the search bar to filter your downloads.
   - Click the **Play** button next to a completed item.
   - Click the **Folder** icon next to a completed item.
3. **Verification:**
   - ✅ **Check:** **Play** instantly launches the file in your default media player; **Folder** opens File Explorer with the exact file selected.

---

### 🔹 Test Case 11: Live Download Cancellation

1. **Action:** Cancel an ongoing single or batch download.
2. **Steps:**
   - Start downloading any media link (e.g. a 1080p video or long audio file).
   - Switch to the **Queue** tab.
   - While the progress bar is active, click the red **Cancel (X)** button on the download card.
3. **Verification:**
   - ✅ **Check:** The card immediately updates to an amber state displaying **"Cancelled"** and phase **"Cancelled by user"**.
   - ✅ **Check:** The `yt-dlp.exe` and `ffmpeg.exe` processes stop immediately without throwing any error popups.
   - ✅ **Check:** The trash icon allows you to remove the cancelled item from the active queue.

---

### 🔹 Test Case 12: Missing & Moved File Detection in History

1. **Action:** Test that AnyDownloader handles deleted or moved files in History.
2. **Steps:**
   - Complete any download.
   - Open Windows File Explorer, locate the downloaded file, and either **delete** it or **move** it to another folder outside the downloads folder.
   - Return to AnyDownloader and switch to the **History** tab (or click the **Refresh** button in History).
3. **Verification:**
   - ✅ **Check:** The history card displays an amber **"File Missing / Moved"** badge and dims the thumbnail.
   - ✅ **Check:** The header shows a count of missing files and a **"Clean Missing (1)"** button.
   - ✅ **Check:** Click **Play** -> an inline alert explains the file was moved or deleted from disk.
   - ✅ **Check:** Click the **Re-download** button (circular arrow) -> the source URL loads in the Downloader tab ready to download again.
   - ✅ **Check:** Click **Clean Missing (1)** -> the missing record is purged from history while valid files remain untouched.
