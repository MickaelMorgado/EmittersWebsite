import { chatAI, parseJSON } from '@/lib/ai';
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
  crossover_direction: string;  // "UP" or "DOWN" or ""
}

interface TrendSignal {
  timestamp: string;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  price: number;
  ma_9: number;      // Fast MA
  ma_21: number;     // Medium MA
  ma_50: number;     // Slow MA (main trend)
  ma_50_trend: 'Uptrend' | 'Downtrend' | 'Neutral';  // Price vs MA50
  crossover_status: 'UP' | 'DOWN' | 'NONE';  // MA9 vs MA21 crossing
  trend_bias: string;
  entry_allowed: boolean;
  trend_strength: 'Strong' | 'Moderate' | 'Weak';
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    // Read MA data from EA file (ea_data.json or ma_data.json)
    const maDataPath = join(process.env.HOME || '/tmp', 'development/MikaBot/ma_data.json');

    if (!existsSync(maDataPath)) {
      return Response.json(
        { error: 'MA data not available from EA. Ensure EA is running.' },
        { status: 503 }
      );
    }

    const maContent = readFileSync(maDataPath, 'utf-8');
    const maData: MAData = JSON.parse(maContent);

    const {
      price,
      ma_fast,
      ma_medium,
      ma_slow,
      ma_fast_period,
      ma_medium_period,
      ma_slow_period,
      crossover_detected,
      crossover_direction
    } = maData;

    console.log('[TREND AGENT] Reading MA data:');
    console.log(`  Price: ${price.toFixed(5)}`);
    console.log(`  Fast(${ma_fast_period}): ${ma_fast.toFixed(5)} | Medium(${ma_medium_period}): ${ma_medium.toFixed(5)} | Slow(${ma_slow_period}): ${ma_slow.toFixed(5)}`);
    console.log(`  Crossover Detected: ${crossover_detected} (${crossover_direction})`);

    // Calculate trend metrics from MAs
    const price_above_slow = price > ma_slow;
    const price_above_medium = price > ma_medium;
    const price_above_fast = price > ma_fast;
    const fast_above_medium = ma_fast > ma_medium;
    const medium_above_slow = ma_medium > ma_slow;
    const fast_above_slow = ma_fast > ma_slow;

    const ma_distance_fast_medium = Math.abs(ma_fast - ma_medium);
    const ma_distance_medium_slow = Math.abs(ma_medium - ma_slow);
    const distance_from_slow = Math.abs(price - ma_slow);

    const prompt = `You are a Trend Analysis Agent reading LIVE 3-MA crossover signals from the EA.

CROSSOVER SIGNAL (from EA, already detected):
- Crossover Detected: ${crossover_detected}
- Direction: ${crossover_direction}  (UP = Fast crossed above Medium, DOWN = Fast crossed below Medium)

MA DATA (from completed candles):
- Fast MA (${ma_fast_period}):   ${ma_fast.toFixed(5)}
- Medium MA (${ma_medium_period}): ${ma_medium.toFixed(5)}
- Slow MA (${ma_slow_period}):   ${ma_slow.toFixed(5)}
- Price:            ${price.toFixed(5)}

MA ALIGNMENT:
- Fast > Medium: ${fast_above_medium}
- Medium > Slow: ${medium_above_slow}
- Fast > Slow: ${fast_above_slow}
- Price > Slow: ${price_above_slow}

Respond ONLY with valid JSON (no markdown):
{
  "direction": "BUY|SELL|NEUTRAL",
  "confidence": 0-100,
  "trend_bias": "Uptrend|Downtrend|Neutral",
  "entry_allowed": true|false,
  "trend_strength": "Strong|Moderate|Weak",
  "reasoning": "Brief explanation"
}

ANALYSIS RULES:

1. ALIGNMENT REQUIREMENT (CRITICAL):
   Both conditions must be true for valid signal:
   - Crossover detected: crossover_detected = true
   - Direction match: crossover_direction matches MA50 trend
     * crossover_direction="UP" AND ma_50_trend="Uptrend" → entry_allowed=true, direction=BUY
     * crossover_direction="DOWN" AND ma_50_trend="Downtrend" → entry_allowed=true, direction=SELL
     * Mismatch (e.g., UP crossover but Downtrend) → entry_allowed=false, direction=NEUTRAL (filter noise/chop)

2. TREND BIAS (from Slow MA):
   - Price > Slow MA → Uptrend (bullish)
   - Price < Slow MA → Downtrend (bearish)
   - Price ≈ Slow MA (within 50 pips) → Neutral

3. CONFIDENCE CALCULATION:
   - Crossover detected AND direction aligned: +40 points (strongest signal)
   - Crossover detected but misaligned: +20 points (weak signal, typically filtered)
   - MA alignment (all 3 ordered correctly): +30 points
   - Price far from Slow MA (>100 pips): +20 points
   - Base: 30% if no crossover detected

4. ENTRY ALLOWED:
   - TRUE only if: crossover_detected=true AND crossover_direction matches ma_50_trend
   - FALSE if: crossover_detected=false OR direction mismatches trend (noise/whipsaw)

EXAMPLES:
- Crossover UP, MA50 Trend UP, Price > MA50 → entry_allowed=true, direction=BUY (Strong 90+)
- Crossover DOWN, MA50 Trend DOWN, Price < MA50 → entry_allowed=true, direction=SELL (Strong 90+)
- Crossover UP, MA50 Trend DOWN (choppy) → entry_allowed=false, direction=NEUTRAL (noise, ignore)
- Crossover DOWN, MA50 Trend UP (pullback) → entry_allowed=false, direction=NEUTRAL (noise, ignore)
- No crossover → entry_allowed=false, direction=NEUTRAL (wait for actual crossover)

5. Trend Strength:
   - Confidence >= 80 → Strong
   - Confidence 50-79 → Moderate
   - Confidence < 50 → Weak`;

