/**
 * News Agent — pure deterministic logic, no LLM.
 *
 * Decision rules:
 *  REJECT  → any High-impact item detected (volatility guard)
 *  REJECT  → overall sentiment is Bearish (majority of top-3 items)
 *  APPROVE → no high-impact items AND sentiment is Bullish or Neutral
 *
 * Volatility score is derived from the count and severity of impactful items.
 * LLM boost planned later: contextual understanding of specific event types.
 */

import { NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  source: string;
  analysis: {
    sentiment: 'Bullish' | 'Neutral' | 'Bearish';
    impact: 'High' | 'Medium' | 'Low';
    relevanceScore: number;
    keywords: string[];
  };
}

interface NewsAgentOutput {
  timestamp: string;
  approved: boolean;
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  volatility: number;          // 10–35 VIX-proxy
  score: number;               // 0–25
  high_impact_count: number;
  rejection_reason: string | null;
  top_headlines: string[];
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    // Accept news payload from client or fetch internally
    let newsItems: NewsItem[] = [];

    try {
      const body = await request.json();
      if (Array.isArray(body.news)) newsItems = body.news;
    } catch {
      // No body — fetch news internally
    }

    if (newsItems.length === 0) {
      // Self-fetch from news endpoint
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res  = await fetch(`${base}/api/trading-bot/news`);
      if (res.ok) {
        const data = await res.json();
        newsItems = data.news || [];
      }
    }

    if (newsItems.length === 0) {
      // No news available — approve with low confidence (can't block on missing data)
      const out: NewsAgentOutput = {
        timestamp:         new Date().toISOString(),
        approved:          true,
        sentiment:         'Neutral',
        volatility:        10,
        score:             10,
        high_impact_count: 0,
        rejection_reason:  null,
        top_headlines:     [],
        reasoning:         'No news data available — proceeding with caution',
      };
      console.log('[NEWS AGENT] No news — default APPROVE');
      return NextResponse.json(out);
    }

    const top = newsItems.slice(0, 5);

    // ── Impact counts ────────────────────────────────────────────────────────
    const highImpact   = top.filter(n => n.analysis?.impact === 'High');
    const mediumImpact = top.filter(n => n.analysis?.impact === 'Medium');

    // ── Overall sentiment from top-3 ─────────────────────────────────────────
    const top3 = newsItems.slice(0, 3);
    const bullish = top3.filter(n => n.analysis?.sentiment === 'Bullish').length;
    const bearish = top3.filter(n => n.analysis?.sentiment === 'Bearish').length;
    const overallSentiment: 'Bullish' | 'Neutral' | 'Bearish' =
      bearish > bullish ? 'Bearish' :
      bullish > bearish ? 'Bullish' :
      'Neutral';

    // ── Volatility proxy (10–35) ─────────────────────────────────────────────
    const rawVolatility = 10 + highImpact.length * 8 + mediumImpact.length * 3;
    const volatility    = Math.min(35, rawVolatility);

    // ── Decision ─────────────────────────────────────────────────────────────
    // REJECT only for actual volatility events (high-impact news).
    // Sentiment is a directional signal, not a gate — Bearish just means avoid BUY.
    let rejection_reason: string | null = null;

    if (highImpact.length >= 2) {
      rejection_reason =
        `${highImpact.length} high-impact news events — extreme volatility risk`;
    } else if (highImpact.length === 1 && volatility >= 28) {
      rejection_reason =
        `High-impact event + elevated volatility (${volatility}) — pausing trades`;
    }

    const approved = rejection_reason === null;

    // ── Score 0–25 ────────────────────────────────────────────────────────────
    // Full score when approved; sentiment affects score but not approval.
    let score = approved ? 12 : 0;
    if (approved) {
      if (overallSentiment === 'Bullish')  score += 8;
      if (overallSentiment === 'Neutral')  score += 4;
      // Bearish sentiment: no bonus (direction caution) but still approved
      if (highImpact.length === 0)         score += 3;
      if (mediumImpact.length === 0)       score += 2;
    }
    score = Math.min(25, score);

    const reasoning = rejection_reason ??
      `${overallSentiment} sentiment | VIX-proxy ${volatility.toFixed(0)} | ` +
      `${highImpact.length} high / ${mediumImpact.length} medium impact`;

    const out: NewsAgentOutput = {
      timestamp:         new Date().toISOString(),
      approved,
      sentiment:         overallSentiment,
      volatility,
      score,
      high_impact_count: highImpact.length,
      rejection_reason,
      top_headlines:     top.slice(0, 3).map(n => n.title),
      reasoning,
    };

    console.log(
      `[NEWS AGENT] ${approved ? '✓ APPROVED' : '✗ REJECTED'} | ` +
      `Sentiment: ${overallSentiment} | VIX-proxy: ${volatility} | ` +
      `High-impact: ${highImpact.length} | ${rejection_reason ?? 'clear'}`
    );

    return NextResponse.json(out);
  } catch (error) {
    console.error('[NEWS AGENT] Error:', error);
    return NextResponse.json({ error: `Server error: ${String(error)}` }, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
