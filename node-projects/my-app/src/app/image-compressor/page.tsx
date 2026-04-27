"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Download, Image as ImageIcon, Zap, CheckCircle, Loader2, Crop, Video, Scissors } from "lucide-react";
import Image from "next/image";
import { VersionBadge } from "@/components/VersionBadge";
import JSZip from "jszip";

type Tab = "images" | "videos";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  compressedUrl?: string;
  status: "pending" | "compressing" | "done" | "error";
  progress: number;
  originalWidth?: number;
  originalHeight?: number;
}

interface VideoFile {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  croppedBlob?: Blob;
  croppedUrl?: string;
  croppedSize?: number;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  duration?: number;
}

const VIDEO_PRESETS = [
  { name: "TikTok Portrait", width: 1080, height: 1920, ratio: "9:16", icon: "📱" },
  { name: "YouTube Shorts", width: 1080, height: 1920, ratio: "9:16", icon: "🎬" },
  { name: "YouTube 16:9", width: 1920, height: 1080, ratio: "16:9", icon: "📺" },
  { name: "Square (Instagram)", width: 1080, height: 1080, ratio: "1:1", icon: "⬜" },
  { name: "Story", width: 1080, height: 1920, ratio: "9:16", icon: "📖" },
  { name: "Landscape", width: 1920, height: 1080, ratio: "16:9", icon: "🌄" },
  { name: "4K", width: 3840, height: 2160, ratio: "16:9", icon: "🖥️" },
];

