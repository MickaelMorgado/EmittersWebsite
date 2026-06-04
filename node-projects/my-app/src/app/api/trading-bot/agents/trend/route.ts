import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface MAData {
  timestamp: string;
  symbol: string;
  price: number;
  ma_fast: number;
  ma_medium: number;
  ma_slow: number;
  ma_fast_period: number;
  ma_medium_period: number;
  ma_slow_period: number;
  crossover_detected: boolean;
  crossover_direction: string;
}

interface TrendSignal {
  timestamp: string;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  price: number;
  ma_9: number;
  ma_21: number;
  ma_50: number;
  ma_50_trend: 'Uptrend' | 'Downtrend' | 'Neutral';
  crossover_status: 'UP' | 'DOWN' | 'NONE';
  trend_bias: string;
  entry_allowed: boolean;
  trend_strength: 'Strong' | 'Moderate' | 'Weak';
  reasoning: string;
}

export async function POST(_request: Request) {
  try {
    const maDataPath = join(process.env.HOME || '/tmp', 'development/MikaBot/ma_data.json');

    if (!existsSync(maDataPath)) {
      return Response.json(
        { error: 'MA data not available. Ensure EA is running.' },
        { status: 503 }
      );
    }

    const maContent = readFileSync(maDataPath, 'utf-8');
    const maData: MAData = JSON.parse(maContent);

    const { price, ma_fast, ma_medium, ma_slow, crossover_detected, crossover_direction } = maData;

    // ── MA50 trend: price position vs slow MA ───────────────────────────────
    const ma_50_trend: 'Uptrend' | 'Downtrend' | 'Neutral' =
      price > ma_slow ? 'Uptrend' :
      price < ma_slow ? 'Downtrend' :
      'Neutral';

    // ── Crossover validity: direction must align with MA50 trend ────────────
    const isAligned =
      (crossover_direction === 'UP'   && ma_50_trend === 'Uptrend')  ||
      (crossover_direction === 'DOWN' && ma_50_trend === 'Downtrend');

    const isValidSignal = crossover_detected && isAligned;

    const crossover_status: 'UP' | 'DOWN' | 'NONE' =
      crossover_detected && crossover_direction === 'UP'   ? 'UP'   :
      crossover_detected && crossover_direction === 'DOWN' ? 'DOWN' :
      'NONE';

    const direction: 'BUY' | 'SELL' | 'NEUTRAL' =
      isValidSignal && crossover_direction === 'UP'   ? 'BUY'  :
      isValidSignal && crossover_direction === 'DOWN' ? 'SELL' :
      'NEUTRAL';

    // ── Confidence scoring (deterministic) ──────────────────────────────────
    let confidence = 30;

    if (isValidSignal)         confidence += 40; // crossover + aligned with MA50
    else if (crossover_detected) confidence += 20; // crossover but misaligned (noise)

    // Full MA stack bonus (all 3 MAs properly ordered)
    const bullStack = ma_fast > ma_medium && ma_medium > ma_slow;
    const bearStack = ma_fast < ma_medium && ma_medium < ma_slow;
    if (bullStack || bearStack) confidence += 30;

    // Extended move bonus: price >0.5% away from MA50
    if (ma_slow > 0 && Math.abs(price - ma_slow) / ma_slow > 0.005) confidence += 20;

    confidence = Math.min(100, Math.max(0, confidence));

    const trend_strength: 'Strong' | 'Moderate' | 'Weak' =
      confidence >= 80 ? 'Strong'   :
      confidence >= 50 ? 'Moderate' :
      'Weak';

    const reasoning = isValidSignal
      ? `${crossover_direction} crossover aligned with ${ma_50_trend} — entry valid`
      : crossover_detected
      ? `${crossover_direction} crossover but MA50 shows ${ma_50_trend} — filtered as noise`
      : 'No crossover on this candle — monitoring';

    const signal: TrendSignal = {
      timestamp:      new Date().toISOString(),
      symbol:         maData.symbol || 'BTCUSD',
      direction,
      confidence,
      price,
      ma_9:           ma_fast,
      ma_21:          ma_medium,
      ma_50:          ma_slow,
      ma_50_trend,
      crossover_status,
      trend_bias:     ma_50_trend,
      entry_allowed:  isValidSignal,
      trend_strength,
      reasoning,
    };

    const outPath = join(process.env.HOME || '/tmp', 'development/MikaBot/trend_signal.json');
    writeFileSync(outPath, JSON.stringify(signal, null, 2), 'utf-8');

    console.log(
      `[TREND AGENT] ${signal.direction} (${signal.confidence}%) | MA50: ${ma_50_trend} | Crossover: ${crossover_status} | Entry: ${signal.entry_allowed}`
    );

    return Response.json(signal);
  } catch (error) {
    console.error('[TREND AGENT] Error:', error);
    return Response.json({ error: `Server error: ${String(error)}` }, { status: 500 });
  }
}

export function OPTIONS() {
  return Response.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
