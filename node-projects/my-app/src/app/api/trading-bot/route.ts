import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// MT5 data files
const TRADES_PATH = '/Users/mickael/development/MikaBot/trades.json';
const POSITIONS_PATH = '/Users/mickael/development/MikaBot/positions.json';
const ANALYSIS_FILE = 'ai_analysis.json';

console.log(`[trading-bot] Using trades file: ${TRADES_PATH}`);
console.log(`[trading-bot] Using positions file: ${POSITIONS_PATH}`);

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
  isOpen?: boolean;
}

interface BotStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  currentStreak: number;
  milestone?: number;
}

interface TradesData {
  version?: string;
  history?: { ticket?: number; closeTicket?: number; type: string; openPrice: number; closePrice: number; openTime: string; closeTime: string; profit?: number; commission?: number; netProfit?: number; status: string }[];
  stats?: { totalTrades: number; wins: number; losses: number; totalPnl?: number; milestone?: number };
}

interface AIAnalysis {
  timestamp: string;
  symbol: string;
  price: number;
  trend: string;
  patterns: string[];
  rsi: number | null;
  confidence: number;
  signal: string;
  reasoning: string;
}

export async function GET(request: Request) {
  try {
    // Extract mode from query parameters
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'real';

    console.log(`[trading-bot GET] Mode: ${mode}`);

    const analysisPath = path.join(path.dirname(TRADES_PATH), ANALYSIS_FILE);

    console.log(`[trading-bot GET] Looking for trades at: ${TRADES_PATH}`);

    if (!fs.existsSync(TRADES_PATH)) {
      console.log(`[trading-bot GET] ❌ trades.json not found`);
      return NextResponse.json({
        openPositions: [],
        history: [],
        stats: { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, currentStreak: 0 },
        mode
      });
    }

    // Get trades file size
    const fileStats = fs.statSync(TRADES_PATH);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);
    const lastModified = fileStats.mtime.toLocaleTimeString();

    console.log(`[trading-bot GET] ✓ Trades file - Size: ${fileSizeKB} KB | Updated: ${lastModified}`);

    // Read trades file for history
    const content = fs.readFileSync(TRADES_PATH, 'utf-8');
    let data: TradesData;
    try {
      data = JSON.parse(content);
    } catch (parseError) {
      console.log(`[trading-bot GET] ⚠️ Invalid JSON in trades.json, using default empty data`);
      data = { version: 'N/D', history: [], stats: {} };
    }

    // Read positions file if it exists (real-time)
    let openPositions: Trade[] = [];
    if (fs.existsSync(POSITIONS_PATH)) {
      const positionsStats = fs.statSync(POSITIONS_PATH);
      const positionsSizeKB = (positionsStats.size / 1024).toFixed(2);
      console.log(`[trading-bot GET] ✓ Positions file - Size: ${positionsSizeKB} KB | Updated: ${positionsStats.mtime.toLocaleTimeString()}`);

      try {
        const positionsContent = fs.readFileSync(POSITIONS_PATH, 'utf-8');
        const positionsData = JSON.parse(positionsContent);
        openPositions = (positionsData.openPositions || []).map((pos: any, idx: number) => ({
          id: String(pos.ticket || idx),
          type: pos.type,
          price: pos.currentPrice || pos.entryPrice || pos.price || 0,
          openPrice: pos.entryPrice || pos.price || 0,
          lot: 0.01,
          time: pos.openTime || pos.time,
          profit: pos.profit || 0,
          pnl: pos.profit || 0,
          isOpen: true
        }));
      } catch (e) {
        console.log(`[trading-bot GET] Warning: Could not parse positions.json`);
      }
    } else {
      console.log(`[trading-bot GET] ⚠️  Positions file not found`);
    }


    const history: Trade[] = (data.history || []).map((trade, idx) => ({
      id: String(trade.ticket || idx),
      type: trade.type,
      price: trade.closePrice || 0,
      openPrice: trade.openPrice || 0,
      lot: 0.01,
      time: trade.closeTime,
      result: (trade.profit ?? 0) >= 0 ? 'WIN' : 'LOSS',
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
    
    let aiAnalysis: AIAnalysis | null = null;
    if (fs.existsSync(analysisPath)) {
      try {
        aiAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
      } catch {}
    }
    
    let totalPnl = 0;
    if (data.history && data.history.length > 0) {
      totalPnl = data.history.reduce((sum, t) => sum + (t.netProfit || t.profit || 0), 0);
    }
    
    return NextResponse.json({
      version: data.version || 'N/D',
      openPositions,
      history: history.reverse(),
      stats: {
        totalTrades: finalTotal,
        wins: finalWins,
        losses: finalLosses,
        winRate,
        totalPnl: Math.round(totalPnl * 100) / 100,
        currentStreak: 0,
        milestone: stats.milestone
      },
      aiAnalysis
    });
  } catch (error) {
    console.error('Error reading trades:', error);
    return NextResponse.json({
      openPositions: [],
      history: [],
      stats: { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, currentStreak: 0 },
      error: 'Failed to read trades'
    }, { status: 500 });
  }
}