export default function ImageCompressorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("images");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [targetMB, setTargetMB] = useState(1);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [enableCrop, setEnableCrop] = useState(false);
  const [cropWidth, setCropWidth] = useState(1920);
  const [cropHeight, setCropHeight] = useState(1080);
  const [videoWidth, setVideoWidth] = useState(1080);
  const [videoHeight, setVideoHeight] = useState(1920);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoFormat, setVideoFormat] = useState<"webm" | "mp4">("webm");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleImageFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(
      (file) => file.type.startsWith("image/")
    );

    const newImages: ImageFile[] = imageFiles.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      status: "pending",
      progress: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleVideoFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const videoFiles = Array.from(files).filter(
      (file) => file.type.startsWith("video/")
    );

    const newVideos: VideoFile[] = videoFiles.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      status: "pending",
      progress: 0,
    }));

    setVideos((prev) => [...prev, ...newVideos]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (activeTab === "images") {
        handleImageFiles(e.dataTransfer.files);
      } else {
        handleVideoFiles(e.dataTransfer.files);
      }
    },
    [activeTab, handleImageFiles, handleVideoFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const removeVideo = (id: string) => {
    setVideos((prev) => {
      const vid = prev.find((i) => i.id === id);
      if (vid) URL.revokeObjectURL(vid.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const compressImage = async (
    file: File,
    targetMB: number,
    cropEnabled: boolean = false,
    targetWidth: number = 0,
    targetHeight: number = 0
  ): Promise<{ blob: Blob; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = new (window.Image || (globalThis as any).Image)();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (cropEnabled && targetWidth > 0 && targetHeight > 0) {
          width = targetWidth;
          height = targetHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const targetBytes = targetMB * 1024 * 1024;
        let quality = 0.9;
        let iterations = 0;
        const maxIterations = 20;

        const compress = () => {
          return new Promise<{ blob: Blob; size: number }>((res, rej) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  rej(new Error("Compression failed"));
                  return;
                }
                res({ blob, size: blob.size });
              },
              "image/jpeg",
              quality
            );
          });
        };

        const attemptCompression = async () => {
          let result = await compress();

          while (result.size > targetBytes && iterations < maxIterations) {
            if (result.size > targetBytes * 1.5) {
              width = Math.floor(width * 0.8);
              height = Math.floor(height * 0.8);
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
            }

            quality -= 0.05;
            iterations++;
            result = await compress();
          }

          resolve(result);
        };

        attemptCompression();
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const cropVideo = async (
    videoFile: VideoFile,
    targetWidth: number,
    targetHeight: number,
    outputFormat: "webm" | "mp4" = "webm"
  ): Promise<{ blob: Blob; size: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true; // Mute to avoid autoplay issues
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.currentTime = 0;
      };

      video.onloadeddata = async () => {
        try {
          // Create canvas for resizing
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          // Calculate crop to center
          const videoAspect = video.videoWidth / video.videoHeight;
          const targetAspect = targetWidth / targetHeight;
          
          let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
          
          if (videoAspect > targetAspect) {
            sw = video.videoHeight * targetAspect;
            sx = (video.videoWidth - sw) / 2;
          } else {
            sh = video.videoWidth / targetAspect;
            sy = (video.videoHeight - sh) / 2;
          }

          // Use MediaRecorder to capture video frames
          const stream = canvas.captureStream(30); // 30 FPS
          
          // Check supported mime types based on output format
          let mimeType = outputFormat === "mp4" ? "video/mp4" : "video/webm;codecs=vp9";
          
          if (outputFormat === "webm") {
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = "video/webm;codecs=vp8";
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "video/webm";
              }
            }
          } else {
            // For MP4, try different codec combinations
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = "video/mp4;codecs=avc1.42E01E,mp4a.40.2";
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "video/mp4;codecs=avc1.42001E,mp4a.40.2";
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                  // Fallback to WebM if MP4 not supported
                  console.warn("MP4 not supported, falling back to WebM");
                  mimeType = "video/webm;codecs=vp9";
                }
              }
            }
          }

          const recorder = new MediaRecorder(stream, {
            mimeType
          });

          const chunks: Blob[] = [];
          
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.onstop = () => {
            const actualMimeType = mimeType.split(';')[0];
            const actualFormat = actualMimeType.includes('mp4') ? 'mp4' : 'webm';
            const blob = new Blob(chunks, { type: actualMimeType });
            URL.revokeObjectURL(video.src);
            resolve({ blob, size: blob.size });
          };

          recorder.onerror = (e) => {
            reject(new Error("Recording failed: " + String(e)));
          };

          // Start recording
          recorder.start(100); // Collect data every 100ms

          // Play video and draw frames to canvas
          video.currentTime = 0;
          video.play();

          const drawFrame = () => {
            if (video.ended) {
              setTimeout(() => {
                if (recorder.state === "recording") {
                  recorder.stop();
                }
              }, 500);
              return;
            }
            
            if (!video.paused) {
              // Draw current frame scaled/cropped
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
              requestAnimationFrame(drawFrame);
            }
          };

          // Start drawing
          drawFrame();

          // Set timeout to stop recording (max 30 seconds or video duration)
          const duration = Math.min(video.duration || 10, 30);
          setTimeout(() => {
            if (recorder.state === "recording") {
              recorder.stop();
              video.pause();
            }
          }, (duration * 1000) + 1000);

        } catch (err) {
          reject(err);
        }
      };

      video.onerror = () => reject(new Error("Failed to load video"));
      video.src = URL.createObjectURL(videoFile.file);
    });
  };

  const handleCompress = async () => {
    setIsCompressing(true);

    const updatedImages = [...images];

    for (let i = 0; i < updatedImages.length; i++) {
      if (updatedImages[i].status === "done") continue;

      updatedImages[i].status = "compressing";
      updatedImages[i].progress = 0;
      setImages([...updatedImages]);

      try {
        for (let p = 0; p <= 100; p += 10) {
          await new Promise((r) => setTimeout(r, 50));
          updatedImages[i].progress = p;
          setImages([...updatedImages]);
        }

        const result = await compressImage(updatedImages[i].file, targetMB, enableCrop, cropWidth, cropHeight);

        if (updatedImages[i].preview) {
          URL.revokeObjectURL(updatedImages[i].preview);
        }

        updatedImages[i].compressedBlob = result.blob;
        updatedImages[i].compressedSize = result.size;
        updatedImages[i].compressedUrl = URL.createObjectURL(result.blob);
        updatedImages[i].preview = updatedImages[i].compressedUrl || "";
        updatedImages[i].status = "done";
        updatedImages[i].progress = 100;
      } catch (error) {
        updatedImages[i].status = "error";
        console.error("Compression error:", error);
      }

      setImages([...updatedImages]);
    }

    setIsCompressing(false);
  };

  const handleVideoCrop = async () => {
    setIsProcessingVideo(true);

    const updatedVideos = [...videos];

    for (let i = 0; i < updatedVideos.length; i++) {
      if (updatedVideos[i].status === "done") continue;

      updatedVideos[i].status = "processing";
      updatedVideos[i].progress = 0;
      setVideos([...updatedVideos]);

      try {
        for (let p = 0; p <= 100; p += 5) {
          await new Promise((r) => setTimeout(r, 30));
          updatedVideos[i].progress = p;
          setVideos([...updatedVideos]);
        }

        const result = await cropVideo(updatedVideos[i], videoWidth, videoHeight, videoFormat);

        if (updatedVideos[i].preview) {
          URL.revokeObjectURL(updatedVideos[i].preview);
        }

        updatedVideos[i].croppedBlob = result.blob;
        updatedVideos[i].croppedSize = result.size;
        updatedVideos[i].croppedUrl = URL.createObjectURL(result.blob);
        updatedVideos[i].status = "done";
        updatedVideos[i].progress = 100;
      } catch (error) {
        updatedVideos[i].status = "error";
        console.error("Video processing error:", error);
      }

      setVideos([...updatedVideos]);
    }

    setIsProcessingVideo(false);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();

    images.forEach((img) => {
      if (img.compressedBlob && img.status === "done") {
        const ext = img.file.name.split(".").pop() || "jpg";
        const name = img.file.name.replace(/\.[^/.]+$/, "") + "_compressed." + ext;
        zip.file(name, img.compressedBlob);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed_images_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadVideos = () => {
    videos.forEach((vid) => {
      if (vid.croppedBlob && vid.status === "done") {
        const ext = videoFormat === "mp4" ? "mp4" : "webm";
        const name = vid.file.name.replace(/\.[^/.]+$/, "") + `_${videoWidth}x${videoHeight}.${ext}`;
        const url = URL.createObjectURL(vid.croppedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  const totalOriginalSize = images.reduce((acc, img) => acc + img.originalSize, 0);
  const totalCompressedSize = images.reduce(
    (acc, img) => acc + (img.compressedSize || 0),
    0
  );
  const savedPercentage = totalOriginalSize > 0
    ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
    : 0;

  const totalVideoOriginal = videos.reduce((acc, v) => acc + v.originalSize, 0);
  const totalVideoCropped = videos.reduce((acc, v) => acc + (v.croppedSize || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 heading-shine uppercase">
              Media Processor
            </h1>
            <p className="text-muted-foreground">
              Compress images and crop videos with preset ratios
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Tab Switcher */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("images")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === "images"
                    ? "bg-blue-500 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Images
              </button>
              <button
                onClick={() => setActiveTab("videos")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === "videos"
                    ? "bg-purple-500 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Video className="w-4 h-4" />
                Videos
              </button>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => (window.location.href = "/")}
              className="border-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeTab === "images" ? (
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
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-all duration-300 ease-out
                      ${
                        isDragging
                          ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                          : "border-white/20 hover:border-white/40 hover:bg-white/5"
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFiles(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/60" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">
                          Drop images here or click to browse
                        </p>
                        <p className="text-sm text-white/40">
                          Supports JPG, PNG, WebP, GIF
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {images.length > 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="uppercase text-sm">
                      Images ({images.length})
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImages([])}
                      className="border-white/10 text-xs"
                    >
                      Clear All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="relative group aspect-square rounded-lg overflow-hidden bg-white/5"
                        >
                          <Image
                            src={img.preview}
                            alt={img.file.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-xs truncate font-medium">
                                {img.file.name}
                              </p>
                              {img.status === "done" && img.compressedSize ? (
                                <p className="text-[10px] text-green-400">
                                  {formatFileSize(img.originalSize)} → {formatFileSize(img.compressedSize)}
                                </p>
                              ) : (
                                <p className="text-[10px] text-white/60">
                                  {formatFileSize(img.originalSize)}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {img.status === "compressing" && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                          {img.status === "done" && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-green-500/80 text-[10px] py-0 h-5">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Done
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {isCompressing && (
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 uppercase text-sm">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Compressing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-hidden rounded-lg h-32 bg-black/40">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 60 + 20}px`,
                                animationDelay: `${i * 0.05}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-white/80" />
                          <p className="text-sm text-white/60">Processing images...</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="uppercase text-sm">Image Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">
                      Target Size (MB per image)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={targetMB}
                        onChange={(e) => setTargetMB(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <Input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={targetMB}
                        onChange={(e) =>
                          setTargetMB(Math.max(0.1, Math.min(10, parseFloat(e.target.value) || 1)))
                        }
                        className="w-20 bg-white/5 border-white/10 text-center"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableCrop}
                        onChange={(e) => setEnableCrop(e.target.checked)}
                        className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                      />
                      <Crop className="w-4 h-4" />
                      Resize to specific resolution
                    </label>

                    {enableCrop && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">Width</label>
                          <Input
                            type="number"
                            min="1"
                            max="8192"
                            value={cropWidth}
                            onChange={(e) => setCropWidth(Math.max(1, parseInt(e.target.value) || 1920))}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">Height</label>
                          <Input
                            type="number"
                            min="1"
                            max="8192"
                            value={cropHeight}
                            onChange={(e) => setCropHeight(Math.max(1, parseInt(e.target.value) || 1080))}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                      </div>
                    )}
                    {enableCrop && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[
                          { w: 1920, h: 1080, label: "1080p" },
                          { w: 1280, h: 720, label: "720p" },
                          { w: 1080, h: 1080, label: "Square" },
                          { w: 1080, h: 1920, label: "Story" },
                          { w: 1200, h: 628, label: "OG Image" },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              setCropWidth(preset.w);
                              setCropHeight(preset.h);
                            }}
                            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {images.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Images</span>
                        <span>{images.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Original Size</span>
                        <span>{formatFileSize(totalOriginalSize)}</span>
                      </div>
                      {totalCompressedSize > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Compressed Size</span>
                            <span className="text-green-400">
                              {formatFileSize(totalCompressedSize)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Saved</span>
                            <span className="text-green-400">{savedPercentage}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleCompress}
                    disabled={images.length === 0 || isCompressing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Compress {images.length > 0 ? `(${images.length})` : ""}
                      </>
                    )}
                  </Button>

                  {images.some((i) => i.status === "done") && (
                    <Button
                      onClick={handleDownloadZip}
                      variant="outline"
                      className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download ZIP
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* VIDEO TAB */
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
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => videoInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-all duration-300 ease-out
                      ${
                        isDragging
                          ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                          : "border-white/20 hover:border-white/40 hover:bg-white/5"
                      }
                    `}
                  >
                    <input
                      ref={videoInputRef}
                      type="file"
                      multiple
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleVideoFiles(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                        <Video className="w-8 h-8 text-white/60" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">
                          Drop videos here or click to browse
                        </p>
                        <p className="text-sm text-white/40">
                          Supports MP4, MOV, AVI, WebM
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {videos.length > 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="uppercase text-sm">
                      Videos ({videos.length})
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVideos([])}
                      className="border-white/10 text-xs"
                    >
                      Clear All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {videos.map((vid) => (
                        <div
                          key={vid.id}
                          className="relative group aspect-video rounded-lg overflow-hidden bg-white/5"
                        >
                          <video
                            src={vid.preview}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-xs truncate font-medium">
                                {vid.file.name}
                              </p>
                              {vid.status === "done" && vid.croppedSize ? (
                                <p className="text-[10px] text-green-400">
                                  {formatFileSize(vid.originalSize)} → {formatFileSize(vid.croppedSize)}
                                </p>
                              ) : (
                                <p className="text-[10px] text-white/60">
                                  {formatFileSize(vid.originalSize)}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeVideo(vid.id)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {vid.status === "processing" && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                          {vid.status === "done" && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-green-500/80 text-[10px] py-0 h-5">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Done
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {isProcessingVideo && (
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 uppercase text-sm">
                      <Scissors className="w-4 h-4 text-yellow-400" />
                      Processing Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-hidden rounded-lg h-32 bg-black/40">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 60 + 20}px`,
                                animationDelay: `${i * 0.05}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-white/80" />
                          <p className="text-sm text-white/60">Cropping videos...</p>
                        </div>
                      </div>
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
                    Video Crop Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm text-white/60 mb-3 block">
                      Preset Ratios
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {VIDEO_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setVideoWidth(preset.width);
                            setVideoHeight(preset.height);
                          }}
                          className={`text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-left flex items-center gap-2 ${
                            videoWidth === preset.width && videoHeight === preset.height
                              ? "ring-2 ring-purple-500 bg-purple-500/20"
                              : ""
                          }`}
                        >
                          <span>{preset.icon}</span>
                          <div>
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-white/40">{preset.ratio}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="text-sm text-white/60 mb-3 block">
                      Custom Dimensions
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">Width</label>
                        <Input
                          type="number"
                          min="1"
                          max="7680"
                          value={videoWidth}
                          onChange={(e) => setVideoWidth(Math.max(1, parseInt(e.target.value) || 1080))}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">Height</label>
                        <Input
                          type="number"
                          min="1"
                          max="4320"
                          value={videoHeight}
                          onChange={(e) => setVideoHeight(Math.max(1, parseInt(e.target.value) || 1920))}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mt-2">
                      Current: {videoWidth} × {videoHeight} ({ (videoWidth / videoHeight).toFixed(2) }:1)
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="text-sm text-white/60 mb-3 block">
                      Export Format
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVideoFormat("webm")}
                        className={`flex-1 text-sm px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all ${
                          videoFormat === "webm"
                            ? "ring-2 ring-purple-500 bg-purple-500/20"
                            : ""
                        }`}
                      >
                        <div className="font-medium">WebM</div>
                        <div className="text-xs text-white/40">Default, fast</div>
                      </button>
                      <button
                        onClick={() => setVideoFormat("mp4")}
                        className={`flex-1 text-sm px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all ${
                          videoFormat === "mp4"
                            ? "ring-2 ring-purple-500 bg-purple-500/20"
                            : ""
                        }`}
                      >
                        <div className="font-medium">MP4</div>
                        <div className="text-xs text-white/40">Better compatibility</div>
                      </button>
                    </div>
                  </div>

                  {videos.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Videos</span>
                        <span>{videos.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Original Size</span>
                        <span>{formatFileSize(totalVideoOriginal)}</span>
                      </div>
                      {totalVideoCropped > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Cropped Size</span>
                            <span className="text-green-400">
                              {formatFileSize(totalVideoCropped)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleVideoCrop}
                    disabled={videos.length === 0 || isProcessingVideo}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    {isProcessingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4 mr-2" />
                        Crop {videos.length > 0 ? `(${videos.length})` : ""}
                      </>
                    )}
                  </Button>

                  {videos.some((v) => v.status === "done") && (
                    <Button
                      onClick={handleDownloadVideos}
                      variant="outline"
                      className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Videos
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-white/40 text-center">
                    All video processing happens in your browser.
                    <br />
                    Videos are cropped to center and exported as {videoFormat.toUpperCase()}.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <VersionBadge projectName="my-app" />
    </div>
  );
}
