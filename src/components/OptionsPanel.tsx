import React, { useState } from "react";
import {
  Film,
  Music,
  Sparkles,
  Folder,
  Image as ImageIcon,
  Tag,
  Subtitles,
  Download,
  Info,
  Edit3,
  RotateCcw,
  Scissors,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Disc,
  Music4,
  AlertCircle,
} from "lucide-react";
import type {
  MediaInfo,
  MediaMode,
  VideoQuality,
  VideoContainer,
  AudioFormat,
  AudioBitrate,
  DownloadOptions,
  AppSettings,
} from "../types";

interface OptionsPanelProps {
  media: MediaInfo;
  defaultPath: string;
  settings?: AppSettings | null;
  onSelectFolder: () => Promise<string | null>;
  onStartDownload: (options: Omit<DownloadOptions, "id">) => void;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  media,
  defaultPath,
  settings,
  onSelectFolder,
  onStartDownload,
}) => {
  const [mode, setMode] = useState<MediaMode>(settings?.defaultMode || "video");

  // Video Options
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(
    settings?.defaultVideoQuality || "best",
  );
  const [videoContainer, setVideoContainer] = useState<VideoContainer>(
    settings?.defaultVideoContainer || "mp4",
  );
  const [embedSubtitles, setEmbedSubtitles] = useState(false);
  const [embedVideoThumbnail, setEmbedVideoThumbnail] = useState(true);

  // Audio Options
  const [audioFormat, setAudioFormat] = useState<AudioFormat>(
    settings?.defaultAudioFormat || "mp3",
  );
  const [audioBitrate, setAudioBitrate] = useState<AudioBitrate>(
    settings?.defaultAudioBitrate || "320",
  );
  // Feature requirement: dedicated album art / thumbnail toggle for audio extraction
  const [embedThumbnail, setEmbedThumbnail] = useState<boolean>(
    settings ? settings.defaultEmbedThumbnail : true,
  );
  const [embedMetadata, setEmbedMetadata] = useState<boolean>(
    settings ? settings.defaultEmbedMetadata : true,
  );

  // Save Path
  const [downloadPath, setDownloadPath] = useState<string>(
    settings?.defaultDownloadPath || defaultPath,
  );

  // Custom Filename
  const [customFilename, setCustomFilename] = useState<string>(media.title);

  // Timestamp Trimming State
  const [clipEnabled, setClipEnabled] = useState<boolean>(false);
  const [clipStart, setClipStart] = useState<string>("00:00");
  const [clipEnd, setClipEnd] = useState<string>(media.durationString || "");

  // Custom ID3 Metadata State
  const [showMetadataEditor, setShowMetadataEditor] = useState<boolean>(false);
  const [metaTitle, setMetaTitle] = useState<string>(media.title);
  const [metaArtist, setMetaArtist] = useState<string>(media.uploader || "");
  const [metaAlbum, setMetaAlbum] = useState<string>("");
  const [metaYear, setMetaYear] = useState<string>("");
  const [metaGenre, setMetaGenre] = useState<string>("");

  // Synchronize when media changes
  React.useEffect(() => {
    setCustomFilename(media.title);
    setClipEnd(media.durationString || "");
    setMetaTitle(media.title);
    setMetaArtist(media.uploader || "");
  }, [media.title, media.durationString, media.uploader]);

  const handleBrowseFolder = async () => {
    const selected = await onSelectFolder();
    if (selected) {
      setDownloadPath(selected);
    }
  };

  // Helper: parse MM:SS or HH:MM:SS to seconds
  const parseTimeToSeconds = (str: string): number | null => {
    if (!str || !str.trim()) return null;
    const parts = str
      .trim()
      .split(":")
      .map((p) => Number(p));
    if (parts.some((p) => isNaN(p))) return null;
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };

  // Trimming Validation
  let clipError: string | null = null;
  if (clipEnabled) {
    const startSec = parseTimeToSeconds(clipStart);
    const endSec = parseTimeToSeconds(clipEnd);
    const maxDuration = media.duration;

    if (startSec === null) {
      clipError = "Invalid Start Time format (use MM:SS or HH:MM:SS)";
    } else if (endSec === null) {
      clipError = "Invalid End Time format (use MM:SS or HH:MM:SS)";
    } else if (startSec < 0) {
      clipError = "Start Time cannot be negative";
    } else if (maxDuration && startSec >= maxDuration) {
      clipError = `Start Time (${clipStart}) exceeds video duration of ${media.durationString || maxDuration + "s"}`;
    } else if (maxDuration && endSec > maxDuration) {
      clipError = `End Time (${clipEnd}) exceeds maximum video duration of ${media.durationString || maxDuration + "s"}`;
    } else if (startSec >= endSec) {
      clipError = "Start Time must be strictly before End Time";
    }
  }

  const handleResetClipRange = () => {
    setClipStart("00:00");
    setClipEnd(media.durationString || "");
  };

  const handleSubmitDownload = () => {
    if (clipError) return;
    onStartDownload({
      url: media.url,
      title: media.title,
      customFilename: customFilename.trim() || undefined,
      thumbnail: media.thumbnail,
      mode,
      videoQuality,
      videoContainer,
      audioFormat,
      audioBitrate,
      embedThumbnail: mode === "audio" ? embedThumbnail : embedVideoThumbnail,
      embedMetadata,
      embedSubtitles: mode === "video" ? embedSubtitles : false,
      downloadPath: downloadPath || defaultPath,
      clipRange: clipEnabled
        ? {
            enabled: true,
            startTime: clipStart,
            endTime: clipEnd,
          }
        : undefined,
      customMetadata: {
        title: metaTitle.trim() || undefined,
        artist: metaArtist.trim() || undefined,
        album: metaAlbum.trim() || undefined,
        year: metaYear.trim() || undefined,
        genre: metaGenre.trim() || undefined,
      },
    });
  };

  const VIDEO_QUALITIES: {
    label: string;
    value: VideoQuality;
    desc: string;
  }[] = [
    {
      label: "Best / Original",
      value: "best",
      desc: "Maximum source resolution & bitstream",
    },
    { label: "4K (2160p)", value: "2160", desc: "Ultra HD" },
    { label: "2K (1440p)", value: "1440", desc: "Quad HD" },
    { label: "1080p FHD", value: "1080", desc: "Full HD" },
    { label: "720p HD", value: "720", desc: "Standard HD" },
    { label: "480p / 360p", value: "480", desc: "Compressed" },
  ];

  const AUDIO_FORMATS: { label: string; value: AudioFormat; desc: string }[] = [
    {
      label: "MP3",
      value: "mp3",
      desc: "Universal compatibility (up to 320 kbps)",
    },
    {
      label: "M4A / AAC",
      value: "m4a",
      desc: "High efficiency, Apple & mobile optimized",
    },
    { label: "FLAC", value: "flac", desc: "Lossless audio fidelity" },
    { label: "OPUS", value: "opus", desc: "Native stream (0% quality loss)" },
    { label: "WAV", value: "wav", desc: "Uncompressed PCM audio" },
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6 border border-slate-800 shadow-2xl">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <span>Download Configuration</span>
          </h2>
          <p className="text-xs text-slate-400">
            Choose output format, stream quality, and audio tagging options
          </p>
        </div>

        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setMode("video")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === "video"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("audio")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === "audio"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Audio Only</span>
          </button>
        </div>
      </div>

      {/* Mode Specific Settings */}
      {mode === "video" ? (
        <div className="space-y-5">
          {/* Resolution selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <span>Target Resolution & Quality</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {VIDEO_QUALITIES.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setVideoQuality(q.value)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    videoQuality === q.value
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="font-bold text-sm">{q.label}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {q.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Container format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Container Format
              </label>
              <div className="flex gap-2">
                {(["mp4", "mkv", "webm"] as VideoContainer[]).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setVideoContainer(cnt)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                      videoContainer === cnt
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Additional Streams
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={embedSubtitles}
                    onChange={(e) => setEmbedSubtitles(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                  />
                  <Subtitles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download & embed subtitles</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AUDIO MODE SETTINGS */
        <div className="space-y-5">
          {/* Audio Format Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audio Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AUDIO_FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setAudioFormat(f.value)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    audioFormat === f.value
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="font-bold text-sm">{f.label}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate selection if MP3 or M4A */}
          {(audioFormat === "mp3" || audioFormat === "m4a") && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Audio Bitrate Quality
              </label>
              <div className="flex gap-2">
                {[
                  { label: "320 kbps (High Quality)", val: "320" },
                  { label: "256 kbps", val: "256" },
                  { label: "192 kbps", val: "192" },
                  { label: "128 kbps", val: "128" },
                ].map((b) => (
                  <button
                    key={b.val}
                    type="button"
                    onClick={() => setAudioBitrate(b.val as AudioBitrate)}
                    className={`flex-1 py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      audioBitrate === b.val
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Album Art / Cover Art Feature Toggle */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">
                      Embed Album Art / Thumbnail
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                      Tagging
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Embed the video thumbnail as the cover artwork inside the{" "}
                    {audioFormat.toUpperCase()} file for music players and
                    smartphones.
                  </p>
                </div>
              </div>

              {/* Interactive Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={embedThumbnail}
                onClick={() => setEmbedThumbnail(!embedThumbnail)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  embedThumbnail ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    embedThumbnail ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-indigo-500/10 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={embedMetadata}
                  onChange={(e) => setEmbedMetadata(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-tag metadata (Artist, Title, Album tags)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                className="flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {showMetadataEditor
                    ? "Hide Tag Editor"
                    : "Customize ID3 Tags"}
                </span>
                {showMetadataEditor ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Expandable ID3 Tag Customizer */}
            {showMetadataEditor && (
              <div className="pt-3 border-t border-indigo-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Music4 className="w-3 h-3 text-indigo-400" />
                    <span>Track Title</span>
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Track Title"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    <span>Artist / Creator</span>
                  </label>
                  <input
                    type="text"
                    value={metaArtist}
                    onChange={(e) => setMetaArtist(e.target.value)}
                    placeholder="Artist Name"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Disc className="w-3 h-3 text-indigo-400" />
                    <span>Album Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={metaAlbum}
                    onChange={(e) => setMetaAlbum(e.target.value)}
                    placeholder="Album Name"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Year
                    </label>
                    <input
                      type="text"
                      value={metaYear}
                      onChange={(e) => setMetaYear(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={metaGenre}
                      onChange={(e) => setMetaGenre(e.target.value)}
                      placeholder="e.g. Pop, Rock"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp / Clip Trimming (Available for both Video and Audio) */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Trim / Clip Section
              </span>
              <p className="text-[11px] text-slate-400">
                Download only a specific time segment instead of the full video
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={clipEnabled}
            onClick={() => setClipEnabled(!clipEnabled)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              clipEnabled ? "bg-indigo-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                clipEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {clipEnabled && (
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Start Time (MM:SS)
                  </label>
                  <button
                    type="button"
                    onClick={() => setClipStart("00:00")}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Start (00:00)
                  </button>
                </div>
                <input
                  type="text"
                  value={clipStart}
                  onChange={(e) => setClipStart(e.target.value)}
                  placeholder="00:00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400">
                    End Time (MM:SS)
                  </label>
                  {media.durationString && (
                    <button
                      type="button"
                      onClick={() => setClipEnd(media.durationString!)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      End ({media.durationString})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={clipEnd}
                  onChange={(e) => setClipEnd(e.target.value)}
                  placeholder={media.durationString || "00:00"}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Validation Error Alert */}
            {clipError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{clipError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetClipRange}
                  className="text-[11px] font-semibold text-rose-300 hover:text-white underline shrink-0 ml-2"
                >
                  Reset Range
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Filename (Editable & Sanitized) */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Output Filename</span>
          </label>

          <div className="flex items-center space-x-2">
            {customFilename.length > 100 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium">
                Long title: will be safely trimmed
              </span>
            )}
            {customFilename !== media.title && (
              <button
                type="button"
                onClick={() => setCustomFilename(media.title)}
                className="flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                title="Reset to original video title"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder="Enter custom file name..."
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Destination Folder Selector */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
          <Folder className="w-3.5 h-3.5 text-indigo-400" />
          <span>Save Destination Folder</span>
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 truncate">
            {downloadPath || defaultPath || "Default Downloads Folder"}
          </div>
          <button
            type="button"
            onClick={handleBrowseFolder}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shrink-0"
          >
            Browse...
          </button>
        </div>
      </div>

      {/* Action Download Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSubmitDownload}
          disabled={!!clipError}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2.5 transition-all transform active:scale-[0.99]"
        >
          <Download className="w-5 h-5" />
          <span>
            {clipError
              ? clipError
              : mode === "video"
                ? `Download Video (${videoQuality === "best" ? "Lossless Best" : videoQuality + "p"} ${videoContainer.toUpperCase()}${clipEnabled ? " • Trimmed" : ""})`
                : `Extract Audio (${audioFormat.toUpperCase()}${audioFormat === "mp3" ? ` ${audioBitrate}k` : ""}${embedThumbnail ? " + Cover Art" : ""}${clipEnabled ? " • Trimmed" : ""})`}
          </span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </button>
      </div>
    </div>
  );
};
