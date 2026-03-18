import { NextRequest, NextResponse } from 'next/server';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const videoIds = searchParams.get('video_ids')?.split(',') || [];

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Missing access_token parameter' },
      { status: 400 }
    );
  }

  if (videoIds.length === 0) {
    return NextResponse.json(
      { error: 'Missing video_ids parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${TIKTOK_API_BASE}/video/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        filters: {
          video_ids: videoIds,
        },
        fields: [
          'id',
          'title',
          'video_description',
          'cover_image_url',
          'share_url',
          'create_time',
          'like_count',
          'comment_count',
          'share_count',
          'view_count',
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: response.status }
      );
    }

    const videos = (data.data?.videos || []).map((video: Record<string, unknown>) => ({
      id: video.id,
      postDate: video.create_time ? new Date(Number(video.create_time) * 1000).toISOString() : '',
      caption: video.title || video.video_description || '',
      url: video.share_url || '',
      metricsDate: new Date().toISOString(),
      views: video.view_count || 0,
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch TikTok data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, open_id, max_count = 100 } = body;

    if (!access_token || !open_id) {
      return NextResponse.json(
        { error: 'Missing access_token or open_id in request body' },
        { status: 400 }
      );
    }

    const allVideos: Record<string, unknown>[] = [];
    let cursor = '';
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${TIKTOK_API_BASE}/video/list/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token,
          open_id,
          max_count,
          cursor,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return NextResponse.json(
          { error: data.error },
          { status: response.status }
        );
      }

      const videos = data.data?.videos || [];
      allVideos.push(...videos);
      
      cursor = data.data?.cursor || '';
      hasMore = data.data?.has_more || false;
    }

    const formattedVideos = allVideos.map((video) => ({
      id: video.id,
      postDate: video.create_time ? new Date(Number(video.create_time) * 1000).toISOString() : '',
      caption: video.title || video.video_description || '',
      url: video.share_url || '',
      coverUrl: video.cover_image_url || '',
      metricsDate: new Date().toISOString(),
      views: video.view_count || 0,
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
    }));

    return NextResponse.json({ videos: formattedVideos, total: formattedVideos.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch TikTok data' },
      { status: 500 }
    );
  }
}
