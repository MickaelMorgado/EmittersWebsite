"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VersionBadge } from "@/components/VersionBadge";
import JSZip from "jszip";
import { CheckCircle, Crop, Download, Image as ImageIcon, Loader2, Pause, Pencil, Play, Scissors, Upload, Video, Volume2, VolumeX, X, Zap } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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
  trimStart: number;
  trimEnd: number;
  thumbnails?: string[];
}

const VIDEO_QUALITY_PRESETS = {
  balanced: { label: "Balanced", desc: "Fast, smaller file", crf: "23", bitrate: "2500k", maxrate: "4000k", bufsize: "8000k", preset: "fast", audioBitrate: "128k", captureBitrate: 4_000_000 },
  high:     { label: "High",     desc: "Good quality",       crf: "20", bitrate: "5000k", maxrate: "8000k", bufsize: "16000k", preset: "fast",   audioBitrate: "160k", captureBitrate: 7_000_000 },
  max:      { label: "Max",      desc: "Best quality, slow", crf: "18", bitrate: "8000k", maxrate: "10000k", bufsize: "20000k", preset: "medium", audioBitrate: "192k", captureBitrate: 10_000_000 },
} as const;

type VideoQuality = keyof typeof VIDEO_QUALITY_PRESETS;

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
  const [enableTargetSize, setEnableTargetSize] = useState(true);
  const [enableCrop, setEnableCrop] = useState(false);
  const [cropWidth, setCropWidth] = useState(1920);
  const [cropHeight, setCropHeight] = useState(1080);
  const [videoWidth, setVideoWidth] = useState(1080);
  const [videoHeight, setVideoHeight] = useState(1920);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoFormat, setVideoFormat] = useState<"webm" | "mp4">("webm");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("high");
  const [videoDuration, setVideoDuration] = useState(30);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<"start" | "end" | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const ffmpegLoadedRef = useRef(false);

  useEffect(() => {
    if (draggingHandle) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        const editingVideo = videos.find(v => v.id === editingVideoId);
        const vidDuration = editingVideo?.duration || videoDuration;
        const seekTime = (percentage / 100) * vidDuration;
        
        if (previewVideoRef.current) {
          previewVideoRef.current.currentTime = seekTime;
        }
        
        setVideos(prev => prev.map(v => {
          if (v.id !== editingVideoId) return v;
          
          if (draggingHandle === "start") {
            const minEnd = v.trimEnd - 1;
            return { ...v, trimStart: Math.min(percentage, minEnd) };
          } else {
            const maxStart = v.trimStart + 1;
            return { ...v, trimEnd: Math.max(percentage, maxStart) };
          }
        }));
      };

      const handleMouseUp = () => {
        setDraggingHandle(null);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingHandle, editingVideoId, videos, videoDuration]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const loadFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpegLoadedRef.current && ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    ffmpegLoadedRef.current = true;
    return ffmpeg;
  };

  const transcodeToMP4 = async (webmBlob: Blob, quality: VideoQuality = "high"): Promise<Blob> => {
    const ffmpeg = await loadFFmpeg();
    const inputData = await fetchFile(webmBlob);
    await ffmpeg.writeFile("input.webm", inputData);

    const q = VIDEO_QUALITY_PRESETS[quality];
    const videoArgs = [
      "-c:v", "libx264",
      "-profile:v", "high",
      "-level", "4.2",
      "-preset", q.preset,
      "-crf", q.crf,
      "-b:v", q.bitrate,
      "-maxrate", q.maxrate,
      "-bufsize", q.bufsize,
      "-pix_fmt", "yuv420p",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-r", "30",
    ];
    const audioArgs = ["-c:a", "aac", "-b:a", q.audioBitrate, "-ar", "44100", "-ac", "2"];

    // Try with audio first; if it fails (no audio track in source), retry without
    let exitCode = await ffmpeg.exec([
      "-i", "input.webm",
      ...videoArgs,
      ...audioArgs,
      "-movflags", "+faststart",
      "output.mp4",
    ]);

    if (exitCode !== 0) {
      exitCode = await ffmpeg.exec([
        "-i", "input.webm",
        ...videoArgs,
        "-an",
        "-movflags", "+faststart",
        "output.mp4",
      ]);
    }

    if (exitCode !== 0) throw new Error(`ffmpeg exited with code ${exitCode}`);

    const data = await ffmpeg.readFile("output.mp4");
    await ffmpeg.deleteFile("input.webm");
    await ffmpeg.deleteFile("output.mp4");
    return new Blob([data as Uint8Array<ArrayBuffer>], { type: "video/mp4" });
  };

  const generateThumbnails = (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      const thumbs: string[] = [];
      const numThumbs = 20;

      const cleanup = () => {
        if (video.src) URL.revokeObjectURL(video.src);
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(thumbs);
      }, 15000);

      video.onloadedmetadata = async () => {
        try {
          const duration = video.duration;
          if (!duration || duration === 0 || !isFinite(duration)) {
            clearTimeout(timeoutId);
            cleanup();
            resolve(thumbs);
            return;
          }

          const interval = duration / numThumbs;

          for (let i = 0; i < numThumbs; i++) {
            const time = i * interval;
            await new Promise<void>((res) => {
              const seekTimeout = setTimeout(() => res(), 500);
              video.currentTime = time;
              video.onseeked = () => {
                clearTimeout(seekTimeout);
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = 160;
                  canvas.height = 90;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    thumbs.push(canvas.toDataURL("image/jpeg", 0.6));
                  }
                } catch (e) {
                  console.warn("Thumbnail capture failed:", e);
                }
                res();
              };
            });
          }

          clearTimeout(timeoutId);
          cleanup();
          resolve(thumbs);
        } catch (err) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(thumbs);
        }
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        cleanup();
        resolve(thumbs);
      };

      video.src = URL.createObjectURL(file);
    });
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
      duration: 30,
      trimStart: 0,
      trimEnd: 100,
    }));

    setVideos((prev) => [...prev, ...newVideos]);

    videoFiles.forEach((file, index) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const timeoutId = setTimeout(() => {
        setVideos((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex(v => v.file.name === file.name && v.status === "pending");
          if (idx !== -1) {
            updated[idx].duration = 30;
          }
          return updated;
        });
      }, 10000);

      video.onloadedmetadata = async () => {
        clearTimeout(timeoutId);
        const duration = video.duration || 30;
        
        const thumbs = await generateThumbnails(file);

        setVideos((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex(v => v.file.name === file.name && v.status === "pending");
          if (idx !== -1) {
            updated[idx].duration = duration;
            updated[idx].thumbnails = thumbs;
          }
          return updated;
        });
        
        if (video.src) URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        clearTimeout(timeoutId);
        setVideos((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex(v => v.file.name === file.name && v.status === "pending");
          if (idx !== -1) {
            updated[idx].duration = 30;
          }
          return updated;
        });
      };
      
      video.src = URL.createObjectURL(file);
    });
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

  const handleTimelineMouseDown = (e: React.MouseEvent, handle: "start" | "end") => {
    e.preventDefault();
    setDraggingHandle(handle);
  };

  const compressImage = async (
    file: File,
    targetMB: number = 0,
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
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (cropEnabled && targetWidth > 0 && targetHeight > 0) {
          const sourceAspect = img.width / img.height;
          const targetAspect = targetWidth / targetHeight;

          if (sourceAspect > targetAspect) {
            sw = img.height * targetAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / targetAspect;
            sy = (img.height - sh) / 2;
          }

          width = Math.round(sw);
          height = Math.round(sh);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

        const targetBytes = targetMB * 1024 * 1024;
        const hasTargetSize = targetMB > 0;
        let quality = 0.85;
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

          if (hasTargetSize) {
            while (result.size > targetBytes && iterations < maxIterations) {
              if (result.size > targetBytes * 1.5) {
                width = Math.floor(width * 0.8);
                height = Math.floor(height * 0.8);
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
              }

              quality -= 0.05;
              iterations++;
              result = await compress();
            }
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
    outputFormat: "webm" | "mp4" = "webm",
    quality: VideoQuality = "high",
    trimStartTime: number = 0,
    trimEndTime: number = 0
  ): Promise<{ blob: Blob; size: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = false;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      video.onloadedmetadata = () => {
        video.currentTime = trimStartTime;
      };

      video.onloadeddata = async () => {
        try {
          const duration = video.duration;
          const effectiveEnd = trimEndTime > 0 && trimEndTime > trimStartTime
            ? Math.min(trimEndTime, duration)
            : duration;

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

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

          const videoStream = canvas.captureStream(30);

          let audioContext: AudioContext | null = null;
          let audioDestination: MediaStreamAudioDestinationNode | null = null;
          let combinedStream: MediaStream;

          try {
            audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(video);
            audioDestination = audioContext.createMediaStreamDestination();
            source.connect(audioDestination);
            source.connect(audioContext.destination);

            combinedStream = new MediaStream([
              ...videoStream.getVideoTracks(),
              ...audioDestination.stream.getAudioTracks(),
            ]);
          } catch {
            combinedStream = videoStream;
          }

          let mimeType = outputFormat === "mp4" ? "video/mp4" : "video/webm;codecs=vp9";
          if (outputFormat === "webm") {
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = "video/webm;codecs=vp9";
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "video/webm;codecs=vp8";
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                  mimeType = "video/webm";
                }
              }
            }
          } else {
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = "video/mp4;codecs=avc1.42E01E,mp4a.40.2";
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "video/mp4;codecs=avc1.42001E,mp4a.40.2";
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                  console.warn("MP4 not supported, falling back to WebM");
                  mimeType = "video/webm;codecs=vp9";
                  combinedStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                  ]);
                }
              }
            }
          }

          const qualityPreset = VIDEO_QUALITY_PRESETS[quality];
          const recorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: qualityPreset.captureBitrate,
            audioBitsPerSecond: parseInt(qualityPreset.audioBitrate) * 1000,
          });
          const chunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.onstop = async () => {
            const actualMimeType = mimeType.split(";")[0];
            let blob = new Blob(chunks, { type: actualMimeType });
            URL.revokeObjectURL(video.src);
            if (audioContext && audioContext.state !== "closed") {
              audioContext.close();
            }
            if (outputFormat === "mp4") {
              try {
                blob = await transcodeToMP4(blob, quality);
              } catch (err) {
                console.error("ffmpeg transcode failed, falling back to source:", err);
              }
            }
            resolve({ blob, size: blob.size });
          };

          recorder.onerror = (e) => {
            reject(new Error("Recording failed: " + String(e)));
          };

          recorder.start(100);
          video.currentTime = trimStartTime;
          video.play();

          const drawFrame = () => {
            if (video.currentTime >= effectiveEnd) {
              setTimeout(() => {
                if (recorder.state === "recording") {
                  recorder.stop();
                  video.pause();
                }
              }, 500);
              return;
            }
            if (!video.paused) {
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
              requestAnimationFrame(drawFrame);
            }
          };

          drawFrame();

          const maxDuration = Math.min(effectiveEnd - trimStartTime || 30, 30);
          setTimeout(() => {
            if (recorder.state === "recording") {
              recorder.stop();
              video.pause();
            }
          }, (maxDuration * 1000) + 1000);

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

        const result = await compressImage(updatedImages[i].file, enableTargetSize ? targetMB : 0, enableCrop, cropWidth, cropHeight);

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

  const handleVideoCrop = async (cropEnabled: boolean = true) => {
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

const vidDuration = updatedVideos[i].duration || videoDuration;
        const trimStartTime = (updatedVideos[i].trimStart / 100) * vidDuration;
        const trimEndTime = (updatedVideos[i].trimEnd / 100) * vidDuration;
        const targetW = cropEnabled ? videoWidth : 1920;
        const targetH = cropEnabled ? videoHeight : 1080;
        const result = await cropVideo(updatedVideos[i], targetW, targetH, videoFormat, videoQuality, trimStartTime, trimEndTime);

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
        const ext = vid.croppedBlob.type.startsWith("video/mp4") ? "mp4" : "webm";
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity">
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
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center transition-opacity hover:bg-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {img.status === "compressing" && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                          {img.status === "done" && (
                            <div className="absolute top-2 center">
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
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableTargetSize}
                        onChange={(e) => setEnableTargetSize(e.target.checked)}
                        className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                      />
                      <Zap className="w-4 h-4" />
                      Target Size (MB per image)
                    </label>
                    {enableTargetSize && (
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
                    )}
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity">
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
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center transition-opacity hover:bg-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingVideoId(editingVideoId === vid.id ? null : vid.id);
                              setVideoDuration(vid.duration || 30);
                            }}
                            className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-opacity ${
                              editingVideoId === vid.id 
                                ? "bg-purple-500 opacity-100" 
                                : "bg-black/60 hover:bg-purple-500"
                            }`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {vid.status === "processing" && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                          {vid.status === "done" && (
                            <div className="absolute bottom-2 left-2">
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

              {editingVideoId && (
                (() => {
                  const editingVideo = videos.find(v => v.id === editingVideoId);
                  if (!editingVideo) return null;
                  
                  const localTrimStart = editingVideo.trimStart;
                  const localTrimEnd = editingVideo.trimEnd;
                  
                  return (
                    <Card className="bg-white/5 border-purple-500/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="uppercase text-sm flex items-center gap-2">
                          <Pencil className="w-4 h-4 text-purple-400" />
                          Trim: {editingVideo.file.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                            className="text-xs text-white/60 hover:text-white"
                          >
                            {isPreviewMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <button
                          onClick={() => {
                            if (previewVideoRef.current) {
                              previewVideoRef.current.pause();
                              setIsPreviewPlaying(false);
                            }
                            setEditingVideoId(null);
                          }}
                          className="text-xs text-white/60 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
<div className="flex gap-4 items-stretch" style={{ height: '360px' }}>
                          <div className="flex-1 relative bg-black rounded-lg overflow-hidden border border-white/10">
                            <video
                              ref={previewVideoRef}
                              src={editingVideo.preview}
                              className="absolute inset-0 w-full h-full object-contain"
                              muted={isPreviewMuted}
                              onTimeUpdate={(e) => {
                                const video = e.currentTarget;
                                const vidDuration = editingVideo.duration || 30;
                                const trimStartSec = (localTrimStart / 100) * vidDuration;
                                const trimEndSec = (localTrimEnd / 100) * vidDuration;
                                if (video.currentTime >= trimEndSec) {
                                  video.currentTime = trimStartSec;
                                }
                                
                                const canvas = document.createElement("canvas");
                                canvas.width = videoWidth;
                                canvas.height = videoHeight;
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  const videoAspect = video.videoWidth / video.videoHeight;
                                  const targetAspect = videoWidth / videoHeight;
                                  let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
                                  if (videoAspect > targetAspect) {
                                    sw = video.videoHeight * targetAspect;
                                    sx = (video.videoWidth - sw) / 2;
                                  } else {
                                    sh = video.videoWidth / targetAspect;
                                    sy = (video.videoHeight - sh) / 2;
                                  }
                                  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, videoWidth, videoHeight);
                                  const croppedPreview = document.getElementById("cropped-preview-img") as HTMLImageElement;
                                  if (croppedPreview) {
                                    croppedPreview.src = canvas.toDataURL("image/jpeg", 0.7);
                                  }
                                }
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  if (previewVideoRef.current) {
                                    if (isPreviewPlaying) {
                                      previewVideoRef.current.pause();
                                    } else {
                                      const vidDuration = editingVideo.duration || 30;
                                      const trimStartSec = (localTrimStart / 100) * vidDuration;
                                      previewVideoRef.current.currentTime = trimStartSec;
                                      previewVideoRef.current.play();
                                    }
                                    setIsPreviewPlaying(!isPreviewPlaying);
                                  }
                                }}
                                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                              >
                                {isPreviewPlaying ? (
                                  <Pause className="w-6 h-6 text-white" />
                                ) : (
                                  <Play className="w-6 h-6 text-white ml-1" />
                                )}
                              </button>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                              <div className="text-xs text-white/80 bg-black/60 px-2 py-1 rounded">
                                Original
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (previewVideoRef.current) previewVideoRef.current.pause();
                                setIsPreviewPlaying(false);
                                const updated = videos.map(v => 
                                  v.id === editingVideoId ? { ...v, status: "pending" as const } : v
                                );
                                setVideos(updated);
                                setTimeout(() => handleVideoCrop(false), 100);
                                setEditingVideoId(null);
                              }}
                              className="absolute top-2 right-2 text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 py-1 rounded text-white"
                            >
                              Trim Only
                            </button>
                          </div>
                          
                          <div className="w-48 flex-shrink-0">
                            <div className="relative bg-black rounded-lg overflow-hidden border border-purple-500/50" style={{ height: '100%' }}>
                              <img 
                                id="cropped-preview-img" 
                                className="absolute inset-0 w-full h-full object-contain" 
                                alt="Cropped preview"
                              />
                              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                <div className="text-xs text-purple-400 bg-black/60 px-2 py-1 rounded">
                                  Cropped
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (previewVideoRef.current) previewVideoRef.current.pause();
                                  setIsPreviewPlaying(false);
                                  const updated = videos.map(v => 
                                    v.id === editingVideoId ? { ...v, status: "pending" as const } : v
                                  );
                                  setVideos(updated);
                                  setTimeout(() => handleVideoCrop(true), 100);
                                  setEditingVideoId(null);
                                }}
                                className="absolute top-2 right-2 text-xs bg-purple-500/80 hover:bg-purple-500 px-2 py-1 rounded text-white"
                              >
                                Trim & Crop
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="relative mt-4">
                          <div 
                            ref={timelineRef}
                            className="relative h-24 rounded-lg overflow-hidden bg-black/40 border border-white/10 select-none"
                          >
                            {editingVideo.thumbnails && editingVideo.thumbnails.length > 0 ? (
                              <>
                                <div className="flex h-full">
                                  {editingVideo.thumbnails.map((thumb, i) => (
                                    <div 
                                      key={i} 
                                      className="flex-shrink-0"
                                      style={{ width: `${100 / editingVideo.thumbnails!.length}%` }}
                                    >
                                      <img 
                                        src={thumb} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div 
                                  className="absolute top-0 bottom-0 bg-purple-500/30 border-l-2 border-r-2 border-purple-400"
                                  style={{
                                    left: `${Math.min(localTrimStart, localTrimEnd)}%`,
                                    width: `${Math.abs(localTrimEnd - localTrimStart)}%`
                                  }}
                                />
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                              </div>
                            )}
                            
                            <div 
                              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize hover:bg-purple-500/20 transition-colors"
                              style={{ left: `${localTrimStart}%` }}
                              onMouseDown={(e) => handleTimelineMouseDown(e, "start")}
                            >
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-purple-400 rounded-full border-2 border-white shadow-lg" />
                            </div>
                            <div 
                              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize hover:bg-pink-500/20 transition-colors"
                              style={{ left: `${localTrimEnd}%` }}
                              onMouseDown={(e) => handleTimelineMouseDown(e, "end")}
                            >
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-pink-400 rounded-full border-2 border-white shadow-lg" />
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-white/40 mt-1 px-1">
                            <span>0:00</span>
                            <span>{formatTime(videoDuration)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400">Start:</span>
                            <span className="text-white/80">{formatTime((localTrimStart / 100) * videoDuration)}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-green-500/20 px-2 py-1 rounded">
                            <span className="text-green-400">Duration:</span>
                            <span className="text-green-300">{formatTime(((localTrimEnd - localTrimStart) / 100) * videoDuration)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-pink-400">End:</span>
                            <span className="text-white/80">{formatTime((localTrimEnd / 100) * videoDuration)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setVideos(prev => prev.map(v => 
                                v.id === editingVideoId 
                                  ? { ...v, trimStart: 0, trimEnd: 100 }
                                  : v
                              ));
                            }}
                            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => {
                              setVideos(prev => prev.map(v => 
                                v.id === editingVideoId 
                                  ? { ...v, trimStart: 0, trimEnd: 50 }
                                  : v
                              ));
                            }}
                            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            First Half
                          </button>
                          <button
                            onClick={() => {
                              setVideos(prev => prev.map(v => 
                                v.id === editingVideoId 
                                  ? { ...v, trimStart: 50, trimEnd: 100 }
                                  : v
                              ));
                            }}
                            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            Last Half
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()
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
                          <p className="text-sm text-white/60">Trimming & cropping videos...</p>
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

                  <div className="pt-4 border-t border-white/10">
                    <label className="text-sm text-white/60 mb-3 block">
                      Quality
                    </label>
                    <div className="flex gap-2">
                      {(Object.entries(VIDEO_QUALITY_PRESETS) as [VideoQuality, typeof VIDEO_QUALITY_PRESETS[VideoQuality]][]).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => setVideoQuality(key)}
                          className={`flex-1 text-sm px-3 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all ${
                            videoQuality === key
                              ? "ring-2 ring-purple-500 bg-purple-500/20"
                              : ""
                          }`}
                        >
                          <div className="font-medium">{preset.label}</div>
                          <div className="text-xs text-white/40">{preset.desc}</div>
                        </button>
                      ))}
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
                    onClick={() => handleVideoCrop(true)}
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
                        Trim & Crop {videos.length > 0 ? `(${videos.length})` : ""}
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
                    Videos are cropped to center and exported as {videoFormat.toUpperCase()} ({videoQuality} quality).
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
