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

export async function POST(_request: Request) {
  try {
    const tradesPath = join(process.env.HOME || '/tmp', 'development/MikaBot/trades.json');

    if (!existsSync(tradesPath)) {
      return Response.json({ error: 'No trade history available' }, { status: 404 });
    }

    const tradesData = JSON.parse(readFileSync(tradesPath, 'utf-8'));
    const trades: any[] = tradesData.history || [];
    const total = trades.length;

    if (total === 0) {
      const empty: HistoryRecommendation = {
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
        reasoning: 'Insufficient trade history — using conservative defaults',
      };
      return Response.json(empty);
    }

    // ── Core stats ───────────────────────────────────────────────────────────
    const winning = trades.filter(t => (t.profit ?? t.netProfit ?? 0) > 0);
    const losing  = trades.filter(t => (t.profit ?? t.netProfit ?? 0) <= 0);

    const winRate     = winning.length / total;
    const grossProfit = winning.reduce((s, t) => s + (t.profit ?? t.netProfit ?? 0), 0);
    const grossLoss   = Math.abs(losing.reduce((s, t) => s + (t.profit ?? t.netProfit ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    const avgWin = winning.length > 0 ? grossProfit / winning.length : 0;
    const avgLoss = losing.length > 0 ? grossLoss / losing.length : 0;

    // ── Recommended R:R from profit factor ──────────────────────────────────
    const recommended_rr_ratio =
      profitFactor >= 2.0  ? '1:4'   :
      profitFactor >= 1.5  ? '1:3'   :
      profitFactor >= 1.0  ? '1:1.5' :
      '1:1';

    // ── Recommended SL pips from avg loss magnitude ──────────────────────────
    // avgLoss is in $; for BTCUSD pip_value = 1.0, so rough pips ≈ avgLoss
    const recommended_sl_pips =
      avgLoss < 5   ? 30 :
      avgLoss < 15  ? 50 :
      avgLoss < 30  ? 70 :
      100;

    // ── Consistency score: sample weight × win-rate stability ────────────────
    const sampleWeight =
      total >= 100 ? 1.0 :
      total >= 50  ? 0.8 :
      total >= 20  ? 0.5 :
      0.2;

    // Win rates near 50% are most "stable" (mean-reverting); extremes risk reversal
    const winRateStability = (winRate > 0.3 && winRate < 0.7) ? 1.0 : 0.6;
    const consistency_score = parseFloat((sampleWeight * winRateStability).toFixed(3));

    // ── Recent 24h trades ────────────────────────────────────────────────────
    const yesterday = new Date(Date.now() - 86400000);
    const recent_trades_24h = trades.filter(t => {
      try { return new Date(t.time) >= yesterday; } catch { return false; }
    }).length;

    const reasoning =
      `PF ${profitFactor.toFixed(2)} → ${recommended_rr_ratio} R:R | ` +
      `WR ${(winRate * 100).toFixed(1)}% | ` +
      `Consistency ${(consistency_score * 100).toFixed(0)}% (${total} trades)`;

    const recommendation: HistoryRecommendation = {
      timestamp: new Date().toISOString(),
      symbol: 'BTCUSD',
      total_trades: total,
      win_rate: parseFloat(winRate.toFixed(3)),
      profit_factor: parseFloat(profitFactor.toFixed(2)),
      avg_win: parseFloat(avgWin.toFixed(2)),
      avg_loss: parseFloat(avgLoss.toFixed(2)),
      recommended_rr_ratio,
      recommended_sl_pips,
      consistency_score,
      recent_trades_24h,
      reasoning,
    };

    const outPath = join(process.env.HOME || '/tmp', 'development/MikaBot/history_recommendation.json');
    writeFileSync(outPath, JSON.stringify(recommendation, null, 2), 'utf-8');

    console.log(`[HISTORY AGENT] RR ${recommendation.recommended_rr_ratio} | WR ${(winRate * 100).toFixed(1)}% | PF ${profitFactor.toFixed(2)} | Consistency ${(consistency_score * 100).toFixed(0)}%`);

    return Response.json(recommendation);
  } catch (error) {
    console.error('[HISTORY AGENT] Error:', error);
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
