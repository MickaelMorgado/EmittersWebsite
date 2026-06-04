import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const basePath = process.env.HOME || '/tmp';
    const trendSignalPath = join(basePath, 'development/MikaBot/trend_signal.json');
    const maDataPath = join(basePath, 'development/MikaBot/ma_data.json');

    // Read ma_data.json (real-time from EA - updates every tick)
    // Handle UTF-16 LE encoding from MT5
    let maData: any = null;
    if (existsSync(maDataPath)) {
      try {
        const buffer = readFileSync(maDataPath);
        let maContent = '';

        // Try UTF-16 LE first (MT5 default), then UTF-8
        try {
          maContent = buffer.toString('utf-16le');
          // Remove BOM if present
          if (maContent.charCodeAt(0) === 0xFEFF) {
            maContent = maContent.slice(1);
          }
        } catch {
          maContent = buffer.toString('utf-8');
        }

        maData = JSON.parse(maContent);
      } catch (e) {
        console.warn('[TREND SIGNAL API] Failed to read ma_data.json:', e);
      }
    }

    // Read trend_signal.json (from Trend Agent - has analysis)
    let trendSignal: any = null;
    if (existsSync(trendSignalPath)) {
      try {
        const trendContent = readFileSync(trendSignalPath, 'utf-8');
        trendSignal = JSON.parse(trendContent);
      } catch (e) {
        console.warn('[TREND SIGNAL API] Failed to read trend_signal.json:', e);
      }
    }

    // Derive ma_50_trend in real-time from live MA data (price vs MA50).
    // Never use the cached trendSignal value — that's only as fresh as the last agent run.
    const price = maData?.price || 0;
    const ma_slow = maData?.ma_slow || 0;
    const ma_50_trend: 'Uptrend' | 'Downtrend' | 'Neutral' =
      price > 0 && ma_slow > 0
        ? price > ma_slow ? 'Uptrend'
        : price < ma_slow ? 'Downtrend'
        : 'Neutral'
        : 'Neutral';

    // Merge: Use real-time MA data from EA + Trend Agent analysis
    return NextResponse.json({
      // Real-time MA data from EA (updates every tick)
      ma_9: maData?.ma_fast || 0,
      ma_21: maData?.ma_medium || 0,
      ma_50: ma_slow,
      crossover_detected: maData?.crossover_detected || false,
      crossover_direction: maData?.crossover_direction || '',

      // ma_50_trend: derived live from EA price vs MA50 (not cached)
      ma_50_trend,

      // Trend Agent analysis (direction, confidence, entry_allowed — from last agent run)
      direction: trendSignal?.direction || 'NEUTRAL',
      confidence: trendSignal?.confidence || 0,
      crossover_status: trendSignal?.crossover_status || 'NONE',
      entry_allowed: trendSignal?.entry_allowed ?? false,
      trend_strength: trendSignal?.trend_strength || 'Moderate',

      // Metadata
      timestamp: trendSignal?.timestamp || new Date().toISOString(),
      // ma_timestamp: raw candle time from EA (changes every new candle close)
      ma_timestamp: maData?.timestamp || '',
      symbol: 'BTCUSD',
      price,
      reasoning: trendSignal?.reasoning || 'Analyzing...'
    });
  } catch (error) {
    console.error('[TREND SIGNAL API] Error:', error);
    return NextResponse.json({
      ma_9: 0,
      ma_21: 0,
      ma_50: 0,
      crossover_detected: false,
      crossover_direction: '',
      direction: 'NEUTRAL',
      confidence: 0,
      ma_50_trend: 'Neutral',
      crossover_status: 'NONE',
      entry_allowed: false,
      reason: 'Failed to read data'
    });
  }
}
