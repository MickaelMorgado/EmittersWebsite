import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readRiskSettings } from '@/lib/risk-settings';

const PIP_VALUES: Record<string, number> = {
  BTCUSD: 1.0,
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  USDJPY: 0.01,
};

function parseRR(ratio: string): { num: number; den: number } {
  const [n, d] = ratio.split(':').map(Number);
  return { num: n || 1, den: d || 1 };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      signal,
      _confidence = 0,
      symbol = 'BTCUSD',
      rr_ratio = '1:3',
      history_sl_pips = 50,
    } = body;

    if (!signal || !['BUY', 'SELL'].includes(signal)) {
      return Response.json({ error: 'Invalid signal. Must be BUY or SELL' }, { status: 400 });
    }

    const positionsPath = join(process.env.HOME || '/tmp', 'development/MikaBot/positions.json');
    const tradesPath    = join(process.env.HOME || '/tmp', 'development/MikaBot/trades.json');

    const positions = existsSync(positionsPath)
      ? JSON.parse(readFileSync(positionsPath, 'utf-8'))
      : { openPositions: [] };

    const trades = existsSync(tradesPath)
      ? JSON.parse(readFileSync(tradesPath, 'utf-8'))
      : { history: [] };

    const open_positions_count: number = positions.openPositions?.length ?? 0;

    // Account equity: sum open floating P&L + base (TODO: connect to MT5 balance API)
    const ACCOUNT_BASE  = 10000;
    const floatingPnL   = (positions.openPositions ?? [])
      .reduce((s: number, p: any) => s + (p.profit ?? 0), 0);
    const account_equity = ACCOUNT_BASE + floatingPnL;

    // ── Daily / weekly / monthly loss from closed trades ─────────────────────
    // Drawdown thresholds are user-configurable (see risk_settings.json,
    // editable from the Risk Agent's Rules panel) rather than hardcoded.
    const riskSettings = readRiskSettings();

    const now        = new Date();
    const todayStr   = now.toDateString();
    // Week starts Monday — matches how most prop-firm / broker drawdown
    // windows are defined, and gives traders a familiar weekly reset point.
    const dayOfWeek  = now.getDay(); // 0=Sun..6=Sat
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const allTrades: any[] = trades.history ?? [];

    const sumSince = (from: Date) => allTrades
      .filter(t => { try { return new Date(t.time) >= from; } catch { return false; } })
      .reduce((s, t) => s + (t.profit ?? t.netProfit ?? 0), 0);

    const daily_loss = allTrades
      .filter(t => { try { return new Date(t.time).toDateString() === todayStr; } catch { return false; } })
      .reduce((s, t) => s + (t.profit ?? t.netProfit ?? 0), 0);

    const weekly_loss  = sumSince(weekStart);
    const monthly_loss = sumSince(monthStart);

    const daily_limit   = account_equity * (riskSettings.daily_drawdown_pct   / 100);
    const weekly_limit  = account_equity * (riskSettings.weekly_drawdown_pct  / 100);
    const monthly_limit = account_equity * (riskSettings.monthly_drawdown_pct / 100);

    // ── Risk gates ───────────────────────────────────────────────────────────
    let rejection_reason: string | null = null;

    if (daily_loss <= -daily_limit)
      rejection_reason = `Daily loss limit reached (${daily_loss.toFixed(2)} / -${daily_limit.toFixed(2)} · ${riskSettings.daily_drawdown_pct}% of equity)`;
    else if (weekly_loss <= -weekly_limit)
      rejection_reason = `Weekly loss limit reached (${weekly_loss.toFixed(2)} / -${weekly_limit.toFixed(2)} · ${riskSettings.weekly_drawdown_pct}% of equity)`;
    else if (monthly_loss <= -monthly_limit)
      rejection_reason = `Monthly loss limit reached (${monthly_loss.toFixed(2)} / -${monthly_limit.toFixed(2)} · ${riskSettings.monthly_drawdown_pct}% of equity)`;
    else if (open_positions_count >= 5)
      rejection_reason = `Max open positions reached (${open_positions_count}/5)`;

    const approved = rejection_reason === null;

    // ── Position sizing ──────────────────────────────────────────────────────
    const pip_value  = PIP_VALUES[symbol] ?? 1.0;
    const max_risk   = account_equity * 0.02; // 2% per trade
    const sl_pips    = Math.max(history_sl_pips, 30);

    let position_size = pip_value > 0 ? max_risk / (sl_pips * pip_value) : 0.01;

    // Reduce size when multiple positions open
    if (open_positions_count >= 3) position_size *= 0.5;

    position_size = parseFloat(Math.min(0.05, Math.max(0.01, position_size)).toFixed(2));

    // ── SL/TP from R:R ───────────────────────────────────────────────────────
    const rr = parseRR(rr_ratio);
    const stop_loss_pips    = sl_pips;
    const take_profit_pips  = Math.round(sl_pips * (rr.den / rr.num));
    const stop_loss_distance  = parseFloat((stop_loss_pips  * pip_value).toFixed(5));
    const take_profit_distance = parseFloat((take_profit_pips * pip_value).toFixed(5));
    const max_loss = parseFloat((stop_loss_pips * position_size * pip_value).toFixed(2));

    const result = {
      timestamp:               new Date().toISOString(),
      symbol,
      approved,
      signal,
      position_size,
      stop_loss_pips,
      take_profit_pips,
      stop_loss_distance,
      take_profit_distance,
      max_loss,
      account_equity:          parseFloat(account_equity.toFixed(2)),
      current_daily_loss:      parseFloat(daily_loss.toFixed(2)),
      current_weekly_loss:     parseFloat(weekly_loss.toFixed(2)),
      current_monthly_loss:    parseFloat(monthly_loss.toFixed(2)),
      daily_limit:             parseFloat(daily_limit.toFixed(2)),
      weekly_limit:            parseFloat(weekly_limit.toFixed(2)),
      monthly_limit:           parseFloat(monthly_limit.toFixed(2)),
      drawdown_settings:       riskSettings,
      open_positions_count,
      portfolio_risk_percentage: parseFloat(((open_positions_count / 5) * 100).toFixed(1)),
      rejection_reason,
      confidence:              approved ? 0.95 : 0,
    };

    const outPath = join(process.env.HOME || '/tmp', 'development/MikaBot/risk_decision.json');
    writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

    console.log(
      `[RISK AGENT] ${approved ? '✓ APPROVED' : '✗ REJECTED'} ${rejection_reason ?? ''} | ` +
      `Size: ${position_size} | SL: ${stop_loss_pips}p TP: ${take_profit_pips}p | ` +
      `Daily: ${daily_loss.toFixed(2)} Weekly: ${weekly_loss.toFixed(2)} Monthly: ${monthly_loss.toFixed(2)}`
    );

    return Response.json(result);
  } catch (error) {
    console.error('[RISK AGENT] Error:', error);
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
