import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import type { AppSettings, HistoryItem } from "../src/types";

const defaultSettings: AppSettings = {
  defaultDownloadPath: "",
  defaultMode: "video",
  defaultVideoQuality: "best",
  defaultVideoContainer: "mp4",
  defaultAudioFormat: "mp3",
  defaultAudioBitrate: "320",
  defaultEmbedThumbnail: true, // Requested feature: cover art embedding default on
  defaultEmbedMetadata: true,
  maxConcurrentDownloads: 3,
  downloadSpeedLimit: "unlimited",
  minimizeToTray: false,
  enableNotifications: true,
  autoPasteClipboard: true,
  darkMode: true,
};

export class AppStore {
  private configPath: string;
  private historyPath: string;
  private settings: AppSettings;
  private history: HistoryItem[] = [];

  constructor() {
    const userData = app.getPath("userData");
    this.configPath = path.join(userData, "config.json");
    this.historyPath = path.join(userData, "history.json");

    // Default download path to user's standard Downloads folder
    defaultSettings.defaultDownloadPath = app.getPath("downloads");

    this.settings = this.loadSettings();
    this.history = this.loadHistory();
  }

  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf-8");
        return { ...defaultSettings, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    return { ...defaultSettings };
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.settings, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    return { ...this.settings };
  }

  private loadHistory(): HistoryItem[] {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, "utf-8");
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
    return [];
  }

  public getHistory(): HistoryItem[] {
    return [...this.history];
  }

  public addHistoryItem(item: HistoryItem): void {
    // Prepend new item, remove duplicates if any
    this.history = [
      item,
      ...this.history.filter((h) => h.id !== item.id),
    ].slice(0, 500);
    this.persistHistory();
  }

  public deleteHistoryItem(id: string): void {
    this.history = this.history.filter((h) => h.id !== id);
    this.persistHistory();
  }

  public clearHistory(): void {
    this.history = [];
    this.persistHistory();
  }

  public cleanMissingHistory(
    checker: (filePath: string) => boolean,
  ): HistoryItem[] {
    this.history = this.history.filter(
      (h) => h.filePath && checker(h.filePath),
    );
    this.persistHistory();
    return [...this.history];
  }

  private persistHistory(): void {
    try {
      fs.writeFileSync(
        this.historyPath,
        JSON.stringify(this.history, null, 2),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to persist history:", e);
    }
  }
}
