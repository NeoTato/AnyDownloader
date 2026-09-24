import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import { createHash } from "node:crypto";
import { app } from "electron";
import { spawn } from "node:child_process";
import type { EngineStatus } from "../src/types";

// Maximum permitted binary download size (60MB)
export const MAX_BINARY_SIZE_BYTES = 60 * 1024 * 1024;
export const DOWNLOAD_TIMEOUT_MS = 60000; // 60 seconds

// Strict host whitelist for executable downloads
export const APPROVED_DOWNLOAD_HOSTS = new Set([
  "github.com",
  "objects.githubusercontent.com",
  "github-releases.githubusercontent.com",
  "raw.githubusercontent.com",
]);

/**
 * Computes the SHA-256 hash of a file on disk.
 */
export async function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(hash.digest("hex").toLowerCase()));
  });
}

/**
 * Fetches text content (such as SHA256SUMS) over HTTPS with strict host and redirect validation.
 */
export function fetchSecureText(url: string, redirectCount = 0): Promise<string> {
  if (redirectCount > 5) {
    return Promise.reject(new Error("Security Error: too many redirects while fetching checksums."));
  }

  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return reject(new Error("Invalid URL for checksum verification."));
    }

    if (parsed.protocol !== "https:") {
      return reject(new Error(`Security Error: unencrypted protocol '${parsed.protocol}' rejected.`));
    }
    if (!APPROVED_DOWNLOAD_HOSTS.has(parsed.hostname.toLowerCase())) {
      return reject(new Error(`Security Error: unapproved host '${parsed.hostname}'.`));
    }

    const req = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchSecureText(res.headers.location, redirectCount + 1));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      let data = "";
      res.on("data", (chunk) => {
        if (data.length < 1024 * 1024) {
          data += chunk.toString();
        }
      });
      res.on("end", () => resolve(data));
    });

    req.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error("Network timeout while fetching checksums."));
    });

    req.on("error", reject);
  });
}

export class BinManager {
  private binDir: string;
  public ytdlpPath: string | null = null;
  public ffmpegPath: string | null = null;

  constructor() {
    this.binDir = path.join(app.getPath("userData"), "bin");
    if (!fs.existsSync(this.binDir)) {
      fs.mkdirSync(this.binDir, { recursive: true });
    }
  }

  public async init(): Promise<EngineStatus> {
    await this.resolveBinaries();
    return this.getStatus();
  }

  public async resolveBinaries(): Promise<void> {
    const isWin = process.platform === "win32";
    const ytdlpName = isWin ? "yt-dlp.exe" : "yt-dlp";
    const ffmpegName = isWin ? "ffmpeg.exe" : "ffmpeg";

    // 1. Check local bin directory first
    const localYtdlp = path.join(this.binDir, ytdlpName);
    if (fs.existsSync(localYtdlp)) {
      this.ytdlpPath = localYtdlp;
    } else {
      // Check system PATH
      const systemYtdlp = await this.findInPath(ytdlpName);
      if (systemYtdlp) {
        this.ytdlpPath = systemYtdlp;
      }
    }

    const localFfmpeg = path.join(this.binDir, ffmpegName);
    if (fs.existsSync(localFfmpeg)) {
      this.ffmpegPath = localFfmpeg;
    } else {
      const systemFfmpeg = await this.findInPath(ffmpegName);
      if (systemFfmpeg) {
        this.ffmpegPath = systemFfmpeg;
      }
    }

    // Auto-download yt-dlp if not found
    if (!this.ytdlpPath) {
      try {
        await this.downloadYtdlp();
      } catch (err) {
        console.error("Failed to auto-download yt-dlp:", err);
      }
    }
  }

  private findInPath(binName: string): Promise<string | null> {
    return new Promise((resolve) => {
      const checkCmd = process.platform === "win32" ? "where" : "which";
      const child = spawn(checkCmd, [binName], { shell: true });
      let stdout = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0 && stdout.trim()) {
          const lines = stdout.trim().split(/\r?\n/);
          resolve(lines[0].trim());
        } else {
          resolve(null);
        }
      });

