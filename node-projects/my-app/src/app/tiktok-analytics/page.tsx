"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VersionBadge } from "@/components/VersionBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTikTokAnalyticsStore, type TikTokVideo } from "@/stores/useTikTokAnalyticsStore";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, Upload, ExternalLink, Eye, Heart, MessageCircle, Share2, Play, Link2, Loader2, BarChart3, RefreshCw } from "lucide-react";

function parseCSV(content: string): TikTokVideo[] {
  const lines = content.trim().split("\n");
  return lines.map((line, index) => {
    const parts = line.split("\t");
    if (parts.length < 8) return null;
    const [postDate, caption, url, metricsDate, views, likes, comments, shares] = parts;
    return {
      id: `video-${index}`,
      postDate: postDate?.trim() || "",
      caption: caption?.trim() || "",
      url: url?.trim() || "",
      metricsDate: metricsDate?.trim() || "",
      views: parseInt(views) || 0,
      likes: parseInt(likes) || 0,
      comments: parseInt(comments) || 0,
      shares: parseInt(shares) || 0,
    };
  }).filter((v): v is TikTokVideo => v !== null);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatChartDate(dateStr: string): string {
  const match = dateStr.match(/(\w+)\s+(\d+)/);
  if (match) {
    const months: Record<string, string> = {
      January: "Jan", February: "Feb", March: "Mar", April: "Apr",
      May: "May", June: "Jun", July: "Jul", August: "Aug",
      September: "Sep", October: "Oct", November: "Nov", December: "Dec",
    };
    return `${months[match[1]] || match[1]} ${match[2]}`;
  }
  return dateStr;
}

export default function TikTokAnalyticsPage() {
  const { videos, setVideos, sortField, toggleSort } = useTikTokAnalyticsStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiMode, setApiMode] = useState<"csv" | "api">("csv");

  useEffect(() => {
    // TODO: Fix localStorage - app not finalized
    // const savedToken = localStorage.getItem("tiktok_access_token");
    // const savedOpenId = localStorage.getItem("tiktok_open_id");
    // if (savedToken && savedOpenId) {
    //   setApiMode("api");
    // }
  }, []);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      if (parsed.length === 0) {
        setError("No valid data found. Please check the CSV format.");
        return;
      }
      setVideos(parsed);
    };
    reader.readAsText(file);
  }, [setVideos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".tsv") || file.name.endsWith(".txt") || file.name.endsWith(".csv"))) {
      handleFile(file);
    } else {
      setError("Please upload a .tsv, .txt, or .csv file.");
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const loadFromApi = async () => {
    // TODO: Fix localStorage - app not finalized
    setError("API mode disabled - app not finalized");
    return;
    /*
    const accessToken = localStorage.getItem("tiktok_access_token");
    const openId = localStorage.getItem("tiktok_open_id");

    if (!accessToken || !openId) {
      setError("Please connect your TikTok account first");
      return;
    }

    setIsLoadingApi(true);
    setError(null);

    try {
      const res = await fetch("/api/tiktok-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          open_id: openId,
        }),
      });
      const data = await res.json();

      if (data.error) {
        if (data.error.code === "oauth_token_invalid") {
          localStorage.removeItem("tiktok_access_token");
          localStorage.removeItem("tiktok_open_id");
          localStorage.removeItem("tiktok_refresh_token");
          setError("Token expired. Please reconnect.");
        } else {
          setError(data.error.message || "Failed to load videos");
        }
        return;
      }

      const apiVideos: TikTokVideo[] = data.videos.map((v: TikTokVideo) => ({
        id: v.id,
        postDate: v.postDate,
        caption: v.caption,
        url: v.url,
        metricsDate: new Date().toISOString(),
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
      }));

      setVideos(apiVideos);
    } catch (err) {
      setError("Failed to load videos from TikTok");
    } finally {
      setIsLoadingApi(false);
    }
    */
  };

  const startAuth = async () => {
    // TODO: Fix localStorage - app not finalized
    setError("API mode disabled - app not finalized");
    return;
    /*
    const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    
    localStorage.setItem('tiktok_code_verifier', codeVerifier);
    
    const redirectUri = window.location.origin + "/tiktok-analytics";
    window.location.href = `/api/tiktok-auth?redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}`;
    */
  };

  const handleCodeSubmit = async (_code: string) => {
    // TODO: Fix localStorage - app not finalized
    return;
    /*
    if (!_code) return;
    setIsLoadingApi(true);
    setError("");

    const codeVerifier = localStorage.getItem('tiktok_code_verifier');

    try {
      const res = await fetch("/api/tiktok-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          authorization_code: code,
          code_verifier: codeVerifier,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error.message || "Failed to get access token");
        return;
      }

      localStorage.setItem("tiktok_access_token", data.access_token);
      localStorage.setItem("tiktok_open_id", data.open_id);
      localStorage.setItem("tiktok_refresh_token", data.refresh_token);
      localStorage.removeItem('tiktok_code_verifier');
      setApiMode("api");
      loadFromApi();
    } catch (err) {
      setError("Failed to exchange code for token");
    } finally {
      setIsLoadingApi(false);
    }
    */
  };

  useEffect(() => {
    // TODO: Fix localStorage - app not finalized
    // const params = new URLSearchParams(window.location.search);
    // const code = params.get("code");
    // if (code) {
    //   handleCodeSubmit(code);
    //   window.history.replaceState({}, "", "/tiktok-analytics");
    // }
  }, []);

  const disconnectApi = () => {
    // TODO: Fix localStorage - app not finalized
    // localStorage.removeItem("tiktok_access_token");
    // localStorage.removeItem("tiktok_open_id");
    // localStorage.removeItem("tiktok_refresh_token");
    // localStorage.removeItem("tiktok_code_verifier");
    setApiMode("csv");
    setVideos([]);
  };

  const stats = useMemo(() => {
    return {
      totalVideos: videos.length,
      totalViews: videos.reduce((sum, v) => sum + v.views, 0),
      totalLikes: videos.reduce((sum, v) => sum + v.likes, 0),
      totalComments: videos.reduce((sum, v) => sum + v.comments, 0),
      totalShares: videos.reduce((sum, v) => sum + v.shares, 0),
    };
  }, [videos]);

  const chartData = useMemo(() => {
    const sorted = [...videos].sort((a, b) => {
      if (!a.metricsDate || !b.metricsDate) return 0;
      return a.metricsDate.localeCompare(b.metricsDate);
    });
    return sorted.map((v) => ({
      date: formatChartDate(v.metricsDate),
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
    }));
  }, [videos]);

  const sortedVideos = useMemo(() => {
    if (!sortField) return videos;
    return [...videos].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortField && useTikTokAnalyticsStore.getState().sortDirection === "desc"
          ? bVal - aVal
          : aVal - bVal;
      }
      return String(aVal).localeCompare(String(bVal));
    });
  }, [videos, sortField]);

  const SortIcon = ({ field }: { field: keyof TikTokVideo }) => {
    if (sortField !== field) return null;
    return sortField === field ? (
      useTikTokAnalyticsStore.getState().sortDirection === "desc" ? (
        <ArrowDown className="w-4 h-4 ml-1" />
      ) : (
        <ArrowUp className="w-4 h-4 ml-1" />
      )
    ) : null;
  };

  // TODO: Fix localStorage - app not finalized
  // const isApiConnected = localStorage.getItem("tiktok_access_token") && localStorage.getItem("tiktok_open_id");
  const isApiConnected = false;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            TikTok Analytics
          </h1>
          <VersionBadge projectName="tiktok-analytics" />
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={apiMode === "csv" ? "default" : "outline"}
            onClick={() => setApiMode("csv")}
          >
            <Upload className="w-4 h-4 mr-2" />
            CSV Import
          </Button>
          <Button
            variant={apiMode === "api" ? "default" : "outline"}
            onClick={() => setApiMode("api")}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Connect TikTok
          </Button>
        </div>

        {apiMode === "api" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Connect Your TikTok Account
                </span>
                {isApiConnected && (
                  <Button variant="outline" size="sm" onClick={disconnectApi}>
                    Disconnect
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isApiConnected ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    Connected to TikTok
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={loadFromApi} disabled={isLoadingApi}>
                      {isLoadingApi ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Load My Videos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your TikTok account to automatically load your videos and analytics.
                  </p>
                  <Button onClick={startAuth}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect TikTok Account
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Paste Access Token Directly</p>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="accessToken"
                        placeholder="Paste access_token here"
                        className="flex-1"
                      />
                      <Button onClick={() => {
                        // TODO: Fix localStorage - app not finalized
                        setError("API mode disabled - app not finalized");
                        /*
                        const token = (document.getElementById("accessToken") as HTMLInputElement).value;
                        if (token) {
                          localStorage.setItem("tiktok_access_token", token);
                          localStorage.setItem("tiktok_open_id", "manual");
                          setApiMode("api");
                          loadFromApi();
                        }
                        */
                      }}>
                        Use Token
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      If you have an access_token, paste it directly here.
                    </p>
                  </div>
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/10" : "border-muted"
                }`}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="mb-2">Drag and drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mb-4">Tab-separated values: Date, Caption, URL, Metrics Date, Views, Likes, Comments, Shares</p>
                <div className="flex justify-center">
                  <Input
                    type="file"
                    accept=".tsv,.txt,.csv"
                    onChange={handleFileInput}
                    className="max-w-xs"
                  />
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {videos.length > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Play className="w-4 h-4 mr-2" /> Total Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Eye className="w-4 h-4 mr-2" /> Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Heart className="w-4 h-4 mr-2" /> Total Likes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalLikes)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" /> Total Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalComments)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Share2 className="w-4 h-4 mr-2" /> Total Shares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalShares)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" tick={{ fill: "#9CA3AF" }} />
                    <YAxis tick={{ fill: "#9CA3AF" }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value: number) => formatNumber(value)}
                    />
                    <Area type="monotone" dataKey="views" stroke="#22c55e" fill="url(#viewsGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="likes" stroke="#ec4899" fill="url(#likesGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Video Data</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Post Date</th>
                      <th className="text-left p-2">Caption</th>
                      <th className="text-left p-2">URL</th>
                      <th
                        className="text-left p-2 cursor-pointer hover:text-primary"
                        onClick={() => toggleSort("views")}
                      >
                        Views <SortIcon field="views" />
                      </th>
                      <th
                        className="text-left p-2 cursor-pointer hover:text-primary"
                        onClick={() => toggleSort("likes")}
                      >
                        Likes <SortIcon field="likes" />
                      </th>
                      <th
                        className="text-left p-2 cursor-pointer hover:text-primary"
                        onClick={() => toggleSort("comments")}
                      >
                        Comments <SortIcon field="comments" />
                      </th>
                      <th
                        className="text-left p-2 cursor-pointer hover:text-primary"
                        onClick={() => toggleSort("shares")}
                      >
                        Shares <SortIcon field="shares" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVideos.map((video) => (
                      <tr
                        key={video.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => video.url && window.open(video.url, "_blank")}
                      >
                        <td className="p-2">{video.postDate}</td>
                        <td className="p-2 max-w-[200px] truncate">{video.caption}</td>
                        <td className="p-2">
                          <ExternalLink className="w-4 h-4" />
                        </td>
                        <td className="p-2">{formatNumber(video.views)}</td>
                        <td className="p-2">{formatNumber(video.likes)}</td>
                        <td className="p-2">{formatNumber(video.comments)}</td>
                        <td className="p-2">{formatNumber(video.shares)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Clear Data Button */}
            <div className="flex justify-center">
              <Button variant="destructive" onClick={() => setVideos([])}>
                Clear All Data
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
