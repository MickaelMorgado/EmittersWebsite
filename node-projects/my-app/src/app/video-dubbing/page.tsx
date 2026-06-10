"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VersionBadge } from "@/components/VersionBadge";
import {
  Brain,
  Download,
  ExternalLink,
  Globe,
  Languages,
  Lock,
  Monitor,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";

const LANGUAGES = [
  { code: "fr", label: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "pt", label: "Portuguese", flag: "\u{1F1E7}\u{1F1F9}" },
];

const STATS = [
  { value: "80%+", label: "of YouTube videos have no dubbing" },
  { value: "100%", label: "runs locally on your PC" },
  { value: "0", label: "data sent to the cloud" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Transcription",
    desc: "Whisper-powered speech recognition extracts every word from the original audio",
  },
  {
    icon: Languages,
    title: "Instant Translation",
    desc: "Translates the full transcript to your target language in seconds",
  },
  {
    icon: Sparkles,
    title: "Neural Voice Synthesis",
    desc: "Microsoft Edge TTS generates natural-sounding AI voice in your language",
  },
  {
    icon: Zap,
    title: "Smart Audio Mixing",
    desc: "Original audio lowered to 20%, AI voice at full volume — perfect balance",
  },
];

export default function VideoDubbingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-cyan-500 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold heading-shine uppercase tracking-tight">
              Video Dubbing
            </h1>
            <p className="text-muted-foreground mt-2">
              Dub any YouTube video into your language
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-purple-500/40 text-purple-300 bg-purple-500/10"
          >
            <Monitor className="w-3 h-3 mr-1" />
            Desktop App
          </Badge>
        </div>

        {/* Hero — Pain Point + Solution */}
        <Card className="bg-gradient-to-br from-purple-500/10 via-black to-blue-500/10 border-white/10 mb-8">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="text-center space-y-3">
              <p className="text-red-400/90 text-sm font-medium uppercase tracking-widest">
                The Problem
              </p>
              <p className="text-2xl md:text-3xl font-bold leading-tight">
                Most YouTube videos are{" "}
                <span className="text-red-400">stuck in one language</span>
              </p>
              <p className="text-white/50 max-w-lg mx-auto">
                Tutorials, lectures, documentaries, interviews — millions of
                hours of content you can&apos;t understand because YouTube
                doesn&apos;t offer dubbing for 80%+ of its library.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="text-center space-y-3">
              <p className="text-green-400/90 text-sm font-medium uppercase tracking-widest">
                The Solution
              </p>
              <p className="text-2xl md:text-3xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Dub it yourself
                </span>{" "}
                in 60 seconds
              </p>
              <p className="text-white/50 max-w-lg mx-auto">
                Paste a YouTube URL. Pick a language. Get a dubbed video with
                natural AI voice — all running locally on your machine.
              </p>
            </div>

            <div className="aspect-video rounded-lg overflow-hidden bg-black/60 flex items-center justify-center border border-white/5">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/UKUcbFO__d0?mute=1&controls=0"
                title="Video Dubbing Demo"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="opacity-90"
              />
            </div>
            <p className="text-center text-xs text-white/30">
              Demo: Anton Kreil dubbed from English to French
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center p-4 bg-white/5 rounded-lg border border-white/5">
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {FEATURES.map((feat, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-5 space-y-2">
                <feat.icon className="w-5 h-5 text-purple-400" />
                <p className="text-sm font-semibold">{feat.title}</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  {feat.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Use Cases */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-4 h-4" />
              What can you dub?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                "University lectures & courses",
                "Tech tutorials & conferences",
                "Documentaries & interviews",
                "Podcasts & panel discussions",
                "News & analysis videos",
                "Gaming & commentary",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-white/60"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Download CTA */}
        <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30 mb-8">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold">Ready to dub?</h2>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              Free, open source, and runs entirely on your PC. No subscriptions,
              no cloud processing, no data collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                <a
                  href="https://github.com/MickaelMorgado/EmittersWebsite/tree/master/video-dubbing-app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download for Windows
                  <ExternalLink className="w-3 h-3 ml-2 opacity-50" />
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-white/30 pt-2">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> Fast
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" /> Free
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Supported Languages */}
        <Card className="bg-white/5 border-white/10 mb-8">
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
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-4 h-4" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { step: "1", label: "Paste URL" },
                { step: "2", label: "Pick Language" },
                { step: "3", label: "Transcribe" },
                { step: "4", label: "Generate Voice" },
                { step: "5", label: "Get Video" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
                    {s.step}
                  </div>
                  <span className="text-[10px] text-white/40">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-black/30 rounded-lg p-4 space-y-2">
              <p className="text-xs text-white/50 font-medium">
                Requirements:
              </p>
              <div className="flex flex-wrap gap-2">
                <code className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                  Python 3.10+
                </code>
                <code className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                  FFmpeg
                </code>
              </div>
              <p className="text-xs text-white/30">
                All AI dependencies (Whisper, Edge TTS, yt-dlp) install
                automatically on first run.
              </p>
            </div>
          </CardContent>
        </Card>

        <VersionBadge projectName="video-dubbing" />
      </div>
    </div>
  );
}
