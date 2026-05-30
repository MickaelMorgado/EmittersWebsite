import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTES_DIR = '/Users/mickael/development/MikaBot/notes';
const NOTES_50 = path.join(NOTES_DIR, '50-trade-notes.json');
const NOTES_500 = path.join(NOTES_DIR, '500-trade-notes.json');
const GLOBAL_REC = path.join(NOTES_DIR, 'global-recommendation.json');
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

interface NoteItem {
  id: string;
  content: string;
  addedAt: string;
  lastUpdatedAt: string;
  status: 'active' | 'deprecated';
}

interface Notes {
  cycleNumber: number;
  totalTrades: number;
  generatedAt: string;
  items: NoteItem[];
  summary: string;
}

interface GlobalRecommendation {
  lastUpdatedAt: string;
  totalTrades: number;
  recommendation: string;
  keyInsights: string[];
}

interface ReportMetrics {
  totalTrades: number;
  winRate: number;
  wins: number;
  losses: number;
  totalPnL: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  buyCount: number;
  sellCount: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

// Ensure notes directory exists
function ensureNotesDir() {
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }
}

// Calculate metrics from trades
function calculateMetrics(trades: TradeHistory[]): ReportMetrics {
  const wins = trades.filter(t => (t.profit || 0) >= 0).length;
  const losses = trades.length - wins;
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const avgProfit = trades.length > 0 ? totalProfit / trades.length : 0;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  const winTrades = trades.filter(t => (t.profit || 0) > 0);
  const lossTrades = trades.filter(t => (t.profit || 0) < 0);
  const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / lossTrades.length) : 0;

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentStreak = 0;
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

  return {
    totalTrades: trades.length,
    winRate: parseFloat(winRate.toFixed(2)),
    wins,
    losses,
    totalPnL: parseFloat(totalProfit.toFixed(2)),
    avgTrade: parseFloat(avgProfit.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    profitFactor: avgWin > 0 ? parseFloat((avgWin / avgLoss).toFixed(2)) : 0,
    buyCount,
    sellCount,
    maxWinStreak,
    maxLossStreak
  };
}

