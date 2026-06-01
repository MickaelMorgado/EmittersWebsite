import { chatAI, parseJSON } from '@/lib/ai';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface RiskApprovalResponse {
  timestamp: string;
  symbol: string;
  approved: boolean;
  signal: 'BUY' | 'SELL';
  position_size: number;
  stop_loss_pips: number;
  take_profit_pips: number;
  stop_loss_distance: number;
  take_profit_distance: number;
  max_loss: number;
  account_equity: number;
  current_daily_loss: number;
  current_monthly_loss: number;
  open_positions_count: number;
  portfolio_risk_percentage: number;
  rejection_reason: string | null;
  confidence: number;
}

const PIP_VALUES: { [symbol: string]: number } = {
  'BTCUSD': 1.0,
  'EURUSD': 0.0001,
  'GBPUSD': 0.0001,
  'USDJPY': 0.01,
};

function getPipValue(symbol: string): number {
  return PIP_VALUES[symbol] || 1.0;
}

function parseRRRatio(ratio: string): { numerator: number; denominator: number } {
  const parts = ratio.split(':');
  return {
    numerator: parseInt(parts[0]) || 1,
    denominator: parseInt(parts[1]) || 1
  };
}

export async function POST(request: Request) {
  try {
    const { signal, confidence, symbol = 'BTCUSD', rr_ratio = '1:3', history_sl_pips = 50 } =
      await request.json();

    if (!signal || !['BUY', 'SELL'].includes(signal)) {
      return Response.json(
        { error: 'Invalid signal. Must be BUY or SELL' },
        { status: 400 }
      );
    }

    // Read positions and trades
    const positionsPath = join(process.env.HOME || '/tmp', 'development/MikaBot/positions.json');
    const tradesPath = join(process.env.HOME || '/tmp', 'development/MikaBot/trades.json');

    let positions = { openPositions: [] };
    let trades = { history: [] };

    if (existsSync(positionsPath)) {
      positions = JSON.parse(readFileSync(positionsPath, 'utf-8'));
    }

    if (existsSync(tradesPath)) {
      trades = JSON.parse(readFileSync(tradesPath, 'utf-8'));
    }

    const open_positions_count = positions.openPositions?.length || 0;
    const account_equity = 100.0; // Placeholder - should come from MT5

    // Calculate daily and monthly loss (simplified)
    const today = new Date().toDateString();
    const month_start = new Date();
    month_start.setDate(1);

    const daily_loss = trades.history
      .filter((t: any) => new Date(t.time).toDateString() === today)
      .reduce((sum: number, t: any) => sum + (t.profit || 0), 0);

    const monthly_loss = trades.history
      .filter((t: any) => new Date(t.time) >= month_start)
      .reduce((sum: number, t: any) => sum + (t.profit || 0), 0);

    const pip_value = getPipValue(symbol);

    const prompt = `You are a Risk Management Agent for crypto trading.

Account Status:
- Equity: $${account_equity.toFixed(2)}
- Open Positions: ${open_positions_count}
- Daily Loss: $${daily_loss.toFixed(2)}
- Monthly Loss: $${monthly_loss.toFixed(2)}
- Daily Limit (5%): $${(account_equity * 0.05).toFixed(2)}
- Monthly Limit (10%): $${(account_equity * 0.10).toFixed(2)}

Trade Request:
- Signal: ${signal}
- Confidence: ${confidence}%
- R:R Ratio: ${rr_ratio}
- History SL: ${history_sl_pips}p

Respond ONLY with valid JSON (no markdown code blocks):
{
  "approved": true|false,
  "position_size": 0.01-0.05,
  "stop_loss_pips": number,
  "take_profit_pips": number,
  "rejection_reason": null|"string"
}

Decision Logic:
1. REJECT if daily_loss > $${(account_equity * 0.05).toFixed(2)} (5% limit)
2. REJECT if monthly_loss > $${(account_equity * 0.10).toFixed(2)} (10% limit)
3. REJECT if open_positions >= 5
4. Calculate position_size = ($${(account_equity * 0.02).toFixed(2)} max_risk) / (${history_sl_pips}p × ${pip_value})
5. Clamp position_size: min 0.01, max 0.05
6. If 3+ open positions: reduce position_size to 50%
7. TP pips = SL pips × (RR denominator / RR numerator)
   - For 1:3 ratio: TP = ${history_sl_pips} × 3 = ${history_sl_pips * 3}
8. If all checks pass: APPROVE with calculated values`;

    const response = await chatAI(prompt, { provider: 'ollama', temperature: 0.3 });

    if (response.error) {
      console.error('[RISK AGENT] Ollama error:', response.error);
      return Response.json({ error: response.error }, { status: 500 });
    }

    console.log('[RISK AGENT] Raw response from Ollama:', response.content.substring(0, 500));

    const parsed = parseJSON<any>(response.content);

    if (!parsed || parsed.approved === undefined) {
      console.error('[RISK AGENT] Failed to parse response');
      console.error('[RISK AGENT] Response content:', response.content);
      console.error('[RISK AGENT] Parsed result:', parsed);
      return Response.json(
        {
          error: 'Failed to parse agent response',
          raw: response.content.substring(0, 200),
          parsed: parsed
        },
        { status: 400 }
      );
    }

    // Calculate TP pips from RR ratio
    const rr = parseRRRatio(rr_ratio);
    const sl_pips = parsed.stop_loss_pips || history_sl_pips;
    const tp_pips = Math.round(sl_pips * (rr.denominator / rr.numerator));

    const sl_distance = sl_pips * pip_value;
    const tp_distance = tp_pips * pip_value;

    // Determine approval status and confidence first
    const is_approved = parsed.approved === true;
    const confidence_score = is_approved ? 0.95 : 0;

    const result: RiskApprovalResponse = {
      timestamp: new Date().toISOString(),
      symbol,
      approved: is_approved,
      signal,
      position_size: parsed.position_size || 0.02,
      stop_loss_pips: sl_pips,
      take_profit_pips: tp_pips,
      stop_loss_distance: parseFloat(sl_distance.toFixed(5)),
      take_profit_distance: parseFloat(tp_distance.toFixed(5)),
      max_loss: parseFloat((sl_pips * (parsed.position_size || 0.02) * pip_value).toFixed(2)),
      account_equity,
      current_daily_loss: parseFloat(daily_loss.toFixed(2)),
      current_monthly_loss: parseFloat(monthly_loss.toFixed(2)),
      open_positions_count,
      portfolio_risk_percentage: (open_positions_count / 5) * 100,
      rejection_reason: parsed.rejection_reason || null,
      confidence: confidence_score
    };

    // Save to file
    const path = join(process.env.HOME || '/tmp', 'development/MikaBot/risk_decision.json');
    writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');

    console.log(
      `[RISK AGENT] ${result.approved ? '✓ APPROVED' : '✗ REJECTED'} ${
        result.rejection_reason || ''
      } | Size: ${result.position_size} | SL: ${result.stop_loss_pips}p TP: ${result.take_profit_pips}p`
    );

    return Response.json(result);
  } catch (error) {
    console.error('[RISK AGENT] Error:', error);
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
