import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
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

    // "Seconds since the live reading last changed" — i.e. age of the
    // CURRENTLY FORMING candle [0] (current_candle_open), not the completed
    // candle [1] (timestamp) that crossover logic uses. [1] only swaps in
    // once a new candle opens, so its age oscillates ~0-120s; [0]'s age
    // resets to ~0 the instant a new candle opens and counts up to ~60s —
    // matching "ma_data.json's reading just changed → 30s ago" intuitively.
    //
    // We diff two BROKER-side clocks (current_candle_open vs server_time)
    // rather than comparing broker time to the viewer's local clock — both
    // numbers come from the same EA tick in the same timezone, so any
    // broker/local offset cancels out, giving a perfectly accurate duration
    // no matter where the dashboard is viewed from.
    const parseMtTime = (mt: string): number => {
      if (!mt) return NaN;
      const [datePart, timePart] = mt.split(' ');
      if (!datePart) return NaN;
      return new Date(`${datePart.replace(/\./g, '-')}T${timePart || '00:00:00'}`).getTime();
    };
    const currentCandleOpenMs = parseMtTime(maData?.current_candle_open || '');
    const brokerNowMs = parseMtTime(maData?.server_time || '');
    const candle_age_seconds =
      Number.isFinite(currentCandleOpenMs) && Number.isFinite(brokerNowMs)
        ? Math.max(0, Math.round((brokerNowMs - currentCandleOpenMs) / 1000))
        : null;

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
      // candle_age_seconds: how long ago THIS candle opened, computed
      // entirely from broker-side clocks (timezone-safe — see comment above)
      candle_age_seconds,
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
