import React, { useState } from "react";
import {
  Film,
  Music,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Subtitles,
  Download,
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
  onSelectFolder: _onSelectFolder,
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
  const embedVideoThumbnail = true;

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
  const downloadPath: string = settings?.defaultDownloadPath || defaultPath;

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
    <div className="sticker-card p-5 sm:p-6 space-y-6 bg-white border-2 border-playful-dark shadow-pop">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-heading font-extrabold text-playful-dark flex items-center space-x-2">
            <span>Download Configuration</span>
          </h2>
          <p className="text-xs font-medium text-playful-mutedFg">
            Choose output stream format, audio bitrates, and album cover tags
          </p>
        </div>

        {/* Candy Mode Switcher */}
        <div className="flex items-center bg-playful-muted p-1.5 rounded-full border-2 border-playful-dark shadow-pop-sm gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode("video")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-heading font-extrabold transition-playful ${
              mode === "video"
                ? "bg-playful-violet text-white border-2 border-playful-dark shadow-pop-sm"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <Film className="w-4 h-4" strokeWidth={2.5} />
            <span>Video</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("audio")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-heading font-extrabold transition-playful ${
              mode === "audio"
                ? "bg-playful-pink text-white border-2 border-playful-dark shadow-pop-sm"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <Music className="w-4 h-4" strokeWidth={2.5} />
            <span>Audio Only</span>
          </button>
        </div>
      </div>

      {/* Mode Specific Settings */}
      {mode === "video" ? (
        <div className="space-y-5">
          {/* Resolution selector */}
          <div className="space-y-2">
            <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <span>Target Resolution & Quality</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {VIDEO_QUALITIES.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setVideoQuality(q.value)}
                  className={`flex flex-col items-start p-3 rounded-2xl border-2 border-playful-dark text-left transition-playful ${
                    videoQuality === q.value
                      ? "bg-playful-violet text-white shadow-pop"
                      : "bg-playful-muted text-playful-dark shadow-pop-sm hover:bg-white hover:-translate-y-0.5"
                  }`}
                >
                  <span className="font-heading font-extrabold text-sm">{q.label}</span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 ${
                      videoQuality === q.value ? "text-violet-200" : "text-slate-500"
                    }`}
                  >
                    {q.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Container format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-600">
                Container Format
              </label>
              <div className="flex gap-2">
                {(["mp4", "mkv", "webm"] as VideoContainer[]).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setVideoContainer(cnt)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 border-playful-dark text-xs font-heading font-extrabold uppercase transition-playful ${
                      videoContainer === cnt
                        ? "bg-playful-yellow text-slate-900 shadow-pop"
                        : "bg-white text-slate-600 shadow-pop-sm hover:bg-slate-50"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-600">
                Additional Streams
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-heading font-bold text-playful-dark bg-playful-muted p-2.5 rounded-xl border-2 border-playful-dark shadow-pop-sm hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={embedSubtitles}
                    onChange={(e) => setEmbedSubtitles(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-playful-dark text-playful-violet focus:ring-playful-violet accent-playful-violet"
                  />
                  <Subtitles className="w-4 h-4 text-playful-violet" strokeWidth={2.5} />
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
            <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-600">
              Audio Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AUDIO_FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setAudioFormat(f.value)}
                  className={`flex flex-col items-start p-3 rounded-2xl border-2 border-playful-dark text-left transition-playful ${
                    audioFormat === f.value
                      ? "bg-playful-pink text-white shadow-pop"
                      : "bg-playful-muted text-playful-dark shadow-pop-sm hover:bg-white hover:-translate-y-0.5"
                  }`}
                >
                  <span className="font-heading font-extrabold text-sm">{f.label}</span>
                  <span
                    className={`text-[11px] font-medium mt-0.5 ${
                      audioFormat === f.value ? "text-pink-100" : "text-slate-500"
                    }`}
                  >
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate selection if MP3 or M4A */}
          {(audioFormat === "mp3" || audioFormat === "m4a") && (
            <div className="space-y-2">
              <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-600">
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
                    className={`flex-1 py-2 px-2 rounded-xl border-2 border-playful-dark text-xs font-heading font-extrabold transition-playful ${
                      audioBitrate === b.val
                        ? "bg-playful-yellow text-slate-900 shadow-pop"
                        : "bg-white text-slate-600 shadow-pop-sm hover:bg-slate-50"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Album Art / Cover Art Feature Toggle */}
          <div className="p-4 rounded-2xl bg-playful-yellow/10 border-2 border-playful-dark shadow-pop-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-playful-yellow border-2 border-playful-dark flex items-center justify-center text-slate-950 shrink-0 shadow-pop-sm">
                  <ImageIcon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-extrabold text-sm text-playful-dark">
                      Embed Album Art / Cover Thumbnail
                    </span>
                    <span className="text-[10px] uppercase font-heading font-extrabold px-2 py-0.5 rounded-full bg-playful-pink text-white border border-playful-dark shadow-pop-sm">
                      ID3 Art
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Embeds the high-resolution video thumbnail as album artwork inside the{" "}
                    {audioFormat.toUpperCase()} file for music apps and smartphones.
                  </p>
                </div>
              </div>

              {/* Interactive Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={embedThumbnail}
                onClick={() => setEmbedThumbnail(!embedThumbnail)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-playful-dark transition-colors duration-200 ease-in-out focus:outline-none shadow-pop-sm ${
                  embedThumbnail ? "bg-playful-violet" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border-2 border-playful-dark shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    embedThumbnail ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t-2 border-playful-dark/10 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-heading font-bold text-playful-dark">
                <input
                  type="checkbox"
                  checked={embedMetadata}
                  onChange={(e) => setEmbedMetadata(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-playful-dark text-playful-violet focus:ring-playful-violet accent-playful-violet"
                />
                <Tag className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
                <span>Auto-tag metadata (Artist, Title, Album tags)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                className="flex items-center space-x-1 text-xs font-heading font-extrabold text-playful-violet hover:text-playful-violetHover transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>
                  {showMetadataEditor
                    ? "Hide Tag Editor"
                    : "Customize ID3 Tags"}
                </span>
                {showMetadataEditor ? (
                  <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                )}
              </button>
            </div>

            {/* Expandable ID3 Tag Customizer */}
            {showMetadataEditor && (
              <div className="pt-3 border-t-2 border-playful-dark/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-heading font-bold text-playful-dark flex items-center space-x-1">
                    <Music4 className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
                    <span>Track Title</span>
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Track Title"
                    className="w-full px-3 py-2 bg-white border-2 border-playful-dark rounded-xl text-xs font-medium text-playful-dark focus:outline-none focus:ring-2 focus:ring-playful-violet"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-heading font-bold text-playful-dark flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
                    <span>Artist / Creator</span>
                  </label>
                  <input
                    type="text"
                    value={metaArtist}
                    onChange={(e) => setMetaArtist(e.target.value)}
                    placeholder="Artist Name"
                    className="w-full px-3 py-2 bg-white border-2 border-playful-dark rounded-xl text-xs font-medium text-playful-dark focus:outline-none focus:ring-2 focus:ring-playful-violet"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-heading font-bold text-playful-dark flex items-center space-x-1">
                    <Disc className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
                    <span>Album Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={metaAlbum}
                    onChange={(e) => setMetaAlbum(e.target.value)}
                    placeholder="Album Name"
                    className="w-full px-3 py-2 bg-white border-2 border-playful-dark rounded-xl text-xs font-medium text-playful-dark focus:outline-none focus:ring-2 focus:ring-playful-violet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-heading font-bold text-playful-dark">
                      Year
                    </label>
                    <input
                      type="text"
                      value={metaYear}
                      onChange={(e) => setMetaYear(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full px-3 py-2 bg-white border-2 border-playful-dark rounded-xl text-xs font-mono font-bold text-playful-dark focus:outline-none focus:ring-2 focus:ring-playful-violet"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-heading font-bold text-playful-dark">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={metaGenre}
                      onChange={(e) => setMetaGenre(e.target.value)}
                      placeholder="e.g. Pop, Rock"
                      className="w-full px-3 py-2 bg-white border-2 border-playful-dark rounded-xl text-xs font-medium text-playful-dark focus:outline-none focus:ring-2 focus:ring-playful-violet"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp / Clip Trimming */}
      <div className="space-y-3 pt-4 border-t-2 border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-playful-pink/20 border-2 border-playful-dark flex items-center justify-center text-slate-900 shadow-pop-sm">
              <Scissors className="w-4 h-4 text-playful-dark" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-playful-dark">
                Trim / Clip Section
              </span>
              <p className="text-[11px] font-medium text-slate-500">
                Download only a specific time range
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={clipEnabled}
            onClick={() => setClipEnabled(!clipEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-playful-dark transition-colors duration-200 ease-in-out focus:outline-none shadow-pop-sm ${
              clipEnabled ? "bg-playful-pink" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white border border-playful-dark shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                clipEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {clipEnabled && (
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-playful-muted border-2 border-playful-dark shadow-pop-sm grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-heading font-bold text-playful-dark">
                    Start Time (MM:SS)
                  </label>
                  <button
                    type="button"
                    onClick={() => setClipStart("00:00")}
                    className="text-[10px] font-heading font-extrabold text-playful-violet hover:underline"
                  >
                    Start (00:00)
                  </button>
                </div>
                <input
                  type="text"
                  value={clipStart}
                  onChange={(e) => setClipStart(e.target.value)}
                  placeholder="00:00"
                  className="w-full px-3 py-2 bg-white border-2 border-playful-dark rounded-xl text-xs font-mono font-bold text-playful-dark focus:outline-none focus:ring-2 focus:ring-playful-violet"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-heading font-bold text-playful-dark">
                    End Time (MM:SS)
                  </label>
                  {media.durationString && (
                    <button
                      type="button"
                      onClick={() => setClipEnd(media.durationString!)}
                      className="text-[10px] font-heading font-extrabold text-playful-violet hover:underline"
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
                  className="w-full px-3 py-2 bg-white border-2 border-playful-dark rounded-xl text-xs font-mono font-bold text-playful-dark focus:outline-none focus:ring-2 focus:ring-playful-violet"
                />
              </div>
            </div>

            {/* Validation Error Alert */}
            {clipError && (
              <div className="p-3 rounded-2xl bg-rose-100 border-2 border-playful-dark shadow-pop-sm text-rose-900 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={2.5} />
                  <span className="font-heading font-bold">{clipError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetClipRange}
                  className="text-[11px] font-heading font-extrabold text-rose-900 hover:underline shrink-0 ml-2"
                >
                  Reset Range
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Filename (Editable & Sanitized) */}
      <div className="space-y-2 pt-4 border-t-2 border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-playful-violet" strokeWidth={2.5} />
            <span>Output Filename</span>
          </label>

          <div className="flex items-center space-x-2">
            {customFilename.length > 100 && (
              <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-playful-dark font-heading font-bold">
                Long title: will auto-trim safely
              </span>
            )}
            {customFilename !== media.title && (
              <button
                type="button"
                onClick={() => setCustomFilename(media.title)}
                className="flex items-center space-x-1 text-[11px] text-playful-violet hover:underline font-heading font-extrabold"
                title="Reset to original video title"
              >
                <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
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
            className="w-full px-3.5 py-2.5 bg-playful-muted border-2 border-playful-dark rounded-xl text-xs sm:text-sm font-heading font-bold text-playful-dark placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-playful-violet"
          />
        </div>
      </div>

      {/* Action Candy Download Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSubmitDownload}
          disabled={!!clipError}
          className="candy-btn w-full py-4 text-base sm:text-lg shadow-pop-lg hover:shadow-pop-xl"
        >
          <Download className="w-5 h-5 mr-2" strokeWidth={2.5} />
          <span>
            {clipError
              ? clipError
              : mode === "video"
                ? `Download Video (${videoQuality === "best" ? "Lossless Best" : videoQuality + "p"} ${videoContainer.toUpperCase()}${clipEnabled ? " • Trimmed" : ""})`
                : `Extract Audio (${audioFormat.toUpperCase()}${audioFormat === "mp3" ? ` ${audioBitrate}k` : ""}${embedThumbnail ? " + Cover Art" : ""}${clipEnabled ? " • Trimmed" : ""})`}
          </span>
          <Sparkles className="w-4 h-4 ml-2 text-playful-yellow fill-playful-yellow" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
