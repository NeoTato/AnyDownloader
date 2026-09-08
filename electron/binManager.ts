import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import electron from "electron";
const { app } = electron;
import { spawn } from "node:child_process";
import type { EngineStatus } from "../src/types";

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

  public async downloadYtdlp(): Promise<string> {
    const isWin = process.platform === "win32";
    const filename = isWin
      ? "yt-dlp.exe"
      : process.platform === "darwin"
        ? "yt-dlp_macos"
        : "yt-dlp";
    const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${filename}`;
    const dest = path.join(this.binDir, isWin ? "yt-dlp.exe" : "yt-dlp");

    await this.downloadFile(url, dest);
    if (!isWin) {
      try {
        fs.chmodSync(dest, 0o755);
      } catch {
        // ignore
      }
    }
    this.ytdlpPath = dest;
    return dest;
  }

  public async updateYtdlp(): Promise<{
    success: boolean;
    message: string;
    version?: string;
  }> {
    if (!this.ytdlpPath) {
      try {
        const dest = await this.downloadYtdlp();
        const ver = await this.getVersion(dest, "--version");
        return {
          success: true,
          message: "yt-dlp installed successfully",
          version: ver || undefined,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Failed to install yt-dlp: ${err.message}`,
        };
      }
    }

    // Attempt internal yt-dlp -U update first
    return new Promise((resolve) => {
      const child = spawn(this.ytdlpPath!, ["-U"]);
      let output = "";

      child.stdout?.on("data", (d) => {
        output += d.toString();
      });
      child.stderr?.on("data", (d) => {
        output += d.toString();
      });

      child.on("close", async (code) => {
        if (code === 0) {
          const newVersion = await this.getVersion(
            this.ytdlpPath!,
            "--version",
          );
          resolve({
            success: true,
            message: output.trim() || "yt-dlp updated to latest version.",
            version: newVersion || undefined,
          });
        } else {
          // If -U fails (e.g. permission or package manager build), re-download directly from GitHub releases
          try {
            await this.downloadYtdlp();
            const newVersion = await this.getVersion(
              this.ytdlpPath!,
              "--version",
            );
            resolve({
              success: true,
              message:
                "Downloaded latest yt-dlp binary from official GitHub releases.",
              version: newVersion || undefined,
            });
          } catch (err: any) {
            resolve({
              success: false,
              message: `Update failed: ${err.message || output}`,
            });
          }
        }
      });

      child.on("error", async () => {
        try {
          await this.downloadYtdlp();
          const newVersion = await this.getVersion(
            this.ytdlpPath!,
            "--version",
          );
          resolve({
            success: true,
            message: "Downloaded latest yt-dlp release binary.",
            version: newVersion || undefined,
          });
        } catch (err: any) {
          resolve({
            success: false,
            message: `Update failed: ${err.message}`,
          });
        }
      });
    });
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempDest = `${dest}.tmp`;
      const file = fs.createWriteStream(tempDest);

      const request = (targetUrl: string) => {
        https
          .get(targetUrl, (response) => {
            if (
              response.statusCode &&
              response.statusCode >= 300 &&
              response.statusCode < 400 &&
              response.headers.location
            ) {
              return request(response.headers.location);
            }

            if (response.statusCode !== 200) {
              file.close();
              fs.unlink(tempDest, () => {});
              return reject(
                new Error(
                  `Server responded with ${response.statusCode}: ${response.statusMessage}`,
                ),
              );
            }

            response.pipe(file);

            file.on("finish", () => {
              file.close(() => {
                try {
                  if (fs.existsSync(dest)) {
                    fs.unlinkSync(dest);
                  }
                  fs.renameSync(tempDest, dest);
                  resolve();
                } catch (e) {
                  reject(e);
                }
              });
            });
          })
          .on("error", (err) => {
            file.close();
            fs.unlink(tempDest, () => {});
            reject(err);
          });
      };

      request(url);
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
