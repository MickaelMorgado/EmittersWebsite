"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VersionBadge } from "@/components/VersionBadge";
import {
  Download,
  ExternalLink,
  Film,
  Globe,
  Monitor,
  Play,
  Terminal,
} from "lucide-react";

const LANGUAGES = [
  { code: "fr", label: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "pt", label: "Portuguese", flag: "\u{1F1E7}\u{1F1F9}" },
];

export default function VideoDubbingPage() {
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
              Dub YouTube videos into French or Portuguese
            </p>
          </div>
          <Badge variant="outline" className="border-white/20 text-white/60">
            <Monitor className="w-3 h-3 mr-1" />
            Desktop App
          </Badge>
        </div>

        {/* Hero */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="pt-6 space-y-6">
            <div className="aspect-video rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/UKUcbFO__d0?mute=1&controls=0"
                title="Video Dubbing Demo"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="opacity-80"
              />
            </div>
            <p className="text-center text-sm text-white/40">
              Demo: Anton Kreil dubbed from English to French
            </p>
          </CardContent>
        </Card>

        {/* Desktop App */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Download Desktop App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-white/60">
              A standalone app that runs on your machine. Downloads YouTube
              videos, transcribes with Whisper, translates, generates AI voice,
              and mixes the final dubbed video — all locally.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  step: "1",
                  label: "Paste URL",
                  desc: "YouTube video URL",
                },
                {
                  step: "2",
                  label: "Pick Language",
                  desc: "French or Portuguese",
                },
                {
                  step: "3",
                  label: "Click Process",
                  desc: "Runs locally on your PC",
                },
                {
                  step: "4",
                  label: "Get Video",
                  desc: "Saved to your Desktop",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-black/20 rounded-lg p-3"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-white/40">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                <a
                  href="https://github.com/MickaelMorgado/EmittersWebsite/tree/master/video-dubbing-app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  View on GitHub
                  <ExternalLink className="w-3 h-3 ml-2 opacity-50" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-black/40 rounded-lg p-4 space-y-2">
              <p className="text-xs text-white/50 font-medium">
                Required (install once):
              </p>
              <div className="space-y-1">
                <code className="block text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                  Python 3.10+
                </code>
                <code className="block text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                  FFmpeg (winget install FFmpeg)
                </code>
              </div>
            </div>
            <div className="bg-black/40 rounded-lg p-4 space-y-2">
              <p className="text-xs text-white/50 font-medium">
                Auto-installed on first run:
              </p>
              <div className="space-y-1">
                <code className="block text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded">
                  yt-dlp (YouTube download)
                </code>
                <code className="block text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded">
                  openai-whisper (speech-to-text)
                </code>
                <code className="block text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded">
                  edge-tts (AI voice generation)
                </code>
                <code className="block text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded">
                  googletrans (translation)
                </code>
              </div>
            </div>
            <div className="bg-black/40 rounded-lg p-4">
              <p className="text-xs text-white/50 font-medium mb-2">
                Quick start:
              </p>
              <code className="block text-xs text-white/70">
                python app.py
              </code>
              <p className="text-xs text-white/30 mt-1">
                Opens http://localhost:8765 in your browser
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supported Languages */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Supported Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center gap-3 bg-black/20 rounded-lg p-3"
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p className="text-sm font-medium">{lang.label}</p>
                    <p className="text-xs text-white/40">
                      AI voice:{" "}
                      {lang.code === "fr"
                        ? "Henri (Male)"
                        : "Antonio (Male)"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-4 h-4" />
              How It Works
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
              Everything runs locally on your machine. No data leaves your PC.
              Original audio lowered to 20% with AI voice at full volume.
            </p>
          </CardContent>
        </Card>

        <VersionBadge projectName="video-dubbing" />
      </div>
    </div>
  );
}
