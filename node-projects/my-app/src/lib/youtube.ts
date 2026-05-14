const YOUTUBE_REGEX = /(?:youtube\.com\/(?:shorts\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  isShorts: boolean;
}

export function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

export function isYouTubeUrl(text: string): boolean {
  return YOUTUBE_REGEX.test(text);
}

export function normalizeYouTubeUrl(url: string): YouTubeVideoInfo | null {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  const isShorts = /youtube\.com\/shorts\//.test(url);
  
  return {
    videoId,
    url: isShorts 
      ? `https://www.youtube.com/watch?v=${videoId}`
      : url,
    isShorts
  };
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'max' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}