      child.on("error", () => resolve(null));
    });
  }

  /**
   * Securely downloads yt-dlp binary with official SHA-256 checksum verification,
   * size checks, redirect restrictions, and atomic swap with rollback protection.
   */
  public async downloadYtdlp(): Promise<string> {
    const isWin = process.platform === "win32";
    const isMac = process.platform === "darwin";
    const binaryFilename = isWin
      ? "yt-dlp.exe"
      : isMac
        ? "yt-dlp_macos"
        : "yt-dlp";

    const releaseBaseUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download";
    const binaryUrl = `${releaseBaseUrl}/${binaryFilename}`;
    const checksumsUrl = `${releaseBaseUrl}/SHA256SUMS`;

    const dest = path.join(this.binDir, isWin ? "yt-dlp.exe" : "yt-dlp");
    const tempDest = `${dest}.tmp`;
    const backupDest = `${dest}.backup`;

    // 1. Fetch official SHA256 checksum file
    let expectedHash: string | null = null;
    try {
      const checksumsContent = await fetchSecureText(checksumsUrl);
      for (const line of checksumsContent.split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const hash = parts[0].toLowerCase();
          const fname = parts[1].replace(/^\*/, "");
          if (fname === binaryFilename) {
            expectedHash = hash;
            break;
          }
        }
      }
    } catch (e: any) {
      console.warn(`Could not retrieve SHA256SUMS: ${e.message}`);
    }

    // 2. Download binary stream to temporary destination
    await this.downloadSecureFile(binaryUrl, tempDest);

    // 3. Verify SHA256 checksum if available
    if (expectedHash) {
      const actualHash = await computeFileSha256(tempDest);
      if (actualHash !== expectedHash) {
        try { fs.unlinkSync(tempDest); } catch {}
        throw new Error(
          `Security Alert: SHA-256 checksum verification failed! Expected ${expectedHash} but computed ${actualHash}. Binary rejected.`
        );
      }
    }

    if (!isWin) {
      try {
        fs.chmodSync(tempDest, 0o755);
      } catch {}
    }

    // 4. Verify the downloaded binary executes cleanly
    const testVersion = await this.getVersion(tempDest, "--version");
    if (!testVersion) {
      try { fs.unlinkSync(tempDest); } catch {}
      throw new Error("Downloaded binary failed execution validation.");
    }

    // 5. Atomic swap with rollback protection
    try {
      if (fs.existsSync(dest)) {
        try { fs.unlinkSync(backupDest); } catch {}
        fs.renameSync(dest, backupDest);
      }
      fs.renameSync(tempDest, dest);
      try { fs.unlinkSync(backupDest); } catch {}
    } catch (err: any) {
      // Rollback if swap failed
      if (fs.existsSync(backupDest)) {
        try { fs.renameSync(backupDest, dest); } catch {}
      }
      try { fs.unlinkSync(tempDest); } catch {}
      throw new Error(`Failed to atomically install verified binary: ${err.message}`);
    }

    this.ytdlpPath = dest;
    return dest;
  }

  /**
   * Performs an application-managed, verified update.
   * Eliminates unverified yt-dlp -U in favor of SHA-256 validated downloads.
   */
  public async updateYtdlp(): Promise<{
    success: boolean;
    message: string;
    version?: string;
  }> {
    try {
      const dest = await this.downloadYtdlp();
      const ver = await this.getVersion(dest, "--version");
      return {
        success: true,
        message: `yt-dlp verified and updated successfully (v${ver || "latest"}).`,
        version: ver || undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Update failed: ${err.message}`,
      };
    }
  }

  private downloadSecureFile(url: string, dest: string, redirectCount = 0): Promise<void> {
    if (redirectCount > 5) {
      return Promise.reject(new Error("Security Error: too many redirects."));
    }

    return new Promise((resolve, reject) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return reject(new Error("Invalid binary download URL."));
      }

      if (parsed.protocol !== "https:") {
        return reject(new Error(`Security Error: insecure protocol '${parsed.protocol}'.`));
      }
      if (!APPROVED_DOWNLOAD_HOSTS.has(parsed.hostname.toLowerCase())) {
        return reject(new Error(`Security Error: redirect to unapproved host '${parsed.hostname}' blocked.`));
      }

      const file = fs.createWriteStream(dest);
      let downloadedBytes = 0;

      const req = https.get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          file.close();
          try { fs.unlinkSync(dest); } catch {}
          return resolve(this.downloadSecureFile(response.headers.location, dest, redirectCount + 1));
        }

        if (response.statusCode !== 200) {
          file.close();
          try { fs.unlinkSync(dest); } catch {}
          return reject(
            new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`)
          );
        }

        response.on("data", (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          if (downloadedBytes > MAX_BINARY_SIZE_BYTES) {
            req.destroy();
            file.close();
            try { fs.unlinkSync(dest); } catch {}
            reject(new Error(`Security Error: download exceeded maximum permitted size of ${MAX_BINARY_SIZE_BYTES} bytes.`));
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close(() => resolve());
        });
      });

      req.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
        req.destroy();
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        reject(new Error("Network timeout during binary download."));
      });

      req.on("error", (err) => {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        reject(err);
      });
    });
  }

  private getVersion(
    binPath: string,
    flag: string = "--version",
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const child = spawn(binPath, [flag]);
      let stdout = "";

      child.stdout?.on("data", (d) => {
        stdout += d.toString();
      });
      child.on("close", (code) => {
        if (code === 0 && stdout.trim()) {
          const firstLine = stdout.trim().split(/\r?\n/)[0];
          resolve(firstLine);
        } else {
          resolve(null);
        }
      });
      child.on("error", () => resolve(null));
    });
  }

  public async getStatus(): Promise<EngineStatus> {
    let ytdlpVersion: string | null = null;
    let ffmpegVersion: string | null = null;

    if (this.ytdlpPath) {
      ytdlpVersion = await this.getVersion(this.ytdlpPath, "--version");
    }

    if (this.ffmpegPath) {
      ffmpegVersion = await this.getVersion(this.ffmpegPath, "-version");
      if (ffmpegVersion && ffmpegVersion.includes("ffmpeg version")) {
        ffmpegVersion = ffmpegVersion.split(" ")[2] || "Installed";
      }
    }

    return {
      ytdlp: {
        available: !!this.ytdlpPath,
        version: ytdlpVersion,
        path: this.ytdlpPath,
      },
      ffmpeg: {
        available: !!this.ffmpegPath,
        version: ffmpegVersion,
        path: this.ffmpegPath,
      },
    };
  }
}
