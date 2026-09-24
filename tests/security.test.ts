import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import {
  validateMediaUrl,
  isInsideDirectory,
  sanitizeFilename,
  validateSettingsUpdate,
  validateDownloadOptions,
  sanitizeErrorMessage,
  MAX_URL_LENGTH,
} from "../electron/security";
import {
  computeFileSha256,
  APPROVED_DOWNLOAD_HOSTS,
  MAX_BINARY_SIZE_BYTES,
} from "../electron/binManager";
import type { AppSettings } from "../src/types";

describe("Security Hardening Tests", () => {
  describe("validateMediaUrl", () => {
    it("accepts valid HTTPS and HTTP URLs", () => {
      expect(validateMediaUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      );
      expect(validateMediaUrl("http://soundcloud.com/artist/track")).toBe(
        "http://soundcloud.com/artist/track"
      );
    });

    it("rejects non-string or empty URLs", () => {
      expect(() => validateMediaUrl("")).toThrow("URL cannot be empty");
      expect(() => validateMediaUrl("   ")).toThrow("URL cannot be empty");
      expect(() => validateMediaUrl(null as any)).toThrow("must be a string");
      expect(() => validateMediaUrl(undefined as any)).toThrow("must be a string");
    });

    it("rejects dangerous non-HTTP protocols", () => {
      expect(() => validateMediaUrl("file:///C:/Windows/System32/calc.exe")).toThrow("unsupported URL protocol 'file:'");
      expect(() => validateMediaUrl("javascript:alert(1)")).toThrow("unsupported URL protocol 'javascript:'");
      expect(() => validateMediaUrl("data:text/html,<html>")).toThrow("unsupported URL protocol 'data:'");
      expect(() => validateMediaUrl("blob:http://localhost/1234")).toThrow("unsupported URL protocol 'blob:'");
      expect(() => validateMediaUrl("ftp://ftp.example.com/file")).toThrow("unsupported URL protocol 'ftp:'");
    });

    it("rejects embedded authentication credentials", () => {
      expect(() => validateMediaUrl("https://admin:password123@example.com/video")).toThrow(
        "URLs containing embedded authentication credentials are not permitted"
      );
    });

    it("rejects loopback and internal network SSRF targets", () => {
      expect(() => validateMediaUrl("http://localhost:8080/admin")).toThrow("localhost and loopback targets are rejected");
      expect(() => validateMediaUrl("http://127.0.0.1:3000/api")).toThrow("localhost and loopback targets are rejected");
      expect(() => validateMediaUrl("http://0.0.0.0/test")).toThrow("localhost and loopback targets are rejected");
    });

    it("rejects URLs exceeding maximum allowed length", () => {
      const longUrl = "https://example.com/" + "a".repeat(MAX_URL_LENGTH + 10);
      expect(() => validateMediaUrl(longUrl)).toThrow("exceeds maximum allowed length");
    });
  });

  describe("isInsideDirectory", () => {
    const root = path.resolve(os.tmpdir(), "anydownloader_test");

    it("allows files strictly within the approved root", () => {
      const child = path.join(root, "subfolder", "video.mp4");
      expect(isInsideDirectory(child, root)).toBe(true);
      expect(isInsideDirectory(root, root)).toBe(true);
    });

    it("rejects directory traversal attempts", () => {
      const escaped = path.join(root, "..", "sensitive.txt");
      expect(isInsideDirectory(escaped, root)).toBe(false);

      const sneaky = path.join(root, "subfolder", "..", "..", "system32");
      expect(isInsideDirectory(sneaky, root)).toBe(false);
    });

    it("rejects similar prefix folder attacks", () => {
      const evilNeighbor = root + "-other/file.mp4";
      expect(isInsideDirectory(evilNeighbor, root)).toBe(false);
    });
  });

  describe("sanitizeFilename", () => {
    it("strips illegal characters and control codes", () => {
      expect(sanitizeFilename('Awesome/Video: *The "Best"? <Part | 1>')).toBe(
        "Awesome_Video_ _The _Best__ _Part _ 1_"
      );
    });

    it("strips leading dots to prevent hidden or relative files", () => {
      expect(sanitizeFilename("...hidden_file.mp4")).toBe("hidden_file.mp4");
    });

    it("handles empty or whitespace filenames gracefully", () => {
      expect(sanitizeFilename("")).toBe("media");
      expect(sanitizeFilename("   ")).toBe("media");
    });
  });

  describe("validateSettingsUpdate", () => {
    const current: AppSettings = {
      defaultDownloadPath: os.tmpdir(),
      defaultAudioFormat: "mp3",
      defaultVideoQuality: "best",
      defaultEmbedThumbnail: true,
      maxConcurrentDownloads: 3,
      downloadSpeedLimit: "unlimited",
      darkMode: true,
      enableNotifications: true,
      minimizeToTray: false,
      autoPasteClipboard: false,
      cookieSource: "none",
      cookieFilePath: "",
    };

    it("validates and accepts valid settings", () => {
      const update = {
        defaultAudioFormat: "flac",
        maxConcurrentDownloads: 5,
        cookieSource: "zen",
      };
      const result = validateSettingsUpdate(update, current);
      expect(result.defaultAudioFormat).toBe("flac");
      expect(result.maxConcurrentDownloads).toBe(5);
      expect(result.cookieSource).toBe("zen");
    });

    it("rejects invalid cookie source or audio formats", () => {
      expect(() =>
        validateSettingsUpdate({ defaultAudioFormat: "exe" }, current)
      ).toThrow("Invalid defaultAudioFormat");

      expect(() =>
        validateSettingsUpdate({ cookieSource: "malicious_script" }, current)
      ).toThrow("Invalid cookieSource");
    });

    it("clamps or rejects out-of-bound concurrency limits", () => {
      expect(() =>
        validateSettingsUpdate({ maxConcurrentDownloads: 999 }, current)
      ).toThrow("maxConcurrentDownloads must be an integer between 1 and");
    });
  });

  describe("validateDownloadOptions", () => {
    const defaultPath = os.tmpdir();

    it("normalizes and sanitizes download options", () => {
      const raw = {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Test Video",
        customFilename: "Cool:Video",
        mode: "video",
        videoQuality: "1080",
        videoContainer: "mp4",
        audioFormat: "mp3",
        audioBitrate: "320",
      };

      const result = validateDownloadOptions(raw, defaultPath);
      expect(result.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.customFilename).toBe("Cool_Video");
      expect(result.videoQuality).toBe("1080");
    });

    it("rejects invalid URLs in download options", () => {
      const raw = {
        url: "file:///etc/passwd",
      };
      expect(() => validateDownloadOptions(raw, defaultPath)).toThrow("Security Error: unsupported URL protocol 'file:'");
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("redacts cookie file arguments and paths from errors", () => {
      const errorWithCookies = "Error: Failed running yt-dlp --cookies C:\\Users\\User\\cookies.txt with exit code 1";
      const sanitized = sanitizeErrorMessage(errorWithCookies);
      expect(sanitized).not.toContain("C:\\Users\\User\\cookies.txt");
      expect(sanitized).toContain("--cookies [REDACTED]");
    });

    it("redacts browser cookie session arguments", () => {
      const errorWithBrowser = "Error: --cookies-from-browser firefox:C:\\Profiles\\default failed";
      const sanitized = sanitizeErrorMessage(errorWithBrowser);
      expect(sanitized).toContain("--cookies-from-browser [REDACTED]");
    });
  });

  describe("Binary Verification & Cryptographic Checksum", () => {
    it("computes accurate SHA-256 file hashes", async () => {
      const testFile = path.join(os.tmpdir(), `test_sha256_${Date.now()}.txt`);
      fs.writeFileSync(testFile, "hello security verification");
      try {
        const hash = await computeFileSha256(testFile);
        // Known sha256 for "hello security verification"
        expect(hash).toBe("1341e901238ec828dbe6a66f001951f344107dbb697e08dbe2420934ef97f2ba");
      } finally {
        try { fs.unlinkSync(testFile); } catch {}
      }
    });

    it("enforces binary download constraints", () => {
      expect(MAX_BINARY_SIZE_BYTES).toBe(60 * 1024 * 1024);
      expect(APPROVED_DOWNLOAD_HOSTS.has("github.com")).toBe(true);
      expect(APPROVED_DOWNLOAD_HOSTS.has("objects.githubusercontent.com")).toBe(true);
      expect(APPROVED_DOWNLOAD_HOSTS.has("evil-third-party.com")).toBe(false);
    });
  });
});
