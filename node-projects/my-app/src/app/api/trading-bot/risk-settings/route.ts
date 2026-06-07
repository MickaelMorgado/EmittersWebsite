import { readRiskSettings, writeRiskSettings, RiskSettings } from '@/lib/risk-settings';

export async function GET() {
  return Response.json(readRiskSettings());
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const clampPct = (v: any, fallback: number) => {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(100, Math.max(0.1, n));
    };

    const current = readRiskSettings();
    const next: RiskSettings = {
      daily_drawdown_pct:   clampPct(body.daily_drawdown_pct,   current.daily_drawdown_pct),
      weekly_drawdown_pct:  clampPct(body.weekly_drawdown_pct,  current.weekly_drawdown_pct),
      monthly_drawdown_pct: clampPct(body.monthly_drawdown_pct, current.monthly_drawdown_pct),
    };

    writeRiskSettings(next);
    console.log(`[RISK SETTINGS] Updated → daily ${next.daily_drawdown_pct}% | weekly ${next.weekly_drawdown_pct}% | monthly ${next.monthly_drawdown_pct}%`);

    return Response.json(next);
  } catch (error) {
    console.error('[RISK SETTINGS] Error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export function OPTIONS() {
  return Response.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