// Generate or update 50-trade notes
async function generate50TradeNotes(trades: TradeHistory[], cycleNumber: number, previousNotes: Notes | null): Promise<Notes> {
  if (!OPENROUTER_API_KEY) {
    return {
      cycleNumber,
      totalTrades: cycleNumber * 50,
      generatedAt: new Date().toISOString(),
      items: [],
      summary: 'API key not configured'
    };
  }

  const metrics = calculateMetrics(trades);
  const previousNotesText = previousNotes
    ? previousNotes.items
        .filter(n => n.status === 'active')
        .map(n => `- ${n.content}`)
        .join('\n')
    : 'None - this is the first analysis';

  const prompt = `You are a trading improvement coach. You've been analyzing trades and building a list of actionable insights.

PREVIOUS NOTES (from earlier 50-trade cycles):
${previousNotesText}

CURRENT 50-TRADE CYCLE METRICS (Trades ${(cycleNumber - 1) * 50 + 1}-${cycleNumber * 50}):
- Win Rate: ${metrics.winRate}%
- Trades: ${metrics.totalTrades}
- Total P&L: $${metrics.totalPnL}
- Avg Trade: $${metrics.avgTrade}
- Avg Win: $${metrics.avgWin} | Avg Loss: $${metrics.avgLoss}
- Profit Factor: ${metrics.profitFactor}
- Buy: ${metrics.buyCount} | Sell: ${metrics.sellCount}
- Win Streak: ${metrics.maxWinStreak} | Loss Streak: ${metrics.maxLossStreak}

YOUR TASK:
1. Review the previous notes - are they still valid and relevant?
2. Mark notes as "deprecated" if they no longer apply or the trader has solved them
3. Add NEW insights if you see patterns or issues in the current cycle
4. Update existing notes if they need refinement based on new data
5. Provide 4-6 active, actionable insights total

Format your response as a JSON array with this structure:
[
  {
    "id": "unique_id",
    "content": "specific actionable insight",
    "action": "add|update|keep|deprecate",
    "reason": "brief explanation"
  }
]

Focus on:
- Trading edge/strategy improvements
- Risk management issues
- Consistency problems
- Entry/exit timing patterns
- Trade sizing or position management`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://trading-bot.local',
        'X-Title': 'Trading Bot Reports'
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e4b-it:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      console.error('[50-trade-notes] API error');
      return {
        cycleNumber,
        totalTrades: cycleNumber * 50,
        generatedAt: new Date().toISOString(),
        items: previousNotes?.items || [],
        summary: 'Failed to update notes'
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '[]';

    // Parse AI response
    let updates: any[] = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        updates = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[50-trade-notes] Failed to parse AI response');
    }

    // Merge with previous notes
    const newItems = previousNotes ? [...previousNotes.items] : [];

    for (const update of updates) {
      if (update.action === 'add') {
        newItems.push({
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: update.content,
          addedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          status: 'active'
        });
      } else if (update.action === 'update') {
        const existing = newItems.find(n => n.id === update.id || n.content.includes(update.content.split(' ')[0]));
        if (existing) {
          existing.content = update.content;
          existing.lastUpdatedAt = new Date().toISOString();
        }
      } else if (update.action === 'deprecate') {
        const existing = newItems.find(n => n.id === update.id || n.content.includes(update.content.split(' ')[0]));
        if (existing) {
          existing.status = 'deprecated';
          existing.lastUpdatedAt = new Date().toISOString();
        }
      }
    }

    const summary = `Cycle #${cycleNumber} (${cycleNumber * 50} total trades) | WR: ${metrics.winRate}% | P&L: $${metrics.totalPnL} | ${newItems.filter(n => n.status === 'active').length} active insights`;

    return {
      cycleNumber,
      totalTrades: cycleNumber * 50,
      generatedAt: new Date().toISOString(),
      items: newItems,
      summary
    };
  } catch (error) {
    console.error('[50-trade-notes] Error:', error);
    return {
      cycleNumber,
      totalTrades: cycleNumber * 50,
      generatedAt: new Date().toISOString(),
      items: previousNotes?.items || [],
      summary: 'Error updating notes'
    };
  }
}

