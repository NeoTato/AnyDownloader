import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import type {
  AppSettings,
  DownloadOptions,
  CookieSource,
  AudioFormat,
  VideoQuality,
  VideoContainer,
  AudioBitrate,
  MediaMode,
} from "../src/types";

export const MAX_URL_LENGTH = 2048;

export const ALLOWED_AUDIO_FORMATS = new Set<AudioFormat>([
  "mp3",
  "m4a",
  "wav",
  "flac",
  "opus",
]);

export const ALLOWED_VIDEO_QUALITIES = new Set<VideoQuality>([
  "best",
  "2160",
  "1440",
  "1080",
  "720",
  "480",
  "360",
]);

export const ALLOWED_COOKIE_SOURCES = new Set<CookieSource>([
  "none",
  "zen",
  "chrome",
  "edge",
  "firefox",
  "brave",
  "opera",
  "vivaldi",
  "file",
]);

export const ALLOWED_SPEED_LIMITS = new Set<string>([
  "unlimited",
  "50M",
  "20M",
  "10M",
  "5M",
  "2M",
  "1M",
]);

export const DANGEROUS_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".ps1",
  ".vbs",
  ".js",
  ".msi",
  ".com",
  ".scr",
  ".pif",
  ".sh",
  ".bash",
  ".reg",
]);

/**
 * Validates untrusted media URLs.
 * Rejects non-HTTP(S) protocols, embedded credentials, SSRF targets, and over-length strings.
 */
export function validateMediaUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Security Error: URL must be a string.");
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Security Error: URL cannot be empty.");
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error(
      `Security Error: URL length (${trimmed.length}) exceeds maximum allowed length of ${MAX_URL_LENGTH} characters.`
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Security Error: Malformed URL.");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`Security Error: unsupported URL protocol '${protocol}'`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(
      "Security Error: URLs containing embedded authentication credentials are not permitted."
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.startsWith("127.") ||
    hostname === "localhost.localdomain";

  if (isLoopback) {
    throw new Error("Security Error: localhost and loopback targets are rejected.");
  }

  return parsed.href;
}

/**
 * Checks whether a target file path is safely contained within a root directory,
 * preventing path traversal attacks and prefix matches.
 */
export function isInsideDirectory(
  targetPath: string,
  parentDir: string
): boolean {
  if (!targetPath || !parentDir) return false;
  const resolvedParent = path.resolve(parentDir);
  const resolvedTarget = path.resolve(targetPath);

  const rel = path.relative(resolvedParent, resolvedTarget);
  if (!rel) return true; // Target is the directory itself
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}

/**
 * Sanitizes filenames by stripping illegal filesystem characters, control codes,
 * and leading dots.
 */
export function sanitizeFilename(input: string): string {
  if (typeof input !== "string") return "media";
  let sanitized = input
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/^\.+/, "")
    .trim();

  if (!sanitized) {
    sanitized = "media";
  }
  return sanitized;
}

/**
 * Validates settings update objects at runtime.
 */
export function validateSettingsUpdate(
  update: unknown,
  currentSettings: AppSettings
): AppSettings {
  if (!update || typeof update !== "object") {
    throw new Error("Invalid settings payload: expected object.");
  }

  const raw = update as Record<string, any>;
  const next: AppSettings = { ...currentSettings };

  if (raw.defaultDownloadPath !== undefined) {
    if (typeof raw.defaultDownloadPath !== "string") {
      throw new Error("Invalid defaultDownloadPath: must be a string path.");
    }
    next.defaultDownloadPath = raw.defaultDownloadPath.trim();
  }

  if (raw.defaultAudioFormat !== undefined) {
    if (!ALLOWED_AUDIO_FORMATS.has(raw.defaultAudioFormat)) {
      throw new Error(
        `Invalid defaultAudioFormat: '${raw.defaultAudioFormat}'`
      );
    }
    next.defaultAudioFormat = raw.defaultAudioFormat;
  }

  if (raw.defaultVideoQuality !== undefined) {
    if (!ALLOWED_VIDEO_QUALITIES.has(raw.defaultVideoQuality)) {
      throw new Error(
        `Invalid defaultVideoQuality: '${raw.defaultVideoQuality}'`
      );
    }
    next.defaultVideoQuality = raw.defaultVideoQuality;
  }

  if (raw.defaultEmbedThumbnail !== undefined) {
    next.defaultEmbedThumbnail = Boolean(raw.defaultEmbedThumbnail);
  }

  if (raw.defaultEmbedMetadata !== undefined) {
    next.defaultEmbedMetadata = Boolean(raw.defaultEmbedMetadata);
  }

  if (raw.maxConcurrentDownloads !== undefined) {
    const num = Number(raw.maxConcurrentDownloads);
    if (!Number.isInteger(num) || num < 1 || num > 10) {
      throw new Error(
        "maxConcurrentDownloads must be an integer between 1 and 10."
      );
    }
    next.maxConcurrentDownloads = num;
  }

  if (raw.downloadSpeedLimit !== undefined) {
    if (
      typeof raw.downloadSpeedLimit !== "string" ||
      !ALLOWED_SPEED_LIMITS.has(raw.downloadSpeedLimit)
    ) {
      throw new Error(
        `Invalid downloadSpeedLimit: '${raw.downloadSpeedLimit}'`
      );
    }
    next.downloadSpeedLimit = raw.downloadSpeedLimit;
  }

  if (raw.darkMode !== undefined) {
    next.darkMode = Boolean(raw.darkMode);
  }
  if (raw.enableNotifications !== undefined) {
    next.enableNotifications = Boolean(raw.enableNotifications);
  }
  if (raw.minimizeToTray !== undefined) {
    next.minimizeToTray = Boolean(raw.minimizeToTray);
  }
  if (raw.autoPasteClipboard !== undefined) {
    next.autoPasteClipboard = Boolean(raw.autoPasteClipboard);
  }

  if (raw.cookieSource !== undefined) {
    if (!ALLOWED_COOKIE_SOURCES.has(raw.cookieSource)) {
      throw new Error(`Invalid cookieSource: '${raw.cookieSource}'`);
    }
    next.cookieSource = raw.cookieSource;
  }

  if (raw.cookieFilePath !== undefined) {
    if (typeof raw.cookieFilePath !== "string") {
      throw new Error("Invalid cookieFilePath: must be a string.");
    }
    next.cookieFilePath = raw.cookieFilePath.trim();
  }

  return next;
}

