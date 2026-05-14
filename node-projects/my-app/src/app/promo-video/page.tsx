"use client";

import { useEffect, useState, useRef } from "react";
import { Zap, Image as ImageIcon, Video, Upload, X, Settings, Scissors, Download, CheckCircle, Crop, Loader2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop", 
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
];

export default function PromoVideoPage() {
  const [frame, setFrame] = useState(0);
  const [dragState, setDragState] = useState<"idle" | "drag">("idle");
  const [showImages, setShowImages] = useState(true);
  const [hasImages, setHasImages] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [done, setDone] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(f => f + 1);
    }, 33);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (frame === 30) setDragState("drag");
    if (frame === 60) setDragState("idle");
    if (frame === 90) setHasImages(true);
    if (frame === 150) setCompressing(true);
    if (frame === 240) { setDone(true); setCompressing(false); }
    if (frame === 300) { setShowImages(false); setHasImages(false); setDone(false); }
    if (frame === 330) setHasVideo(true);
  }, [frame]);

  const presets = ["TikTok Portrait", "YouTube Shorts", "YouTube 16:9", "Square", "Story", "4K"];

  const formatTime = (f: number) => {
    const secs = Math.floor(f / 30);
    const ms = Math.floor((f % 30) * 3.33);
    return `${secs}.${ms.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase heading-shine">
              Media Processor
            </h1>
            <p className="text-muted-foreground">Compress images and crop videos with preset ratios</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => { setShowImages(true); setFrame(0); setHasVideo(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  showImages ? "bg-blue-500 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Images
              </button>
              <button
                onClick={() => { setShowImages(false); setFrame(0); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  !showImages ? "bg-purple-500 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                <Video className="w-4 h-4" />
                Videos
              </button>
            </div>
          </div>
        </div>

        {showImages ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 uppercase text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-all duration-300 ease-out
                      ${
                        dragState === "drag"
                          ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                          : "border-white/20 hover:border-white/40 hover:bg-white/5"
                      }
                    `}
                  >
                    {!hasImages ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white/60" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">Drop images here or click to browse</p>
                          <p className="text-sm text-white/40">Supports JPG, PNG, WebP, GIF</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SAMPLE_IMAGES.map((src, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                            <img src={src} alt={`Sample ${i+1}`} className="w-full h-full object-cover" />
                            {compressing && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-white" />
                              </div>
                            )}
                            {done && (
                              <div className="absolute top-2">
                                <span className="bg-green-500/80 text-[10px] py-0 h-5 px-2 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Done
                                </span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                              <p className="text-xs truncate">photo_{i+1}.jpg</p>
                              {done && <p className="text-[10px] text-green-400">2.4 MB → 420 KB</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="uppercase text-sm">Image Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Target Size (MB per image)</label>
                    <div className="flex items-center gap-4">
                      <input type="range" min="0.1" max="10" step="0.1" defaultValue={1} className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                      <Input type="number" defaultValue={1} className="w-20 bg-white/5 border-white/10 text-center" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500" />
                      <Crop className="w-4 h-4" />
                      Resize to specific resolution
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Input type="number" defaultValue={1920} className="bg-white/5 border-white/10" />
                      <Input type="number" defaultValue={1080} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {["1080p", "720p", "Square", "Story"].map(p => (
                        <button key={p} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">{p}</button>
                      ))}
                    </div>
                  </div>

                  {!done && (
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      {compressing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compressing...</> : <><Zap className="w-4 h-4 mr-2" /> Compress (4)</>}
                    </Button>
                  )}
                  {done && (
                    <Button className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10" variant="outline">
                      <Download className="w-4 h-4 mr-2" /> Download ZIP
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 uppercase text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasVideo ? (
                    <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer border-white/20 hover:border-white/40">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white/60" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">Drop videos here or click to browse</p>
                          <p className="text-sm text-white/40">Supports MP4, MOV, AVI, WebM</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <video
                        className="w-full aspect-video object-contain"
                        poster="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=450&fit=crop"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <button 
                          onClick={() => setVideoPlaying(!videoPlaying)}
                          className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                          {videoPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80">
                        <p className="text-sm font-medium">vacation_clip.mp4</p>
                        <p className="text-xs text-white/60">1920x1080 • 30s</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {hasVideo && (
                <Card className="bg-white/5 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="uppercase text-sm flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Trim: vacation_clip.mp4
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative h-24 bg-black/40 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img 
                          src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=200&fit=crop" 
                          className="w-full h-full object-cover opacity-50"
                        />
                      </div>
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20">
                        <div className="absolute left-[10%] w-[80%] h-full bg-purple-500/50" />
                        <div className="absolute left-[10%] w-3 h-6 bg-purple-500 -top-1" />
                        <div className="absolute right-[10%] w-3 h-6 bg-purple-500 -top-1" />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                      <span>0:00</span>
                      <span>0:15</span>
                      <span>0:30</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="uppercase text-sm flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Video Presets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset, i) => (
                      <button
                        key={preset}
                        onClick={() => setActivePreset(i)}
                        className={`text-xs px-3 py-2 rounded transition-colors text-left ${
                          activePreset === i ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-white/40">Output Format</label>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded bg-purple-500 text-white text-sm">WebM</button>
                      <button className="flex-1 py-2 rounded bg-white/10 text-white/60 text-sm">MP4</button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Original</span>
                      <span>48.2 MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Cropped</span>
                      <span className="text-purple-400">-- MB</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <Scissors className="w-4 h-4 mr-2" /> Crop Video
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 z-50 bg-white/10 px-4 py-2 rounded-lg text-sm font-mono">
        {formatTime(frame)} | {showImages ? "Images" : "Videos"} | Scene {showImages ? (frame < 90 ? 1 : frame < 240 ? 2 : 3) : (frame < 330 ? 1 : 2)}
      </div>
    </div>
  );
}