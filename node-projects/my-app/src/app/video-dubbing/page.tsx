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
  Mic,
  Play,
  Share2,
  Volume2,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Status = "idle" | "running" | "done" | "error";

const LANGUAGES = [
  { code: "fr", label: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "pt", label: "Portuguese", flag: "\u{1F1E7}\u{1F1F9}" },
];

const MODELS = [
  { value: "tiny", label: "Tiny", desc: "Fastest, less accurate" },
  { value: "base", label: "Base", desc: "Balanced" },
  { value: "small", label: "Small", desc: "Better accuracy" },
  { value: "medium", label: "Medium", desc: "High accuracy" },
  { value: "large", label: "Large", desc: "Best accuracy, slowest" },
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
  const [whisperModel, setWhisperModel] = useState("base");

  useEffect(() => {
    const paramUrl = searchParams.get("url");
    if (paramUrl) setUrl(paramUrl);
  }, [searchParams]);
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [segments, setSegments] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const isValidUrl = url.includes("youtube.com/watch") || url.includes("youtu.be/");

  async function handleDub() {
    if (!isValidUrl) return;

    setStatus("running");
    setLogs([]);
    setDownloadUrl("");
    setSegments(0);
    setErrorMsg("");

    try {
      const res = await fetch("/api/video-dubbing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language, whisperModel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Unknown error");
        return;
      }

      setLogs(data.log || []);
      setSegments(data.segments || 0);
      setDownloadUrl(data.downloadUrl || "");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    }
  }

  function handleDownload() {
    if (!downloadUrl) return;
    window.open(downloadUrl, "_blank");
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
                  const shareUrl = `${window.location.origin}/video-dubbing?url=${encodeURIComponent(url)}`;
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

        {/* Input Section */}
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

            <div className="grid grid-cols-2 gap-4">
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
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        language === lang.code
                          ? "bg-white/10 border-white/30 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {lang.flag} {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  Whisper Model
                </label>
                <select
                  value={whisperModel}
                  onChange={(e) => setWhisperModel(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border bg-white/5 border-white/10 text-white text-sm"
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-black">
                      {m.label} — {m.desc}
                    </option>
                  ))}
                </select>
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

        {/* Progress / Logs */}
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
                {["Downloading video", "Transcribing audio", "Translating to target language", "Generating TTS segments", "Mixing audio tracks"].map(
                  (step, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      <span>Step {i + 1}/5: {step}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {status === "done" && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium text-green-400">Dubbing Complete!</span>
              </div>

              {segments > 0 && (
                <p className="text-sm text-white/60">
                  Generated {segments} TTS segments and mixed with original audio.
                </p>
              )}

              {logs.length > 0 && (
                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-white/50 max-h-32 overflow-y-auto">
                  {logs.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}

              {downloadUrl && (
                <video
                  controls
                  className="w-full rounded-lg border border-white/10"
                  src={downloadUrl}
                />
              )}

              <Button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Dubbed Video
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
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

        {/* How it works */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { step: "1", icon: "Download", label: "Download" },
                { step: "2", icon: "Mic", label: "Transcribe" },
                { step: "3", icon: "Globe", label: "Translate" },
                { step: "4", icon: "Volume2", label: "TTS" },
                { step: "5", icon: "Film", label: "Mix" },
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
