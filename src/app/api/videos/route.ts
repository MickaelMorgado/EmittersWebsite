import { NextResponse } from 'next/server';

export async function GET() {
  // Example: return a list of videos
  return NextResponse.json({ message: 'Get videos endpoint' });
}

export async function POST(request: Request) {
  // Example: create a new video entry
  const data = await request.json();
  return NextResponse.json({ message: 'Video created', data });
}