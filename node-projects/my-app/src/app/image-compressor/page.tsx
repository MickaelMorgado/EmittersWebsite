"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Download, Image as ImageIcon, Zap, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { VersionBadge } from "@/components/VersionBadge";
import JSZip from "jszip";

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
}

export default function ImageCompressorPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [targetMB, setTargetMB] = useState(1);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleFiles = useCallback((files: FileList | null) => {
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
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

  const compressImage = async (
    file: File,
    targetMB: number
  ): Promise<{ blob: Blob; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = new (window.Image || (globalThis as any).Image)();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

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

        const result = await compressImage(updatedImages[i].file, targetMB);

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

  const totalOriginalSize = images.reduce((acc, img) => acc + img.originalSize, 0);
  const totalCompressedSize = images.reduce(
    (acc, img) => acc + (img.compressedSize || 0),
    0
  );
  const savedPercentage = totalOriginalSize > 0
    ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
    : 0;

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
              Image Compressor
            </h1>
            <p className="text-muted-foreground">
              Compress multiple images to your desired file size
            </p>
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
                    onChange={(e) => handleFiles(e.target.files)}
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
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-progress"
                        style={{
                          width: `${
                            (images.filter((i) => i.status === "done").length /
                              images.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="uppercase text-sm">Settings</CardTitle>
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
                  <div className="flex justify-between text-[10px] text-white/40 mt-2">
                    <span>0.1 MB</span>
                    <span>10 MB</span>
                  </div>
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

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-white/40 text-center">
                  All compression happens in your browser.
                  <br />
                  Your images are never uploaded to any server.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <VersionBadge projectName="my-app" />
    </div>
  );
}
