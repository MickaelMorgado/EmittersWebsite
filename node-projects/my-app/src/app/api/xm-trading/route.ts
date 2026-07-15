import { NextResponse } from 'next/server';
import fs from 'fs';

const XM_TRADES_PATH = '/Users/mickael/development/personal-memory-bank/agents/xm-trading/xm_trades.json';

interface XmTrade {
  ticket: number;
  positionId: number;
  type: string;
  price: number;
  volume: number;
  profit: number;
  commission: number;
  swap: number;
  netProfit: number;
  time: string;
}

interface XmTradesData {
  version?: string;
  account?: number;
  symbol?: string;
  history?: XmTrade[];
}

export async function GET() {
  try {
    if (!fs.existsSync(XM_TRADES_PATH)) {
      return NextResponse.json({
        history: [],
        stats: { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0 },
        account: null,
        symbol: null,
      });
    }

    const content = fs.readFileSync(XM_TRADES_PATH, 'utf-8');
    let data: XmTradesData;
    try {
      data = JSON.parse(content);
    } catch {
      data = { history: [] };
    }

    const history = (data.history || []).map((t) => ({
      id: String(t.ticket),
      type: t.type,
      price: t.price,
      volume: t.volume,
      time: t.time,
      result: t.netProfit >= 0 ? 'WIN' : 'LOSS',
      pnl: t.netProfit,
      commission: t.commission,
      swap: t.swap,
      netProfit: t.netProfit,
    }));

    const wins = history.filter((t) => t.netProfit >= 0).length;
    const losses = history.filter((t) => t.netProfit < 0).length;
    const total = history.length;
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
    const totalPnl = history.reduce((sum, t) => sum + t.netProfit, 0);

    return NextResponse.json({
      version: data.version || '1.00',
      account: data.account || null,
      symbol: data.symbol || null,
      history: history.reverse(),
      stats: {
        totalTrades: total,
        wins,
        losses,
        winRate,
        totalPnl: Math.round(totalPnl * 100) / 100,
      },
    });
  } catch (error) {
    console.error('[xm-trading] Error:', error);
    return NextResponse.json({
      history: [],
      stats: { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0 },
      error: 'Failed to read XM trades',
    }, { status: 500 });
  }
}
