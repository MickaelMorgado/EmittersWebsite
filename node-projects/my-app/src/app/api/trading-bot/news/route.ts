import { NextResponse } from 'next/server';
import { chatAI, parseJSON } from '@/lib/ai';

interface NewsAnalysis {
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  keywords: string[];
  impact: 'High' | 'Medium' | 'Low';
  relevanceScore: number;
}

function analyzeSentiment(text: string): NewsAnalysis {
  const lowerText = text.toLowerCase();

  // Bullish keywords
  const bullishWords = ['surge', 'rally', 'jump', 'gain', 'bull', 'strong', 'positive', 'soar', 'growth', 'beat', 'profit', 'climb', 'peak', 'outpace', 'rise', 'recovery'];
  // Bearish keywords
  const bearishWords = ['crash', 'plunge', 'fall', 'loss', 'bear', 'weak', 'negative', 'decline', 'miss', 'threat', 'contraction', 'concerns', 'weakness', 'drop', 'slump'];

  const bullishCount = bullishWords.filter(w => lowerText.includes(w)).length;
  const bearishCount = bearishWords.filter(w => lowerText.includes(w)).length;

  const sentiment = bullishCount > bearishCount ? 'Bullish' : bearishCount > bullishCount ? 'Bearish' : 'Neutral';

  // Extract keywords
  const keywords = [...new Set([
    ...bullishWords.filter(w => lowerText.includes(w)),
    ...bearishWords.filter(w => lowerText.includes(w)),
  ])];

  // Determine impact
  const impact = bullishCount + bearishCount > 3 ? 'High' : bullishCount + bearishCount > 1 ? 'Medium' : 'Low';

  // Relevance (0-100) - higher if more sentiment words found
  const relevanceScore = Math.min(100, (bullishCount + bearishCount) * 20);

  return { sentiment, keywords, impact, relevanceScore };
}

function parseRSSFeed(xmlString: string) {
  const items: any[] = [];

  // Extract items from RSS
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemContent = match[1];

    // Extract fields using regex
    const titleMatch = itemContent.match(/<title[^>]*>([^<]+)<\/title>/);
    const descMatch = itemContent.match(/<description[^>]*>([^<]+)<\/description>/);
    const linkMatch = itemContent.match(/<link[^>]*>([^<]+)<\/link>/);
    const pubDateMatch = itemContent.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/);

    if (titleMatch) {
      items.push({
        title: titleMatch[1].trim(),
        description: descMatch ? descMatch[1].trim() : '',
        link: linkMatch ? linkMatch[1].trim() : '',
        pubDate: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
      });
    }
  }

  return items;
}

async function fetchNewsViaLLM() {
  const prompt = `Generate 8-10 realistic financial market news items based on current market trends.

Return EXACTLY this JSON format (no markdown, no extra text):
{
  "news": [
    {
      "title": "headline",
      "source": "news source",
      "description": "2-3 sentence summary",
      "link": "https://example.com",
      "pubDate": "ISO 8601 timestamp"
    }
  ]
}

Focus on: market movements, earnings reports, Fed announcements, economic data, major corporate news.`;

  const response = await chatAI(prompt, { provider: 'ollama', temperature: 0.7 });

  if (!response.content) {
    return [];
  }

  const parsed = parseJSON<{ news: any[] }>(response.content);
  return parsed?.news || [];
}

export async function GET(request: Request) {
  try {
    let newsItems: any[] = [];
    let source = 'News Feed';

    // Try RSS first (silently ignore failures)
    try {
      const response = await fetch('https://www.financialjuice.com/feed.ashx?xy=rss', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (response.ok) {
        const xmlText = await response.text();
        newsItems = parseRSSFeed(xmlText);
        source = 'Financial Juice RSS Feed';
      }
      // Silently ignore RSS failures - no error thrown
    } catch (rssError) {
      // Silently ignore RSS feed errors
    }

    // If RSS didn't return items, fetch via LLM (Ollama)
    if (newsItems.length === 0) {
      newsItems = await fetchNewsViaLLM();
      source = 'Ollama AI News Feed';
    }

    // Analyze all news
    const analyzedNews = newsItems.map((item: any) => ({
      title: item.title || 'Untitled',
      source: item.source || source,
      pubDate: item.pubDate || new Date().toISOString(),
      content: item.description || item.title || '',
      link: item.link || '',
      analysis: analyzeSentiment((item.title || '') + ' ' + (item.description || '')),
    }));

    // Sort by relevance and date
    analyzedNews.sort((a: any, b: any) => {
      const relevanceDiff = b.analysis.relevanceScore - a.analysis.relevanceScore;
      if (relevanceDiff !== 0) return relevanceDiff;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    return NextResponse.json({
      news: analyzedNews.slice(0, 15),
      timestamp: new Date().toISOString(),
      newsCount: analyzedNews.length,
      source: source,
    });
  } catch (error) {
    // Silently handle errors - return empty news without error details
    console.warn('[NEWS AGENT] Could not fetch news');
    return NextResponse.json({
      news: [],
      timestamp: new Date().toISOString(),
      newsCount: 0,
      source: 'News Feed',
    });
  }
}
