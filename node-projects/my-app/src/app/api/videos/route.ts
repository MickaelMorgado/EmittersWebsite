import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const dirPath = path.join(process.cwd(), 'public');
  
  try {
    const files = await fs.promises.readdir(dirPath);
    const videos = files.filter(file => file.endsWith('.mp4'));
    return NextResponse.json(videos);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
}