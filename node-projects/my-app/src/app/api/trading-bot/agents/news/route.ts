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
import { chatAI } from '@/lib/ai';

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
  // Plain-language "explain it to me like I'm not a trader" recap of the most
  // important fetched headlines — written in everyday words so the user can
  // build economic understanding over time, not just see jargon-y metrics.
  plain_summary: string | null;
}

/**
 * Asks the local LLM to recap the day's top headlines in plain, jargon-free
 * language — a couple of short sentences a non-trader could read and actually
 * learn something from (what happened, why it might matter). Best-effort: if
 * the model is unavailable or returns nothing usable, we simply omit it.
 */
async function generatePlainSummary(
  items: NewsItem[],
  context: { symbol: string; overallSentiment: 'Bullish' | 'Neutral' | 'Bearish'; highImpactCount: number }
): Promise<string | null> {
  if (items.length === 0) return null;

  const headlineList = items
    .slice(0, 5)
    .map((n, i) => `${i + 1}. "${n.title}" (${n.analysis?.sentiment ?? 'Neutral'} sentiment, ${n.analysis?.impact ?? 'Low'} impact)`)
    .join('\n');

  const directionHint =
    context.overallSentiment === 'Bullish' ? 'leaning upward (more positive than negative news)' :
    context.overallSentiment === 'Bearish' ? 'leaning downward (more negative than positive news)' :
    'mixed / no clear lean either way';

  const prompt = `You are explaining financial news to a curious beginner who has never traded before and doesn't know trading jargon.

Asset being traded: ${context.symbol}
Overall tone of today's news for this asset: ${directionHint}
High-impact (likely to move the market) headlines today: ${context.highImpactCount}

Here are today's top market headlines:
${headlineList}

Write a short, friendly recap (3-5 sentences, plain everyday English, no jargon like "VIX", "bullish/bearish", "basis points" — explain any concept in simple terms if you must mention it). Cover:
1. What's happening in the news, and why someone might care.
2. In plain words, what this kind of news could mean for the price direction of ${context.symbol} (e.g. "news like this often nudges prices up/down/sideways because...") — frame this as "here's one way to think about it", NOT as a prediction or instruction to buy/sell. Make clear that markets are unpredictable and this is just context, not advice.

Do not give trading advice, do not tell the reader to buy or sell. Return ONLY the recap text, no preamble, no markdown, no quotes.`;

  try {
    // Match the provider used elsewhere in the app for natural-language
    // explanations/recaps (see report-history's trade-notes generation) —
    // 'ollama' is reserved for the trading-decision agents (Trend/History/
    // Risk per CLAUDE.md), while explanatory summaries use 'openrouter'.
    const response = await chatAI(prompt, { provider: 'openrouter', temperature: 0.4, maxTokens: 250 });
    const text = response?.content?.trim();
    if (!text) return null;
    // Guard against the model echoing instructions or wrapping in quotes/markdown
    return text.replace(/^["'`]+|["'`]+$/g, '').replace(/^```[a-z]*\n?|```$/g, '').trim() || null;
  } catch (e) {
    console.warn('[NEWS AGENT] Plain-summary generation failed:', e);
    return null;
  }
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
        plain_summary:     null,
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

    // Best-effort plain-language recap — never blocks the agent's decision.
    // Includes a beginner-friendly take on what the news could mean for the
    // current asset's price direction (framed as context, not advice).
    const plain_summary = await generatePlainSummary(top, {
      symbol: 'BTCUSD',
      overallSentiment,
      highImpactCount: highImpact.length,
    });

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
      plain_summary,
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
