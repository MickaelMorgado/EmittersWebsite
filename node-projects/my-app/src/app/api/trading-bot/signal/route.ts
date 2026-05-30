import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signal, timestamp, debug = false } = body;

    // Validate signal
    if (!['BUY', 'SELL', 'NEUTRAL'].includes(signal)) {
      return NextResponse.json(
        { error: 'Invalid signal. Must be BUY, SELL, or NEUTRAL' },
        { status: 400 }
      );
    }

    // Signal file path (shared between web app and EA)
    // This should point to a location where the MT5 EA can read it
    const signalDir = process.env.SIGNAL_FILE_DIR || './signals';
    const signalFile = join(signalDir, 'master_signal.txt');

    // Create signal content
    const signalContent = JSON.stringify(
      {
        signal,
        timestamp,
        debug,
        generated_at: new Date().toISOString(),
      },
      null,
      2
    );

    // Write signal file (EA will read this)
    writeFileSync(signalFile, signalContent, 'utf-8');

    console.log(`[${debug ? 'DEBUG' : 'REAL'}] Signal written: ${signal} at ${timestamp}`);

    return NextResponse.json(
      {
        success: true,
        signal,
        timestamp,
        debug,
        file: signalFile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signal endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process signal' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Read current signal from file
    const signalDir = process.env.SIGNAL_FILE_DIR || './signals';
    const signalFile = join(signalDir, 'master_signal.txt');

    try {
      const { readFileSync } = await import('fs');
      const content = readFileSync(signalFile, 'utf-8');
      const signalData = JSON.parse(content);
      return NextResponse.json(signalData, { status: 200 });
    } catch {
      return NextResponse.json(
        { message: 'No signal file found yet' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Get signal error:', error);
    return NextResponse.json(
      { error: 'Failed to read signal' },
      { status: 500 }
    );
  }
}
