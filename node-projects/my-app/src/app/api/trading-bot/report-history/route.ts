import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { chatAI, parseJSON } from '@/lib/ai';

// Allow up to 5 minutes — OpenRouter free models can be slow under load
export const maxDuration = 300;

const NOTES_DIR  = '/Users/mickael/development/MikaBot/notes';
const NOTES_50   = path.join(NOTES_DIR, '50-trade-notes.json');
const NOTES_500  = path.join(NOTES_DIR, '500-trade-notes.json');
const GLOBAL_REC = path.join(NOTES_DIR, 'global-recommendation.json');
const TRADES_PATH = '/Users/mickael/development/MikaBot/trades.json';

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

/** Merge LLM updates into existing note items */
function mergeNoteUpdates(previousItems: NoteItem[], updates: any[]): NoteItem[] {
  const isMalformed = (c: string) => /\{\s*"id"\s*:|\[\s*\{|"action"\s*:\s*"add"/i.test(c);
  const items = (previousItems ?? []).filter(n => !isMalformed(n.content));
  for (const u of updates) {
    if (!u?.content) continue;
    const action = u.action ?? 'add';
    if (action === 'add') {
      items.push({
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: u.content,
        addedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        status: 'active',
      });
    } else if (action === 'update') {
      const existing = items.find(n => n.id === u.id || n.content.startsWith(u.content.split(' ')[0]));
      if (existing) { existing.content = u.content; existing.lastUpdatedAt = new Date().toISOString(); }
    } else if (action === 'deprecate') {
      const existing = items.find(n => n.id === u.id || n.content.startsWith(u.content.split(' ')[0]));
      if (existing) { existing.status = 'deprecated'; existing.lastUpdatedAt = new Date().toISOString(); }
    } else {
      items.push({
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: u.content,
        addedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        status: 'active',
      });
    }
  }
  return items;
}

async function generate50TradeNotes(trades: TradeHistory[], cycleNumber: number, previousNotes: Notes | null): Promise<Notes> {
  const metrics = calculateMetrics(trades);

  const prompt = `Trading data for ${metrics.totalTrades} trades:
Win rate: ${metrics.winRate}%, P&L: $${metrics.totalPnL}, Profit factor: ${metrics.profitFactor}
Avg win: $${metrics.avgWin}, Avg loss: $${metrics.avgLoss}
Best streak: ${metrics.maxWinStreak} wins, Worst: ${metrics.maxLossStreak} losses
BUY: ${metrics.buyCount}, SELL: ${metrics.sellCount}

Respond with exactly 4 trading improvements as a JSON array.
Each "content" must be ONE complete, actionable sentence (15-30 words) describing a specific improvement.
Output ONLY the JSON array. No prose, no labels, no code fences.
Example: [{"id":"1","content":"Tighten stop-loss on SELL entries to cap average loss below $20.","action":"add"}]`;

  try {
    const res = await chatAI(prompt, { provider: 'openrouter', temperature: 0.3 });
    console.log(`[50-trade-notes] raw response: ${res.content.substring(0, 200)}`);

    let updates: any[] = parseJSON<any[]>(res.content) ?? [];

    if (updates.length === 0 && res.content.trim().length > 20) {
      const cleaned = res.content
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\{[\s\S]*?\}/g, ' ')
        .replace(/\[[\s\S]*?\]/g, ' ')
        .replace(/^[\s,;:.\-]+/, '')
        .replace(/\s+/g, ' ')
        .trim();
      const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
      const fallback = (firstSentence.length > 15 ? firstSentence : cleaned).substring(0, 300);
      if (fallback.length > 15) {
        updates = [{ id: '1', content: fallback, action: 'add' }];
      }
    }

    const items = mergeNoteUpdates(previousNotes?.items ?? [], updates);
    const active = items.filter(n => n.status === 'active').length;
    console.log(`[50-trade-notes] ${res.provider} | Cycle #${cycleNumber} | ${active} insights`);
    return {
      cycleNumber,
      totalTrades: cycleNumber * 50,
      generatedAt: new Date().toISOString(),
      items,
      summary: `Cycle #${cycleNumber} | WR: ${metrics.winRate}% | ${active} insights`,
    };
  } catch (error) {
    console.error('[50-trade-notes] Error:', error);
    return { cycleNumber, totalTrades: cycleNumber * 50, generatedAt: new Date().toISOString(), items: previousNotes?.items ?? [], summary: 'Error' };
  }
}

async function generate500TradeNotes(trades: TradeHistory[], cycleNumber: number, previousNotes: Notes | null): Promise<Notes> {
  const metrics = calculateMetrics(trades);

  const prompt = `Trading performance over ${metrics.totalTrades} trades:
Win rate: ${metrics.winRate}%, Total P&L: $${metrics.totalPnL}, Profit factor: ${metrics.profitFactor}
Best win streak: ${metrics.maxWinStreak}, Worst loss streak: ${metrics.maxLossStreak}

Respond with exactly 3 high-level strategic improvements as a JSON array.
Each "content" must be ONE complete, actionable strategic sentence (15-30 words).
Output ONLY the JSON array. No prose, no labels, no code fences.
Example: [{"id":"1","content":"Reduce position size during losing streaks to preserve capital and limit drawdown.","action":"add"}]`;

  try {
    const res = await chatAI(prompt, { provider: 'openrouter', temperature: 0.3 });
    console.log(`[500-trade-notes] raw response: ${res.content.substring(0, 200)}`);

    let updates: any[] = parseJSON<any[]>(res.content) ?? [];

    if (updates.length === 0 && res.content.trim().length > 20) {
      const cleaned = res.content
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\{[\s\S]*?\}/g, ' ')
        .replace(/\[[\s\S]*?\]/g, ' ')
        .replace(/^[\s,;:.\-]+/, '')
        .replace(/\s+/g, ' ')
        .trim();
      const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
      const fallback = (firstSentence.length > 15 ? firstSentence : cleaned).substring(0, 300);
      if (fallback.length > 15) {
        updates = [{ id: '1', content: fallback, action: 'add' }];
      }
    }

    const items = mergeNoteUpdates(previousNotes?.items ?? [], updates);
    const active = items.filter(n => n.status === 'active').length;
    console.log(`[500-trade-notes] ${res.provider} | Cycle #${cycleNumber} | ${active} strategies`);
    return {
      cycleNumber,
      totalTrades: cycleNumber * 500,
      generatedAt: new Date().toISOString(),
      items,
      summary: `Cycle #${cycleNumber} | WR: ${metrics.winRate}% | ${active} strategies`,
    };
  } catch (error) {
    console.error('[500-trade-notes] Error:', error);
    return { cycleNumber, totalTrades: cycleNumber * 500, generatedAt: new Date().toISOString(), items: previousNotes?.items ?? [], summary: 'Error' };
  }
}

async function generateGlobalRecommendation(notes50: Notes | null, notes500: Notes | null, totalTrades: number): Promise<GlobalRecommendation> {
  const insights50  = notes50  ? notes50.items.filter(n => n.status === 'active').map(n => `- ${n.content}`).join('\n')  : 'None yet';
  const insights500 = notes500 ? notes500.items.filter(n => n.status === 'active').map(n => `- ${n.content}`).join('\n') : 'None yet';

  const prompt = `You are a master trading strategist synthesising ${totalTrades} trades of insights.

50-TRADE TACTICAL NOTES:
${insights50}

500-TRADE STRATEGIC NOTES:
${insights500}

Write ONE unified master recommendation (2-3 complete sentences) and 3-4 key insights.
Each key insight must be ONE complete, actionable sentence (15-30 words).

Respond in JSON:
{ "recommendation": "...", "keyInsights": ["...", "..."] }`;

  try {
    const res = await chatAI(prompt, { provider: 'openrouter', temperature: 0.7 });
    const result = parseJSON<{ recommendation: string; keyInsights: string[] }>(res.content);
    console.log(`[global-recommendation] ${res.provider} | ${totalTrades} trades`);
    return {
      lastUpdatedAt: new Date().toISOString(),
      totalTrades,
      recommendation: result?.recommendation || 'Analysing...',
      keyInsights: result?.keyInsights || [],
    };
  } catch (error) {
    console.error('[global-recommendation] Error:', error);
    return { lastUpdatedAt: new Date().toISOString(), totalTrades, recommendation: 'Error generating recommendation', keyInsights: [] };
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

/**
 * POST /api/trading-bot/report-history
 *
 * Auto mode (no body): runs whichever cycles have new trades.
 *
 * Force mode (JSON body): { target: "50" | "500" | "global" }
 *   Generates that section immediately using the most recent trades,
 *   regardless of whether the cycle threshold has been reached.
 */
export async function POST(req: NextRequest) {
  try {
    ensureNotesDir();

    if (!fs.existsSync(TRADES_PATH)) {
      return NextResponse.json({ error: 'Trades file not found' }, { status: 404 });
    }

    const tradesContent = fs.readFileSync(TRADES_PATH, 'utf-8');
    const tradesData: TradesData = JSON.parse(tradesContent);
    const allTrades = tradesData.history || [];
    const totalTrades = allTrades.length;

    // Read force target from body (if provided)
    let forceTarget: '50' | '500' | 'global' | null = null;
    try {
      const body = await req.json();
      if (body?.target) forceTarget = body.target;
    } catch { /* no body — auto mode */ }

    const previous50Notes  = fs.existsSync(NOTES_50)  ? JSON.parse(fs.readFileSync(NOTES_50, 'utf-8'))  : null;
    const previous500Notes = fs.existsSync(NOTES_500) ? JSON.parse(fs.readFileSync(NOTES_500, 'utf-8')) : null;

    // ── 50-trade notes ──────────────────────────────────────────────────────
    const cycle50 = Math.max(1, Math.floor(totalTrades / 50)) || 1;
    const should50 = forceTarget === '50'
      || (!forceTarget && totalTrades >= 50 && (!previous50Notes || previous50Notes.cycleNumber < Math.floor(totalTrades / 50)));

    if (should50) {
      // Use the most recent 50 trades for on-demand generation
      const trades50 = forceTarget === '50'
        ? allTrades.slice(-Math.min(50, totalTrades))
        : allTrades.slice((cycle50 - 1) * 50, cycle50 * 50);

      if (trades50.length > 0) {
        const notes50 = await generate50TradeNotes(trades50, cycle50, previous50Notes);
        fs.writeFileSync(NOTES_50, JSON.stringify(notes50, null, 2));
        console.log(`[notes] 50-trade notes generated (force=${!!forceTarget}) — Cycle #${cycle50}`);
      }
    }

    // ── 500-trade notes ─────────────────────────────────────────────────────
    const cycle500 = Math.max(1, Math.floor(totalTrades / 500)) || 1;
    const should500 = forceTarget === '500'
      || (!forceTarget && totalTrades >= 500 && (!previous500Notes || previous500Notes.cycleNumber < Math.floor(totalTrades / 500)));

    if (should500) {
      const trades500 = forceTarget === '500'
        ? allTrades.slice(-Math.min(500, totalTrades))
        : allTrades.slice((cycle500 - 1) * 500, cycle500 * 500);

      if (trades500.length > 0) {
        const notes500 = await generate500TradeNotes(trades500, cycle500, previous500Notes);
        fs.writeFileSync(NOTES_500, JSON.stringify(notes500, null, 2));
        console.log(`[notes] 500-trade notes generated (force=${!!forceTarget}) — Cycle #${cycle500}`);
      }
    }

    // ── Global recommendation ───────────────────────────────────────────────
    const shouldGlobal = forceTarget === 'global' || should50 || should500;
    if (shouldGlobal) {
      const n50  = fs.existsSync(NOTES_50)  ? JSON.parse(fs.readFileSync(NOTES_50, 'utf-8'))  : null;
      const n500 = fs.existsSync(NOTES_500) ? JSON.parse(fs.readFileSync(NOTES_500, 'utf-8')) : null;
      const globalRec = await generateGlobalRecommendation(n50, n500, totalTrades);
      fs.writeFileSync(GLOBAL_REC, JSON.stringify(globalRec, null, 2));
    }

    return NextResponse.json({
      success: true,
      totalTrades,
      target: forceTarget ?? 'auto',
      message: forceTarget
        ? `Force-generated ${forceTarget}-trade notes from ${totalTrades} trades`
        : `Auto cycle check — ${totalTrades} total trades`,
    });
  } catch (error) {
    console.error('[notes-history] POST error:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
