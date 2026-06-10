"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VersionBadge } from "@/components/VersionBadge";
import {
  CheckCircle,
  Code,
  Copy,
  Download,
  Film,
  Globe,
  Play,
  Share2,
  Terminal,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Status = "idle" | "generating" | "done" | "error";

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
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const paramUrl = searchParams.get("url");
    if (paramUrl) setUrl(paramUrl);
  }, [searchParams]);

  const isValidUrl =
    url.includes("youtube.com/watch") || url.includes("youtu.be/");

  async function handleGenerate() {
    if (!isValidUrl) return;
    setStatus("generating");
    setErrorMsg("");

    try {
      const res = await fetch("/api/video-dubbing/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate script");
      }

      const script = await res.text();
      const blob = new Blob([script], { type: "text/x-python" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "dubbed_video.py";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setStatus("done");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Generation failed");
    }
  }

  async function handleCopyScript() {
    try {
      const res = await fetch("/api/video-dubbing/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language }),
      });
      const script = await res.text();
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleShare() {
    const shareUrl =
      window.location.origin + "/video-dubbing?url=" + encodeURIComponent(url);
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    window.open(shareUrl, "_blank");
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
              Generate a Python script to dub YouTube videos into French or
              Portuguese
            </p>
          </div>
          <div className="flex items-center gap-2">
            {url && isValidUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/60 hover:text-white"
                onClick={handleShare}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            )}
            <Badge variant="outline" className="border-white/20 text-white/60">
              <Film className="w-3 h-3 mr-1" />
              Local
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

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!isValidUrl || status === "generating"}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                {status === "generating" ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Script
                  </>
                )}
              </Button>
              {isValidUrl && (
                <Button
                  variant="outline"
                  onClick={handleCopyScript}
                  className="border-white/20 text-white/60 hover:text-white"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {status === "done" && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium text-green-400">
                  Script downloaded!
                </span>
              </div>

              <div className="bg-black/40 rounded-lg p-4 space-y-3">
                <p className="text-sm text-white/70">
                  Install dependencies and run the script:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
                    <code className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                      pip install yt-dlp openai-whisper srt googletrans==4.0.0rc1 edge-tts
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
                    <code className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                      python dubbed_video.py
                    </code>
                  </div>
                </div>
                <p className="text-xs text-white/40">
                  Also requires: ffmpeg (system install)
                </p>
              </div>
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="w-4 h-4" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { step: "1", label: "Download" },
                { step: "2", label: "Transcribe" },
                { step: "3", label: "Translate" },
                { step: "4", label: "TTS" },
                { step: "5", label: "Mix" },
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
              Runs locally on your machine. Original audio lowered to 20% with AI voice at full volume.
            </p>
          </CardContent>
        </Card>

        <VersionBadge projectName="video-dubbing" />
      </div>
    </div>
  );
}