// Generate or update 500-trade notes
async function generate500TradeNotes(trades: TradeHistory[], cycleNumber: number, previousNotes: Notes | null): Promise<Notes> {
  if (!OPENROUTER_API_KEY) {
    return {
      cycleNumber,
      totalTrades: cycleNumber * 500,
      generatedAt: new Date().toISOString(),
      items: [],
      summary: 'API key not configured'
    };
  }

  const metrics = calculateMetrics(trades);
  const previousNotesText = previousNotes
    ? previousNotes.items
        .filter(n => n.status === 'active')
        .map(n => `- ${n.content}`)
        .join('\n')
    : 'None - this is the first 500-trade analysis';

  const prompt = `You are a professional trading coach conducting a 500-trade strategic review.

PREVIOUS 500-TRADE STRATEGIC NOTES:
${previousNotesText}

CURRENT 500-TRADE CYCLE METRICS (Trades ${(cycleNumber - 1) * 500 + 1}-${cycleNumber * 500}):
- Win Rate: ${metrics.winRate}%
- Total Trades: ${metrics.totalTrades}
- Total P&L: $${metrics.totalPnL}
- Avg Trade: $${metrics.avgTrade}
- Profit Factor: ${metrics.profitFactor}
- Max Win Streak: ${metrics.maxWinStreak}
- Max Loss Streak: ${metrics.maxLossStreak}

YOUR TASK:
1. Assess whether previous strategic notes still apply
2. Mark notes as "deprecated" if the issue has been resolved
3. Add NEW high-level strategic insights
4. Update existing notes with long-term trend data
5. Provide 3-5 strategic, actionable insights for the NEXT 500 trades

Format as JSON array:
[
  {
    "id": "unique_id",
    "content": "strategic insight for next 500-trade cycle",
    "action": "add|update|keep|deprecate",
    "reason": "strategic justification"
  }
]

Focus on:
- Overall strategy effectiveness
- Risk/reward optimization
- Position sizing for next cycle
- Market condition adaptation
- Long-term skill improvement`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://trading-bot.local',
        'X-Title': 'Trading Bot Reports'
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e4b-it:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      console.error('[500-trade-notes] API error');
      return {
        cycleNumber,
        totalTrades: cycleNumber * 500,
        generatedAt: new Date().toISOString(),
        items: previousNotes?.items || [],
        summary: 'Failed to update notes'
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '[]';

    let updates: any[] = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        updates = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[500-trade-notes] Failed to parse AI response');
    }

    const newItems = previousNotes ? [...previousNotes.items] : [];

    for (const update of updates) {
      if (update.action === 'add') {
        newItems.push({
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: update.content,
          addedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          status: 'active'
        });
      } else if (update.action === 'update') {
        const existing = newItems.find(n => n.id === update.id || n.content.includes(update.content.split(' ')[0]));
        if (existing) {
          existing.content = update.content;
          existing.lastUpdatedAt = new Date().toISOString();
        }
      } else if (update.action === 'deprecate') {
        const existing = newItems.find(n => n.id === update.id || n.content.includes(update.content.split(' ')[0]));
        if (existing) {
          existing.status = 'deprecated';
          existing.lastUpdatedAt = new Date().toISOString();
        }
      }
    }

    const summary = `500-Trade Cycle #${cycleNumber} (${cycleNumber * 500} total) | WR: ${metrics.winRate}% | P&L: $${metrics.totalPnL} | ${newItems.filter(n => n.status === 'active').length} active strategies`;

    return {
      cycleNumber,
      totalTrades: cycleNumber * 500,
      generatedAt: new Date().toISOString(),
      items: newItems,
      summary
    };
  } catch (error) {
    console.error('[500-trade-notes] Error:', error);
    return {
      cycleNumber,
      totalTrades: cycleNumber * 500,
      generatedAt: new Date().toISOString(),
      items: previousNotes?.items || [],
      summary: 'Error updating notes'
    };
  }
}

