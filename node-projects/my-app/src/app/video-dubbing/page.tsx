"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VersionBadge } from "@/components/VersionBadge";
import {
  CheckCircle,
  Film,
  Globe,
  Loader2,
  Pause,
  Play,
  Upload,
  Volume2,
  XCircle,
} from "lucide-react";
import { Suspense, useCallback, useRef, useState } from "react";

type Status = "idle" | "processing" | "ready" | "playing" | "error";

const LANGUAGES = [
  { code: "fr", label: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "pt", label: "Portuguese", flag: "\u{1F1E7}\u{1F1F9}" },
];

const TTS_VOICE_MAP: Record<string, string> = {
  fr: "fr",
  pt: "pt-BR",
};

interface Segment {
  start: number;
  end: number;
  text: string;
}

export default function VideoDubbingPage() {
  return (
    <Suspense>
      <VideoDubbingContent />
    </Suspense>
  );
}

function VideoDubbingContent() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("fr");
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [progress, setProgress] = useState(0);

  const timersRef = useRef<number[]>([]);
  const playingRef = useRef(false);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const isValidUrl =
    url.includes("youtube.com/watch") || url.includes("youtu.be/");

  const getVideoId = (ytUrl: string): string | null => {
    const match = ytUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getVideoId(url);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("video/") || file.type.startsWith("audio/"))) {
      setVideoFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const decodeAudioFromFile = async (file: File): Promise<Float32Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new OfflineAudioContext(1, 1, 44100);
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer.getChannelData(0);
  };

  const transcribe = async (audioData: Float32Array): Promise<Segment[]> => {
    addLog("Loading Whisper model (first time downloads ~75MB)...");
    setProgress(10);

    const { pipeline } = await import("@xenova/transformers");

    addLog("Whisper loaded. Transcribing...");
    setProgress(25);

    const transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny"
    );

    setProgress(35);

    const result = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: "english",
      return_timestamps: true,
    } as Parameters<typeof transcriber>[1]);

    const chunks =
      (
        result as {
          chunks?: Array<{ timestamp: [number, number]; text: string }>;
        }
      ).chunks ?? [];

    setProgress(50);
    addLog(`Transcribed ${chunks.length} segments`);

    return chunks.map((c) => ({
      start: c.timestamp[0],
      end: c.timestamp[1],
      text: c.text.trim(),
    }));
  };

  const translateSegments = async (
    segs: Segment[],
    targetLang: string
  ): Promise<Segment[]> => {
    addLog(`Translating ${segs.length} segments to ${targetLang}...`);
    setProgress(55);

    const { translate: gtTranslate } = await import(
      "@vitalets/google-translate-api"
    );

    const results: Segment[] = [];
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      try {
        const res = await gtTranslate(seg.text, { to: targetLang });
        results.push({ start: seg.start, end: seg.end, text: res.text });
      } catch {
        results.push(seg);
      }
      if (i % 10 === 0) {
        setProgress(55 + Math.round((i / segs.length) * 25));
      }
    }

    addLog(`Translated ${results.length} segments`);
    return results;
  };

  const handleProcess = async () => {
    if (!videoFile) return;

    setStatus("processing");
    setLogs([]);
    setErrorMsg("");
    setSegments([]);

    try {
      addLog("STEP 1/3: Decoding audio...");
      setProgress(5);

      const audioData = await decodeAudioFromFile(videoFile);
      addLog(`  Decoded ${(audioData.length / 44100).toFixed(1)}s of audio`);

      const transcript = await transcribe(audioData);

      const translated = await translateSegments(transcript, language);

      setSegments(translated);
      setProgress(100);
      addLog("Done! Click Play to hear the dubbed audio over the YouTube video.");
      setStatus("ready");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Processing failed");
    }
  };

  const handlePlay = () => {
    if (segments.length === 0) return;

    setStatus("playing");
    playingRef.current = true;
    speechSynthesis.cancel();

    const lang = TTS_VOICE_MAP[language] || "fr";
    const voices = speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.startsWith(lang)) ||
      voices.find((v) => v.lang.startsWith(language)) ||
      voices[0];

    for (const seg of segments) {
      const delayMs = Math.round(seg.start * 1000);
      const timer = window.setTimeout(() => {
        if (!playingRef.current) return;
        const utterance = new SpeechSynthesisUtterance(seg.text);
        if (voice) utterance.voice = voice;
        utterance.lang = `${language}-${language === "pt" ? "BR" : "FR"}`;
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
      }, delayMs);
      timersRef.current.push(timer);
    }

    const lastSeg = segments[segments.length - 1];
    const totalMs = lastSeg ? (lastSeg.end + 2) * 1000 : 30000;
    const endTimer = window.setTimeout(() => {
      if (playingRef.current) handleStop();
    }, totalMs);
    timersRef.current.push(endTimer);
  };

  const handleStop = () => {
    playingRef.current = false;
    speechSynthesis.cancel();
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setStatus("ready");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-3xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold heading-shine uppercase">
              Video Dubbing
            </h1>
            <p className="text-muted-foreground mt-2">
              Dub YouTube videos in your browser
            </p>
          </div>
          <Badge variant="outline" className="border-white/20 text-white/60">
            <Film className="w-3 h-3 mr-1" />
            Browser
          </Badge>
        </div>

        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-4 h-4" />
              YouTube Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                YouTube URL
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              {url && !isValidUrl && (
                <p className="text-xs text-red-400 mt-1">
                  Enter a valid YouTube URL
                </p>
              )}
            </div>

            {videoId && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Audio Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-purple-300">
                <span className="font-medium">Step 1:</span>{" "}
                <a
                  href="https://cobalt.tools/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-purple-200"
                >
                  Open cobalt.tools
                </a>{" "}
                → paste the YouTube URL → download the audio (MP3)
              </p>
              <p className="text-xs text-purple-300 mt-1">
                <span className="font-medium">Step 2:</span>{" "}
                Drop the audio file below
              </p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={
                "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer " +
                (videoFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-white/20 hover:border-white/40")
              }
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {videoFile ? (
                <div className="space-y-1">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto" />
                  <p className="text-sm text-green-400">{videoFile.name}</p>
                  <p className="text-xs text-white/40">
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 text-white/30 mx-auto" />
                  <p className="text-sm text-white/50">
                    Drag & drop audio file or click to browse
                  </p>
                  <p className="text-[10px] text-white/30">
                    MP3, WAV, M4A, OGG, or any audio format
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Target Language
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={
                      "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all " +
                      (language === lang.code
                        ? "bg-white/10 border-white/30 text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10")
                    }
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleProcess}
              disabled={!videoFile || status === "processing"}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing... {progress}%
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Process & Dub
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {status === "processing" && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-white/50 max-h-48 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="py-0.5">
                    {log.startsWith("STEP") ? (
                      <span className="text-purple-400">{log}</span>
                    ) : (
                      <span>{log}</span>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                    <span>Initializing...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {status === "ready" && segments.length > 0 && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium text-green-400">
                  Ready! {segments.length} translated segments
                </span>
              </div>

              <div className="bg-black/40 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
                {segments.slice(0, 10).map((seg, i) => (
                  <div key={i} className="text-xs text-white/40">
                    <span className="text-white/20">{seg.start.toFixed(1)}s</span>{" "}
                    {seg.text}
                  </div>
                ))}
                {segments.length > 10 && (
                  <div className="text-xs text-white/20">
                    ...and {segments.length - 10} more
                  </div>
                )}
              </div>

              <p className="text-xs text-white/40">
                Mute the YouTube player first, then click Play to hear the dubbed
                TTS audio synced with the video.
              </p>

              <Button
                onClick={handlePlay}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Dubbed Audio
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "playing" && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" />
                <span className="font-medium text-blue-400">
                  Playing dubbed audio...
                </span>
              </div>
              <Button
                onClick={handleStop}
                variant="outline"
                className="w-full border-white/20 text-white/60 hover:text-white"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "error" && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="font-medium text-red-400">Error</span>
              </div>
              <p className="text-sm text-white/60 mt-2">{errorMsg}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { step: "1", label: "Download audio" },
                { step: "2", label: "Transcribe" },
                { step: "3", label: "Translate" },
                { step: "4", label: "TTS" },
                { step: "5", label: "Play" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                    {s.step}
                  </div>
                  <span className="text-[10px] text-white/40">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-4 text-center">
              All processing runs in your browser. Whisper WASM transcribes,
              Google Translate translates, Web Speech API generates voice.
            </p>
          </CardContent>
        </Card>

        <VersionBadge projectName="video-dubbing" />
      </div>
    </div>
  );
}
