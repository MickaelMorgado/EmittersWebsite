import { chatAI, parseJSON } from '@/lib/ai';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface HistoryRecommendation {
  timestamp: string;
  symbol: string;
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  recommended_rr_ratio: string;
  recommended_sl_pips: number;
  consistency_score: number;
  recent_trades_24h: number;
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    // Read trade history from trades.json
    const tradesPath = join(process.env.HOME || '/tmp', 'development/MikaBot/trades.json');

    if (!existsSync(tradesPath)) {
      return Response.json(
        { error: 'No trade history available' },
        { status: 404 }
      );
    }

    const tradesContent = readFileSync(tradesPath, 'utf-8');
    const tradesData = JSON.parse(tradesContent);

    const trades = tradesData.history || [];
    const total = trades.length;

    if (total === 0) {
      return Response.json(
        {
          timestamp: new Date().toISOString(),
          symbol: 'BTCUSD',
          total_trades: 0,
          win_rate: 0,
          profit_factor: 0,
          avg_win: 0,
          avg_loss: 0,
          recommended_rr_ratio: '1:1.5',
          recommended_sl_pips: 50,
          consistency_score: 0,
          recent_trades_24h: 0,
          reasoning: 'Insufficient trade history'
        },
        { status: 200 }
      );
    }

    const wins = trades.filter((t: any) => t.profit > 0).length;
    const losses = total - wins;
    const winRate = wins / total;

    const winningTrades = trades.filter((t: any) => t.profit > 0);
    const losingTrades = trades.filter((t: any) => t.profit <= 0);

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0) / losingTrades.length
      : 0;

    const grossProfit = winningTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0));

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    const prompt = `You are a History Analysis Agent for crypto trading.

Trade History Analysis:
- Total Trades: ${total}
- Wins: ${wins}, Losses: ${losses}
- Win Rate: ${(winRate * 100).toFixed(1)}%
- Average Win: $${avgWin.toFixed(2)}
- Average Loss: $${avgLoss.toFixed(2)}
- Gross Profit: $${grossProfit.toFixed(2)}
- Gross Loss: $${grossLoss.toFixed(2)}
- Profit Factor: ${profitFactor.toFixed(2)}

Respond ONLY with valid JSON (no markdown code blocks):
{
  "recommended_rr_ratio": "1:1|1:1.5|1:2|1:3|1:4",
  "recommended_sl_pips": 30-100,
  "consistency_score": 0.0-1.0,
  "reasoning": "Brief explanation"
}

Decision Rules:
- Profit Factor >= 2.0 → Recommend "1:4" RR, high consistency
- Profit Factor 1.5-2.0 → Recommend "1:3" RR
- Profit Factor 1.0-1.5 → Recommend "1:1.5" RR
- Profit Factor < 1.0 → Recommend "1:1" RR, low consistency
- Recommended SL in pips based on avg loss size (30-100 range)
- Consistency = sample weight × win rate stability
  - 100+ trades: full weight
  - 50-99 trades: 0.8x weight
  - 20-49 trades: 0.5x weight
  - <20 trades: 0.2x weight
- Win rate near 50%: stability 1.0 (predictable)
- Win rate >70% or <30%: stability 0.6 (could revert)`;

    const response = await chatAI(prompt, { provider: 'ollama', temperature: 0.3 });

    if (response.error) {
      console.error('[HISTORY AGENT] Ollama error:', response.error);
      return Response.json({ error: response.error }, { status: 500 });
    }

    const parsed = parseJSON<any>(response.content);

    if (!parsed || !parsed.recommended_rr_ratio) {
      console.error('[HISTORY AGENT] Failed to parse:', response.content);
      return Response.json(
        { error: 'Failed to parse agent response', raw: response.content },
        { status: 400 }
      );
    }

    const recommendation: HistoryRecommendation = {
      timestamp: new Date().toISOString(),
      symbol: 'BTCUSD',
      total_trades: total,
      win_rate: parseFloat(winRate.toFixed(3)),
      profit_factor: parseFloat(profitFactor.toFixed(2)),
      avg_win: parseFloat(avgWin.toFixed(2)),
      avg_loss: parseFloat(avgLoss.toFixed(2)),
      recommended_rr_ratio: parsed.recommended_rr_ratio || '1:1.5',
      recommended_sl_pips: parsed.recommended_sl_pips || 50,
      consistency_score: Math.min(1, Math.max(0, parsed.consistency_score || 0.5)),
      recent_trades_24h: Math.min(5, trades.length),
      reasoning: parsed.reasoning || 'Analysis complete'
    };

    // Save to file
    const path = join(process.env.HOME || '/tmp', 'development/MikaBot/history_recommendation.json');
    writeFileSync(path, JSON.stringify(recommendation, null, 2), 'utf-8');

    console.log(
      `[HISTORY AGENT] RR ${recommendation.recommended_rr_ratio}, SL ${recommendation.recommended_sl_pips}p, WR ${(recommendation.win_rate * 100).toFixed(1)}%`
    );

    return Response.json(recommendation);
  } catch (error) {
    console.error('[HISTORY AGENT] Error:', error);
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
