import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:shorts\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    let { url } = await request.json();
    console.log('[youtube-transcript] Received URL:', url);
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Convert Shorts URL to regular video URL
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      url = `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
      console.log('[youtube-transcript] Converted Shorts to:', url);
    }

    const videoId = extractVideoId(url);
    console.log('[youtube-transcript] Video ID:', videoId);
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    try {
      console.log('[youtube-transcript] Fetching transcript...');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      console.log('[youtube-transcript] Got', transcript.length, 'segments');
      const text = transcript.map(item => item.text).join(' ');

      return NextResponse.json({ 
        videoId, 
        transcript: text,
        length: transcript.length,
        source: 'transcript'
      });
    } catch (transcriptError) {
      console.log('[youtube-transcript] Transcript error:', transcriptError);
      
      // Fallback: fetch video info via oEmbed
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          return NextResponse.json({
            videoId,
            transcript: `Title: ${oembedData.title}\nChannel: ${oembedData.author_name}\nDescription: Video content from YouTube`,
            length: 1,
            source: 'oembed',
            title: oembedData.title,
            channel: oembedData.author_name
          });
        }
      } catch (oembedError) {
        console.log('oEmbed also failed:', oembedError);
      }

      return NextResponse.json({ 
        error: 'Video has no captions available and metadata fetch failed. Try entering the claim text directly.' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('YouTube error:', error);
    return NextResponse.json({ 
      error: 'Failed to process YouTube video. Try entering the claim text directly.' 
    }, { status: 500 });
  }
}