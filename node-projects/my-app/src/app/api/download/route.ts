import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const file = searchParams.get('file');

    if (!token || !file) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // In production, verify the token against Stripe session
    // For now, we'll use a simple placeholder validation
    if (token !== 'placeholder') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Download from Supabase Storage
    const { data, error } = await supabase.storage
      .from('digital-products')
      .download(file);

    if (error) {
      console.error('Download error:', error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Return the file
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${file}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}