import { spawn, ChildProcess } from "node:child_process";
import { spawn, exec, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import type { BinManager } from "./binManager";
import type {
  MediaInfo,
  DownloadOptions,
  DownloadProgress,
  HistoryItem,
} from "../src/types";

export class YtdlpRunner {
  private binManager: BinManager;
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private activeProcesses: Map<
    string,
    { child: ChildProcess; cancel: () => void }
  > = new Map();

  constructor(binManager: BinManager) {
    this.binManager = binManager;
  }

  private getYtdlpPath(): string {
    if (!this.binManager.ytdlpPath) {
      throw new Error(
        "yt-dlp engine is not available. Please install or download it in Settings.",
      );
    }
    return this.binManager.ytdlpPath;
  }

  public async inspectUrl(url: string): Promise<MediaInfo> {
    const ytdlp = this.getYtdlpPath();
    const args = [
      "--dump-single-json",
      "--no-warnings",
      "--flat-playlist",
      "--skip-download",
      url,
    ];

    return new Promise((resolve, reject) => {
      const child = spawn(ytdlp, args);
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      child.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      child.on("close", (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const raw = JSON.parse(stdout);
            const isPlaylist =
              raw._type === "playlist" ||
              (Array.isArray(raw.entries) && raw.entries.length > 0);

            let playlistEntries: any[] | undefined;
            if (isPlaylist && Array.isArray(raw.entries)) {
              playlistEntries = raw.entries
                .filter(Boolean)
                .map((e: any, idx: number) => {
                  let durStr: string | undefined;
                  if (typeof e.duration === "number") {
                    const m = Math.floor(e.duration / 60);
                    const s = Math.floor(e.duration % 60);
                    durStr = `${m}:${s.toString().padStart(2, "0")}`;
                  }
                  const trackUrl =
                    e.url ||
                    (e.id ? `https://www.youtube.com/watch?v=${e.id}` : url);
                  return {
                    id: e.id || String(idx),
                    url: trackUrl,
                    title: e.title || `Track ${idx + 1}`,
                    thumbnail:
                      e.thumbnail ||
                      e.thumbnails?.[0]?.url ||
                      raw.thumbnail ||
                      "",
                    duration: e.duration,
                    durationString: durStr,
                    uploader:
                      e.uploader ||
                      e.channel ||
                      raw.uploader ||
                      raw.channel ||
                      "Creator",
                  };
                });
            }

            const resolutionsSet = new Set<number>();
            if (Array.isArray(raw.formats)) {
              for (const f of raw.formats) {
                if (typeof f.height === "number" && f.height > 0) {
                  resolutionsSet.add(f.height);
                }
              }
            }

            const availableResolutions = Array.from(resolutionsSet).sort(
              (a, b) => b - a,
            );

            let durationString: string | undefined;
            if (typeof raw.duration === "number") {
              const mins = Math.floor(raw.duration / 60);
              const secs = Math.floor(raw.duration % 60);
              const hrs = Math.floor(mins / 60);
              const remMins = mins % 60;
              durationString =
                hrs > 0
                  ? `${hrs}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
                  : `${mins}:${secs.toString().padStart(2, "0")}`;
            }

            const info: MediaInfo = {
              id: raw.id || String(Date.now()),
              url: url,
              title:
                raw.title ||
                (isPlaylist
                  ? `Playlist (${playlistEntries?.length || 0} items)`
                  : "Untitled Media"),
              thumbnail: raw.thumbnail || playlistEntries?.[0]?.thumbnail || "",
              duration: raw.duration,
              durationString,
              uploader:
                raw.uploader ||
                raw.channel ||
                raw.creator ||
                raw.artist ||
                "Unknown Creator",
              uploaderUrl: raw.uploader_url || raw.channel_url,
              extractor: raw.extractor_key || raw.extractor,
              platform: raw.extractor_key || "Web",
              viewCount: raw.view_count,
              availableResolutions,
              hasAudio: raw.formats
                ? raw.formats.some(
                    (f: any) => f.vcodec === "none" || f.acodec !== "none",
                  )
                : true,
              hasVideo: raw.formats
                ? raw.formats.some((f: any) => f.vcodec !== "none")
                : true,
              isPlaylist,
              playlistCount: playlistEntries?.length,
              playlistEntries,
            };

            resolve(info);
          } catch (e: any) {
            reject(new Error(`Failed to parse media metadata: ${e.message}`));
          }
        } else {
          reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
        }
      });

      child.on("error", (err) => reject(err));
    });
  }

  public startDownload(
    options: DownloadOptions,
    onProgress: (p: DownloadProgress) => void,
    onComplete: (item: HistoryItem) => void,
    onError: (err: string) => void,
  ): { cancel: () => void } {
    const ytdlp = this.getYtdlpPath();
    const isAudio = options.mode === "audio";

    // Sanitize and limit filename length to prevent Windows MAX_PATH errors
    let filenameTemplate = "%(title).120s.%(ext)s";
    if (options.customFilename && options.customFilename.trim()) {
      const sanitized = options.customFilename
        .replace(/[\\/:*?"<>|]/g, "_")
        .trim()
        .slice(0, 120);
      if (sanitized) {
        filenameTemplate = `${sanitized}.%(ext)s`;
      }
    }

    const outputTemplate = path.join(options.downloadPath, filenameTemplate);

    const args: string[] = [
      "--newline",
      "--no-mtime",
      "--windows-filenames",
      "--trim-filenames",
      "120",
      "--progress-template",
      "PROGRESS:%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_estimate_str)s|%(progress.status)s",
      "-o",
      outputTemplate,
    ];

    if (this.binManager.ffmpegPath) {
      args.push("--ffmpeg-location", path.dirname(this.binManager.ffmpegPath));
    }

    if (isAudio) {
      args.push("-x");
      args.push("--audio-format", options.audioFormat);

      if (options.audioBitrate === "320") {
        args.push("--audio-quality", "0"); // 320k / best quality
      } else if (options.audioBitrate === "256") {
        args.push("--audio-quality", "256K");
      } else if (options.audioBitrate === "192") {
        args.push("--audio-quality", "192K");
      } else if (options.audioBitrate === "128") {
        args.push("--audio-quality", "128K");
      }

      // Feature requirement: Toggle album art / thumbnail embedding
      if (options.embedThumbnail) {
        args.push("--embed-thumbnail");
      }

      if (options.embedMetadata) {
        args.push("--embed-metadata");
      }
    } else {
      // Video mode
      if (options.videoQuality === "best") {
        args.push("-f", "bestvideo+bestaudio/best");
      } else {
        const h = options.videoQuality;
        args.push(
          "-f",
          `bestvideo[height<=?${h}]+bestaudio/best[height<=?${h}]/best`,
        );
      }

      args.push("--merge-output-format", options.videoContainer);

      if (options.embedThumbnail) {
        args.push("--embed-thumbnail");
      }

      if (options.embedMetadata) {
        args.push("--embed-metadata");
      }

      if (options.embedSubtitles) {
        args.push(
          "--write-subs",
          "--embed-subs",
          "--sub-langs",
          "all,-live_chat",
        );
      }
    }

    // Feature: Timestamp / Clip Trimming
    if (options.clipRange?.enabled) {
      const start = options.clipRange.startTime?.trim() || "0";
      const end = options.clipRange.endTime?.trim() || "inf";
      args.push("--download-sections", `*${start}-${end}`);
      args.push("--force-keyframes-at-cuts");
    }

    // Feature: Custom ID3 / Media Metadata (uses native parse-metadata to avoid FFmpeg quoting bugs)
    if (options.customMetadata) {
      const meta = options.customMetadata;
      if (meta.title) {
        args.push("--parse-metadata", `${meta.title}:%(title)s`);
      }
      if (meta.artist) {
        args.push("--parse-metadata", `${meta.artist}:%(artist)s`);
        args.push("--parse-metadata", `${meta.artist}:%(uploader)s`);
      }
      if (meta.album) {
        args.push("--parse-metadata", `${meta.album}:%(album)s`);
      }
      if (meta.year) {
        args.push("--parse-metadata", `${meta.year}:%(release_year)s`);
      }
      if (meta.genre) {
        args.push("--parse-metadata", `${meta.genre}:%(genre)s`);
      }

      if (!args.includes("--embed-metadata")) {
        args.push("--embed-metadata");
      }
    }

    // Feature: Download Speed Limiter (Bandwidth Throttle)
    if (options.speedLimit && options.speedLimit !== "unlimited") {
      args.push("--limit-rate", options.speedLimit);
    }

    // Pass Node.js as JS runtime for YouTube extraction
    args.push("--js-runtimes", "node");

    args.push(options.url);

    const progressState: DownloadProgress = {
      id: options.id,
      url: options.url,
      title: options.customFilename || options.title,
      thumbnail: options.thumbnail,
      mode: options.mode,
      status: "downloading",
      percent: 0,
      speed: "0 MB/s",
      eta: "--:--",
      totalSize: "Calculating...",
      downloadedSize: "0 MB",
      phase: isAudio ? "Preparing audio extraction" : "Connecting to streams",
      startedAt: Date.now(),
    };

    onProgress(progressState);

    let finalFilePath: string | undefined;
    let isCancelled = false;
    const child = spawn(ytdlp, args);
    this.activeProcesses.set(options.id, child);

    const cancel = () => {
      if (isCancelled) return;
      isCancelled = true;
      progressState.status = "cancelled";
      progressState.phase = "Cancelled by user";
      onProgress({ ...progressState });

      if (child && child.pid) {
        if (process.platform === "win32") {
          exec(`taskkill /pid ${child.pid} /T /F`, () => {});
        } else {
          try {
            child.kill("SIGKILL");
          } catch {
            // ignore
          }
        }
      }
      this.activeProcesses.delete(options.id);
    };

    this.activeProcesses.set(options.id, { child, cancel });

    let stderrBuffer = "";

    child.stdout.on("data", (data: Buffer) => {
      if (isCancelled) return;
      const text = data.toString();
      const lines = text.split(/\r?\n/);

      for (const line of lines) {
        if (!line.trim()) continue;

        if (line.startsWith("PROGRESS:")) {
          const parts = line.substring(9).split("|");
          if (parts.length >= 4) {
            const rawPercent = parts[0]?.replace("%", "").trim();
            const percentNum = parseFloat(rawPercent);
            if (!isNaN(percentNum)) {
              progressState.percent = Math.min(100, Math.max(0, percentNum));
            }
            progressState.speed = parts[1]?.trim() || progressState.speed;
            progressState.eta = parts[2]?.trim() || progressState.eta;
            progressState.totalSize =
              parts[3]?.trim() || progressState.totalSize;
            progressState.status = "downloading";
            onProgress({ ...progressState });
          }
          continue;
        }

        // Detect phases
        if (line.includes("[download] Destination:")) {
          const destPart = line.replace("[download] Destination:", "").trim();
          finalFilePath = destPart;
          progressState.phase = isAudio
            ? "Downloading audio track..."
            : "Downloading video stream...";
          onProgress({ ...progressState });
        } else if (line.includes("[Merger] Merging formats into")) {
          const match = line.match(/Merging formats into "(.+?)"/);
          if (match && match[1]) finalFilePath = match[1];
          progressState.phase = "Lossless merging with FFmpeg...";
          progressState.status = "processing";
          onProgress({ ...progressState });
        } else if (line.includes("[ExtractAudio] Destination:")) {
          const match = line.match(/Destination: (.+)/);
          if (match && match[1]) finalFilePath = match[1].trim();
          progressState.phase = `Converting audio to ${options.audioFormat.toUpperCase()}...`;
          progressState.status = "processing";
          onProgress({ ...progressState });
        } else if (
          line.includes("[EmbedThumbnail]") ||
          line.includes("[ThumbnailsConvertor]")
        ) {
          progressState.phase = "Embedding album cover art...";
          progressState.status = "processing";
          onProgress({ ...progressState });
        } else if (line.includes("[Metadata] Adding metadata")) {
          progressState.phase = "Adding track tags & metadata...";
          progressState.status = "processing";
          onProgress({ ...progressState });
        } else if (line.includes("[download] 100%")) {
          progressState.percent = 100;
          onProgress({ ...progressState });
        }
      }
    });

    child.stderr.on("data", (d: Buffer) => {
      if (isCancelled) return;
      stderrBuffer += d.toString();
    });

    child.on("close", (code) => {
      this.activeProcesses.delete(options.id);

      if (isCancelled || progressState.status === "cancelled") {
        return;
      }

      if (code === 0) {
        progressState.status = "completed";
        progressState.percent = 100;
        progressState.phase = "Completed";
        progressState.completedAt = Date.now();
        progressState.filePath = finalFilePath;
        onProgress({ ...progressState });

        let fileSizeStr = progressState.totalSize;
        if (finalFilePath && fs.existsSync(finalFilePath)) {
          try {
            const stats = fs.statSync(finalFilePath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);
            fileSizeStr = `${sizeInMB} MB`;
          } catch {
            // ignore
          }
        }

        const historyItem: HistoryItem = {
          id: options.id,
          title: options.customFilename || options.title,
          url: options.url,
          thumbnail: options.thumbnail,
          mode: options.mode,
          format:
            options.mode === "audio"
              ? options.audioFormat.toUpperCase()
              : options.videoContainer.toUpperCase(),
          quality:
            options.mode === "audio"
              ? `${options.audioBitrate} kbps`
              : options.videoQuality,
          filePath: finalFilePath || options.downloadPath,
          fileSize: fileSizeStr,
          downloadedAt: Date.now(),
        };

        onComplete(historyItem);
      } else {
        if (progressState.status !== "cancelled") {
          progressState.status = "error";
          progressState.error =
            stderrBuffer.trim() || `Download failed with exit code ${code}`;
          onProgress({ ...progressState });
          onError(progressState.error);
        }
        progressState.status = "error";
        progressState.error =
          stderrBuffer.trim() || `Download failed with exit code ${code}`;
        onProgress({ ...progressState });
        onError(progressState.error);
      }
    });

    child.on("error", (err) => {
      this.activeProcesses.delete(options.id);
      if (isCancelled || progressState.status === "cancelled") {
        return;
      }
      progressState.status = "error";
      progressState.error = err.message;
      onProgress({ ...progressState });
      onError(err.message);
    });

    return {
      cancel: () => {
        progressState.status = "cancelled";
        progressState.phase = "Cancelled by user";
        onProgress({ ...progressState });
        if (child) {
          child.kill("SIGTERM");
        }
        this.activeProcesses.delete(options.id);
      },
      cancel,
    };
  }

  public cancelDownload(id: string): boolean {
    const child = this.activeProcesses.get(id);
    if (child) {
      child.kill("SIGTERM");
    const entry = this.activeProcesses.get(id);
    if (entry) {
      entry.cancel();
      this.activeProcesses.delete(id);
      return true;
    }
    return false;
  }
}
