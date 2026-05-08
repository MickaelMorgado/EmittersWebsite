import { NextRequest } from 'next/server';
import fs from 'fs';

const TRADES_PATH = '/Users/mickael/development/MikaBot/trades.json';

interface TradesData {
  version?: string;
  history?: { ticket?: number; closeTicket?: number; type: string; openPrice: number; closePrice: number; openTime: string; closeTime: string; profit?: number; commission?: number; netProfit?: number; status: string }[];
  stats?: { totalTrades: number; wins: number; losses: number; totalPnl?: number; milestone?: number };
}

interface Trade {
  id: string;
  type: string;
  price: number;
  openPrice?: number;
  lot: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  pnl?: number;
  profit?: number;
  commission?: number;
  netProfit?: number;
}

function getTradeData() {
  try {
    if (!fs.existsSync(TRADES_PATH)) {
      return {
        history: [],
        stats: { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, currentStreak: 0 },
        version: 'N/D'
      };
    }

    const content = fs.readFileSync(TRADES_PATH, 'utf-8');
    const data: TradesData = JSON.parse(content);

    const history: Trade[] = (data.history || []).map((trade, idx) => ({
      id: String(trade.ticket || idx),
      type: trade.type,
      price: trade.exitPrice || trade.closePrice || 0,
      openPrice: trade.entryPrice || trade.openPrice || 0,
      lot: 0.01,
      time: trade.closeTime,
      result: trade.profit >= 0 ? 'WIN' : 'LOSS',
      pnl: trade.profit || 0,
      profit: trade.profit || 0,
      commission: 0,
      netProfit: trade.profit || 0
    }));

    const historyData = data.history || [];
    const calculatedWins = historyData.filter(t => (t.netProfit || t.profit || 0) >= 0).length;
    const calculatedLosses = historyData.filter(t => (t.netProfit || t.profit || 0) < 0).length;
    const calculatedTotal = historyData.length;

    const stats = data.stats || { totalTrades: 0, wins: 0, losses: 0, totalPnl: 0 };

    const finalWins = calculatedTotal > 0 ? calculatedWins : stats.wins;
    const finalLosses = calculatedTotal > 0 ? calculatedLosses : stats.losses;
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : stats.totalTrades;
    const winRate = finalTotal > 0 ? Math.round((finalWins / finalTotal) * 1000) / 10 : 0;

    let totalPnl = 0;
    if (data.history && data.history.length > 0) {
      totalPnl = data.history.reduce((sum, t) => sum + (t.netProfit || t.profit || 0), 0);
    }

    return {
      version: data.version || '1.28',
      history: history.reverse(),  // Send ALL trades for full equity curve, dashboard will display last 20 in trade history panel
      stats: {
        totalTrades: finalTotal,
        wins: finalWins,
        losses: finalLosses,
        winRate,
        totalPnl: Math.round(totalPnl * 100) / 100,
        currentStreak: 0,
        milestone: stats.milestone
      }
    };
  } catch (error) {
    console.error('[trading-bot stream] Error reading trades:', error);
    return {
      history: [],
      stats: { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, currentStreak: 0 },
      version: 'N/D',
      error: 'Failed to read trades'
    };
  }
}

export function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      console.log('[trading-bot stream] Client connected (trades & stats)');

      let lastTradesContent = '';

      const sendUpdate = () => {
        try {
          const data = getTradeData();
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
          console.log('[trading-bot stream] Update sent');
        } catch (error) {
          console.error('[trading-bot stream] Error sending update:', error);
        }
      };

      // Send initial data
      sendUpdate();

      // Check for updates every 500ms (trades update less frequently)
      let checkCount = 0;
      let updateCount = 0;

      const watchInterval = setInterval(() => {
        checkCount++;
        try {
          if (fs.existsSync(TRADES_PATH)) {
            try {
              const tradesContent = fs.readFileSync(TRADES_PATH, 'utf-8');
              if (tradesContent !== lastTradesContent) {
                lastTradesContent = tradesContent;
                updateCount++;
                console.log(`[trading-bot stream] Update #${updateCount} (check #${checkCount})`);
                sendUpdate();
              }
            } catch (e) {
              // File might be locked, skip
            }
          }
        } catch (error) {
          console.error('[trading-bot stream] Error checking files:', error);
        }
      }, 500);

      request.signal.addEventListener('abort', () => {
        clearInterval(watchInterval);
        controller.close();
        console.log('[trading-bot stream] Client disconnected');
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
