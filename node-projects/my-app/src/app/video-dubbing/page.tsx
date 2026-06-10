"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VersionBadge } from "@/components/VersionBadge";
import {
  CheckCircle,
  Download,
  Film,
  Globe,
  Loader2,
  Play,
  Share2,
  Volume2,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type Status = "idle" | "running" | "done" | "error";

const LANGUAGES = [
  { code: "fr", label: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "pt", label: "Portuguese", flag: "\u{1F1E7}\u{1F1F9}" },
];

export default function VideoDubbingPage() {
  return (
    <Suspense>
      <VideoDubbingContent />
    </Suspense>
  );
}

function VideoDubbingContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("fr");
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [segments, setSegments] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const paramUrl = searchParams.get("url");
    if (paramUrl) setUrl(paramUrl);
  }, [searchParams]);

  const isValidUrl = url.includes("youtube.com/watch") || url.includes("youtu.be/");

  async function handleDub() {
    if (!isValidUrl) return;

    setStatus("running");
    setLogs([]);
    setSegments(0);
    setErrorMsg("");
    setMixedAudioUrl(null);

    try {
      const res = await fetch("/api/video-dubbing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, language: language }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Unknown error");
        return;
      }

      setLogs(data.logs || []);
      setSegments(data.ttsSegments ? data.ttsSegments.length : 0);

      const FFmpegModule = await import("@ffmpeg/ffmpeg");
      const UtilModule = await import("@ffmpeg/util");
      const { FFmpeg } = FFmpegModule;
      const { toBlobURL } = UtilModule;

      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", (evt: { message: string }) => {
        console.log("[ffmpeg]", evt.message);
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(baseURL + "/ffmpeg-core.js", "text/javascript"),
        wasmURL: await toBlobURL(baseURL + "/ffmpeg-core.wasm", "application/wasm"),
      });

      const originalBuf = Uint8Array.from(atob(data.originalAudio), (c) => c.charCodeAt(0));
      await ffmpeg.writeFile("original.mp3", originalBuf);

      for (let si = 0; si < data.ttsSegments.length; si++) {
        const seg = data.ttsSegments[si];
        const segBuf = Uint8Array.from(atob(seg.audioBase64), (c) => c.charCodeAt(0));
        await ffmpeg.writeFile("tts_" + seg.index + ".mp3", segBuf);
      }

      const filterParts: string[] = [];
      const inputs: string[] = ["-i", "original.mp3"];

      for (let si = 0; si < data.ttsSegments.length; si++) {
        const seg = data.ttsSegments[si];
        inputs.push("-i", "tts_" + seg.index + ".mp3");
      }

      for (let si = 0; si < data.ttsSegments.length; si++) {
        const seg = data.ttsSegments[si];
        const delayMs = Math.round(seg.start * 1000);
        filterParts.push("[" + (si + 1) + ":a]adelay=" + delayMs + "|" + delayMs + "[d" + si + "]");
      }

      let mixFilter = "[0:a]volume=0.2[orig]";
      for (let si = 0; si < data.ttsSegments.length; si++) {
        mixFilter += "[d" + si + "]";
      }
      mixFilter += "amix=inputs=" + (data.ttsSegments.length + 1) + ":normalize=0[out]";
      filterParts.push(mixFilter);

      let maxEnd = 0;
      for (let si = 0; si < data.ttsSegments.length; si++) {
        if (data.ttsSegments[si].end > maxEnd) maxEnd = data.ttsSegments[si].end;
      }

      await ffmpeg.exec(
        inputs.concat([
          "-filter_complex", filterParts.join(";"),
          "-map", "[out]",
          "-t", String(maxEnd + 5),
          "-y", "output.mp3",
        ])
      );

      const outputData = await ffmpeg.readFile("output.mp3");
      const outputBytes = outputData instanceof Uint8Array ? outputData : new Uint8Array(outputData as unknown as ArrayBuffer);
      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: "audio/mpeg" });
      const mixUrl = URL.createObjectURL(blob);
      setMixedAudioUrl(mixUrl);
      setStatus("done");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    }
  }

  function handleDownload() {
    if (!mixedAudioUrl) return;
    const a = document.createElement("a");
    a.href = mixedAudioUrl;
    a.download = "dubbed_output.mp3";
    a.click();
  }

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
              Translate YouTube videos into French or Portuguese with AI voice dubbing
            </p>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/60 hover:text-white"
                onClick={async () => {
                  const shareUrl = window.location.origin + "/video-dubbing?url=" + encodeURIComponent(url);
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                  } catch {
                    const input = document.createElement("input");
                    input.value = shareUrl;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand("copy");
                    document.body.removeChild(input);
                  }
                  window.open(shareUrl, "_blank");
                }}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            )}
            <Badge variant="outline" className="border-white/20 text-white/60">
              <Film className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-4 h-4" />
              Source Video
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
                    className={"flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all " + (
                      language === lang.code
                        ? "bg-white/10 border-white/30 text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    )}
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleDub}
              disabled={!isValidUrl || status === "running"}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
            >
              {status === "running" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Start Dubbing
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {status === "running" && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-sm text-white/70">
                  This may take several minutes depending on video length...
                </span>
              </div>
              <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-white/50 max-h-48 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    {log.startsWith("STEP") ? (
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400 mt-0.5 shrink-0" />
                    ) : (
                      <span className="w-3 shrink-0" />
                    )}
                    <span>{log}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="flex items-center gap-2 py-0.5">
                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                    <span>Initializing pipeline...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {status === "done" && mixedAudioUrl && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium text-green-400">Dubbing Complete!</span>
              </div>

              {segments > 0 && (
                <p className="text-sm text-white/60">
                  Generated {segments} TTS segments mixed with original audio.
                </p>
              )}

              <audio ref={audioRef} controls className="w-full" src={mixedAudioUrl} />

              <Button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Dubbed Audio
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
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { step: "1", label: "Transcribe" },
                { step: "2", label: "Translate" },
                { step: "3", label: "TTS" },
                { step: "4", label: "Mix" },
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
              Original audio is lowered to 20% and the AI-generated voice is played at full volume.
            </p>
          </CardContent>
        </Card>

        <VersionBadge projectName="video-dubbing" />
      </div>
    </div>
  );
}