// Generate or update global recommendation
async function generateGlobalRecommendation(notes50: Notes | null, notes500: Notes | null, totalTrades: number): Promise<GlobalRecommendation> {
  if (!OPENROUTER_API_KEY) {
    return {
      lastUpdatedAt: new Date().toISOString(),
      totalTrades,
      recommendation: 'API key not configured',
      keyInsights: []
    };
  }

  const insights50 = notes50 ? notes50.items.filter(n => n.status === 'active').map(n => `- ${n.content}`).join('\n') : 'None yet';
  const insights500 = notes500 ? notes500.items.filter(n => n.status === 'active').map(n => `- ${n.content}`).join('\n') : 'None yet';

  const prompt = `You are a master trading strategist synthesizing all insights from ${totalTrades} trades.

50-TRADE TACTICAL INSIGHTS (current focus areas):
${insights50}

500-TRADE STRATEGIC INSIGHTS (long-term direction):
${insights500}

Create ONE unified, actionable master recommendation that:
1. Synthesizes both tactical and strategic insights
2. Prioritizes what to focus on RIGHT NOW
3. Explains expected impact on trading performance
4. Is written in 2-3 sentences for immediate clarity

Also provide 3-4 KEY INSIGHTS as bullet points that summarize the path forward.

Respond in JSON:
{
  "recommendation": "master recommendation text",
  "keyInsights": ["insight 1", "insight 2", "insight 3"]
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://trading-bot.local',
        'X-Title': 'Trading Bot Reports'
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e4b-it:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error('[global-recommendation] API error');
      return {
        lastUpdatedAt: new Date().toISOString(),
        totalTrades,
        recommendation: 'Failed to generate recommendation',
        keyInsights: []
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '{}';

    let result = { recommendation: '', keyInsights: [] as string[] };
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[global-recommendation] Failed to parse AI response');
    }

    return {
      lastUpdatedAt: new Date().toISOString(),
      totalTrades,
      recommendation: result.recommendation || 'Processing insights...',
      keyInsights: result.keyInsights || []
    };
  } catch (error) {
    console.error('[global-recommendation] Error:', error);
    return {
      lastUpdatedAt: new Date().toISOString(),
      totalTrades,
      recommendation: 'Error generating recommendation',
      keyInsights: []
    };
  }
}

export async function GET() {
  try {
    ensureNotesDir();

    const notes50 = fs.existsSync(NOTES_50) ? JSON.parse(fs.readFileSync(NOTES_50, 'utf-8')) : null;
    const notes500 = fs.existsSync(NOTES_500) ? JSON.parse(fs.readFileSync(NOTES_500, 'utf-8')) : null;
    const globalRec = fs.existsSync(GLOBAL_REC) ? JSON.parse(fs.readFileSync(GLOBAL_REC, 'utf-8')) : null;

    return NextResponse.json({
      notes50,
      notes500,
      globalRecommendation: globalRec,
      message: 'Notes system initialized'
    });
  } catch (error) {
    console.error('[notes-history] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notes' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    ensureNotesDir();

    if (!fs.existsSync(TRADES_PATH)) {
      return NextResponse.json({ error: 'Trades file not found' }, { status: 404 });
    }

    const tradesContent = fs.readFileSync(TRADES_PATH, 'utf-8');
    const tradesData: TradesData = JSON.parse(tradesContent);
    const allTrades = tradesData.history || [];
    const totalTrades = allTrades.length;

    // Check if we need to update 50-trade notes (every 50 trades)
    const cycle50 = Math.floor(totalTrades / 50);
    const previous50Notes = fs.existsSync(NOTES_50) ? JSON.parse(fs.readFileSync(NOTES_50, 'utf-8')) : null;

    if (cycle50 > 0 && (!previous50Notes || previous50Notes.cycleNumber < cycle50)) {
      const startIdx = (cycle50 - 1) * 50;
      const endIdx = cycle50 * 50;
      const trades50 = allTrades.slice(startIdx, endIdx);

      if (trades50.length >= 50) {
        const notes50 = await generate50TradeNotes(trades50, cycle50, previous50Notes);
        fs.writeFileSync(NOTES_50, JSON.stringify(notes50, null, 2));
        console.log(`[notes] Updated 50-trade notes - Cycle #${cycle50}`);
      }
    }

    // Check if we need to update 500-trade notes (every 500 trades)
    const cycle500 = Math.floor(totalTrades / 500);
    const previous500Notes = fs.existsSync(NOTES_500) ? JSON.parse(fs.readFileSync(NOTES_500, 'utf-8')) : null;

    if (cycle500 > 0 && (!previous500Notes || previous500Notes.cycleNumber < cycle500)) {
      const startIdx = (cycle500 - 1) * 500;
      const endIdx = cycle500 * 500;
      const trades500 = allTrades.slice(startIdx, endIdx);

      if (trades500.length >= 500) {
        const notes500 = await generate500TradeNotes(trades500, cycle500, previous500Notes);
        fs.writeFileSync(NOTES_500, JSON.stringify(notes500, null, 2));
        console.log(`[notes] Updated 500-trade notes - Cycle #${cycle500}`);
      }
    }

    // Generate/update global recommendation
    const notes50Current = fs.existsSync(NOTES_50) ? JSON.parse(fs.readFileSync(NOTES_50, 'utf-8')) : null;
    const notes500Current = fs.existsSync(NOTES_500) ? JSON.parse(fs.readFileSync(NOTES_500, 'utf-8')) : null;
    const globalRec = await generateGlobalRecommendation(notes50Current, notes500Current, totalTrades);
    fs.writeFileSync(GLOBAL_REC, JSON.stringify(globalRec, null, 2));

    return NextResponse.json({
      success: true,
      totalTrades,
      cycle50,
      cycle500,
      updated50: (!previous50Notes || previous50Notes.cycleNumber < cycle50),
      updated500: (!previous500Notes || previous500Notes.cycleNumber < cycle500),
      message: `Notes updated - ${totalTrades} total trades processed`
    });
  } catch (error) {
    console.error('[notes-history] POST error:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