/**
 * Validates and sanitizes DownloadOptions from IPC.
 */
export function validateDownloadOptions(
  raw: unknown,
  approvedDownloadPath: string
): DownloadOptions {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid download options: expected object.");
  }

  const input = raw as Record<string, any>;
  const validUrl = validateMediaUrl(input.url);

  const id =
    typeof input.id === "string" && input.id.trim()
      ? input.id.replace(/[^a-zA-Z0-9_-]/g, "")
      : randomUUID();

  const title =
    typeof input.title === "string" ? input.title.slice(0, 300) : "Media";

  let customFilename: string | undefined;
  if (typeof input.customFilename === "string" && input.customFilename.trim()) {
    customFilename = sanitizeFilename(input.customFilename);
  }

  let downloadPath = approvedDownloadPath;
  if (typeof input.downloadPath === "string" && input.downloadPath.trim()) {
    const candidate = path.resolve(input.downloadPath.trim());
    if (
      isInsideDirectory(candidate, approvedDownloadPath) ||
      fs.existsSync(candidate)
    ) {
      downloadPath = candidate;
    }
  }

  const mode: MediaMode =
    input.mode === "audio" ? "audio" : "video";
  const videoQuality: VideoQuality = ALLOWED_VIDEO_QUALITIES.has(
    input.videoQuality
  )
    ? input.videoQuality
    : "best";
  const videoContainer: VideoContainer =
    input.videoContainer === "mkv" ||
    input.videoContainer === "webm" ||
    input.videoContainer === "gif"
      ? input.videoContainer
      : "mp4";
  const audioFormat: AudioFormat = ALLOWED_AUDIO_FORMATS.has(input.audioFormat)
    ? input.audioFormat
    : "mp3";
  const audioBitrate: AudioBitrate = [
    "128",
    "192",
    "256",
    "320",
    "native",
  ].includes(input.audioBitrate)
    ? input.audioBitrate
    : "320";

  return {
    id,
    url: validUrl,
    title,
    thumbnail: typeof input.thumbnail === "string" ? input.thumbnail : undefined,
    customFilename,
    downloadPath,
    mode,
    videoQuality,
    videoContainer,
    audioFormat,
    audioBitrate,
    embedThumbnail:
      input.embedThumbnail !== undefined ? Boolean(input.embedThumbnail) : true,
    embedMetadata:
      input.embedMetadata !== undefined ? Boolean(input.embedMetadata) : true,
    embedSubtitles:
      input.embedSubtitles !== undefined ? Boolean(input.embedSubtitles) : false,
    editorCompatibility:
      input.editorCompatibility !== undefined
        ? Boolean(input.editorCompatibility)
        : false,
    speedLimit:
      typeof input.speedLimit === "string" ? input.speedLimit : undefined,
    clipRange:
      input.clipRange && typeof input.clipRange === "object"
        ? {
            enabled: Boolean(input.clipRange.enabled),
            startTime: String(input.clipRange.startTime || "00:00"),
            endTime: String(input.clipRange.endTime || "00:00"),
          }
        : undefined,
    customMetadata:
      input.customMetadata && typeof input.customMetadata === "object"
        ? {
            title: input.customMetadata.title
              ? String(input.customMetadata.title).slice(0, 300)
              : undefined,
            artist: input.customMetadata.artist
              ? String(input.customMetadata.artist).slice(0, 300)
              : undefined,
            album: input.customMetadata.album
              ? String(input.customMetadata.album).slice(0, 300)
              : undefined,
            year: input.customMetadata.year
              ? String(input.customMetadata.year).slice(0, 10)
              : undefined,
            genre: input.customMetadata.genre
              ? String(input.customMetadata.genre).slice(0, 100)
              : undefined,
          }
        : undefined,
  };
}

/**
 * Checks if opening a file path is safe (not an executable, script, or directory escape).
 */
export function isSafePathToOpen(
  targetPath: string,
  approvedDownloadDirs: string[]
): { safe: boolean; reason?: string } {
  if (!targetPath || typeof targetPath !== "string") {
    return { safe: false, reason: "No file path specified." };
  }

  const resolved = path.resolve(targetPath);
  const ext = path.extname(resolved).toLowerCase();

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      safe: false,
      reason: `Security Block: Cannot open executable or script file '${ext}' directly.`,
    };
  }

  const isContained = approvedDownloadDirs.some((dir) =>
    isInsideDirectory(resolved, dir)
  );

  if (!isContained) {
    return {
      safe: false,
      reason:
        "Security Block: Target file is outside approved download directories.",
    };
  }

  return { safe: true };
}

/**
 * Redacts cookie flags and sensitive system paths from error output before
 * passing to UI or renderer.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== "string")
    return "An unexpected error occurred.";

  return message
    .replace(/--cookies\s+[^\s]+/gi, "--cookies [REDACTED]")
    .replace(
      /--cookies-from-browser\s+[^\s]+/gi,
      "--cookies-from-browser [REDACTED]"
    );
}
