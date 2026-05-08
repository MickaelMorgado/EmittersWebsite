import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const TRADES_PATH = '/Users/mickael/development/MikaBot/trades.json';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface TradeHistory {
  ticket?: number;
  type: string;
  openPrice: number;
  closePrice: number;
  profit?: number;
  status: string;
}

interface TradesData {
  version?: string;
  history?: TradeHistory[];
  stats?: { totalTrades: number; wins: number; losses: number; totalPnl?: number };
}

async function generateAIReport(trades: TradeHistory[], tradeCount: number) {
  if (!OPENROUTER_API_KEY) {
    return {
      error: 'OpenRouter API key not configured',
      analysis: 'AI analysis unavailable'
    };
  }

  try {
    // Calculate metrics
    const wins = trades.filter(t => (t.profit || 0) >= 0).length;
    const losses = trades.length - wins;
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const avgProfit = trades.length > 0 ? totalProfit / trades.length : 0;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

    const winTrades = trades.filter(t => (t.profit || 0) > 0);
    const lossTrades = trades.filter(t => (t.profit || 0) < 0);
    const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / lossTrades.length) : 0;

    // Find win/loss streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let buyCount = 0;
    let sellCount = 0;

    trades.forEach(t => {
      if (t.type === 'BUY') buyCount++;
      else sellCount++;

      if ((t.profit || 0) >= 0) {
        currentStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else {
        currentStreak = -1;
        maxLossStreak = Math.max(maxLossStreak, Math.abs(currentStreak));
      }
    });

    const prompt = `Analyze these trading statistics for the last ${tradeCount} trades:

Trading Metrics:
- Total Trades: ${trades.length}
- Win Rate: ${winRate.toFixed(2)}%
- Wins: ${wins} | Losses: ${losses}
- Total Profit/Loss: $${totalProfit.toFixed(2)}
- Average Trade: $${avgProfit.toFixed(2)}
- Average Win: $${avgWin.toFixed(2)}
- Average Loss: $${avgLoss.toFixed(2)}
- Buy Trades: ${buyCount} | Sell Trades: ${sellCount}
- Max Win Streak: ${maxWinStreak} | Max Loss Streak: ${maxLossStreak}
- Profit Factor: ${avgWin > 0 ? (avgWin / avgLoss).toFixed(2) : '0'}

Provide a concise AI diagnostic report (2-3 paragraphs) that includes:
1. Overall performance assessment
2. Key strengths and weaknesses
3. Specific patterns observed
4. 2-3 actionable recommendations for improvement

Format as professional trading analysis. Be specific and data-driven.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://trading-bot.local',
        'X-Title': 'Trading Bot Reports'
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e4b-it:free', // Free model
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[report] OpenRouter error:', error);
      return {
        error: `AI API error: ${error.error?.message || 'Unknown error'}`,
        analysis: 'Failed to generate AI analysis'
      };
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || 'No analysis generated';

    return {
      metrics: {
        totalTrades: trades.length,
        winRate: winRate.toFixed(2),
        wins,
        losses,
        totalPnL: totalProfit.toFixed(2),
        avgTrade: avgProfit.toFixed(2),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        profitFactor: avgWin > 0 ? (avgWin / avgLoss).toFixed(2) : '0',
        buyCount,
        sellCount,
        maxWinStreak,
        maxLossStreak
      },
      analysis,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[report] Error generating AI report:', error);
    return {
      error: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      analysis: 'Error generating AI analysis'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tradeCount } = await request.json();

    if (!tradeCount || tradeCount < 10 || tradeCount > 1000) {
      return NextResponse.json(
        { error: 'Invalid trade count. Must be between 10 and 1000.' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(TRADES_PATH)) {
      return NextResponse.json(
        { error: 'Trades file not found' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(TRADES_PATH, 'utf-8');
    const data: TradesData = JSON.parse(content);
    const allTrades = data.history || [];

    // Get last N trades
    const trades = allTrades.slice(-tradeCount);

    if (trades.length === 0) {
      return NextResponse.json(
        { error: 'No trades found' },
        { status: 404 }
      );
    }

    const report = await generateAIReport(trades, tradeCount);

    return NextResponse.json(report);
  } catch (error) {
    console.error('[report] Error:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
