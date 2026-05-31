import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      signal,
      timestamp,
      debug = false,
      // Trading parameters from Master Agent
      stopLossPips = 50,
      takeProfitPips = 100,
      positionSize = 0.01,
      riskAmount = null,
      riskPercent = 2.0,
      confidence = 0,
      agentData = {},
    } = body;

    // Validate signal
    if (!['BUY', 'SELL', 'NEUTRAL'].includes(signal)) {
      return NextResponse.json(
        { error: 'Invalid signal. Must be BUY, SELL, or NEUTRAL' },
        { status: 400 }
      );
    }

    // Validate trading parameters
    if (stopLossPips <= 0 || takeProfitPips <= 0) {
      return NextResponse.json(
        { error: 'Stop loss and take profit must be positive' },
        { status: 400 }
      );
    }

    // Signal file path (shared between web app and EA)
    // This should point to a location where the MT5 EA can read it
    const signalDir = process.env.SIGNAL_FILE_DIR || './signals';
    const signalFile = join(signalDir, 'master_signal.txt');

    // Create comprehensive signal content with all trading parameters
    const signalContent = JSON.stringify(
      {
        signal,
        timestamp,
        debug,
        generated_at: new Date().toISOString(),
        // Trading execution parameters
        trading: {
          stopLossPips: Math.max(stopLossPips, 50), // Enforce minimum for safety
          takeProfitPips,
          positionSize,
          riskAmount,
          riskPercent,
        },
        // Decision confidence
        confidence,
        // Agent signal breakdown for logging
        agentData,
      },
      null,
      2
    );

    // Write signal file (EA will read this)
    writeFileSync(signalFile, signalContent, 'utf-8');

    console.log(
      `[${debug ? 'DEBUG' : 'REAL'}] Signal: ${signal} | SL: ${Math.max(stopLossPips, 50)}pips | TP: ${takeProfitPips}pips | Size: ${positionSize} | Confidence: ${confidence}%`
    );

    return NextResponse.json(
      {
        success: true,
        signal,
        timestamp,
        debug,
        trading: {
          stopLossPips: Math.max(stopLossPips, 50),
          takeProfitPips,
          positionSize,
        },
        confidence,
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