    const response = await chatAI(prompt, { provider: 'ollama', temperature: 0.3 });

    if (response.error) {
      console.error('[TREND AGENT] Ollama error:', response.error);
      return Response.json({ error: response.error }, { status: 500 });
    }

    const trendData = parseJSON<any>(response.content);

    if (!trendData || !trendData.direction) {
      console.error('[TREND AGENT] Failed to parse:', response.content);
      return Response.json(
        { error: 'Failed to parse agent response', raw: response.content.substring(0, 200) },
        { status: 400 }
      );
    }

    // Determine MA50 trend based on price position
    const ma_50_trend =
      price > ma_slow ? 'Uptrend' :
      price < ma_slow ? 'Downtrend' :
      'Neutral';

    // Determine crossover status from EA data
    const crossover_status =
      crossover_detected && crossover_direction === 'UP' ? 'UP' :
      crossover_detected && crossover_direction === 'DOWN' ? 'DOWN' :
      'NONE';

    // CRITICAL: Check alignment - crossover direction must match MA50 trend
    // UP crossover only valid in Uptrend, DOWN crossover only valid in Downtrend
    const isAligned =
      (crossover_direction === 'UP' && ma_50_trend === 'Uptrend') ||
      (crossover_direction === 'DOWN' && ma_50_trend === 'Downtrend');

    const isValidSignal = crossover_detected && isAligned;
    const finalDirection = isValidSignal ? trendData.direction : 'NEUTRAL';
    const finalConfidence = isValidSignal
      ? Math.min(100, Math.max(0, trendData.confidence || 50))
      : 0;

    const signal: TrendSignal = {
      timestamp: new Date().toISOString(),
      symbol: 'BTCUSD',
      direction: finalDirection,
      confidence: finalConfidence,
      price,
      ma_9: ma_fast,
      ma_21: ma_medium,
      ma_50: ma_slow,
      ma_50_trend,
      crossover_status,
      trend_bias: trendData.trend_bias || 'Neutral',
      entry_allowed: isValidSignal,
      trend_strength: trendData.trend_strength || 'Moderate',
      reasoning: isValidSignal
        ? trendData.reasoning || 'Crossover aligned with trend'
        : 'Crossover misaligned with trend - filtering noise'
    };

    // Save to file
    const path = join(process.env.HOME || '/tmp', 'development/MikaBot/trend_signal.json');
    writeFileSync(path, JSON.stringify(signal, null, 2), 'utf-8');

    console.log(
      `[TREND AGENT] ${signal.direction} (${signal.confidence}%) | MA9: ${signal.ma_9.toFixed(5)} MA21: ${signal.ma_21.toFixed(5)} MA50: ${signal.ma_50.toFixed(5)} | MA50 Trend: ${signal.ma_50_trend} | Crossover: ${signal.crossover_status}`
    );

    return Response.json(signal);
  } catch (error) {
    console.error('[TREND AGENT] Error:', error);
    return Response.json(
      { error: `Server error: ${String(error)}` },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return Response.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
