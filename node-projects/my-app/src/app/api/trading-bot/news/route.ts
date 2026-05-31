import { NextResponse } from 'next/server';

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `Fetch and summarize the latest financial market news from multiple sources (Bloomberg, Reuters, MarketWatch, CNBC, Yahoo Finance, etc.).

  Return EXACTLY this JSON format (no markdown, no extra text):
  {
    "news": [
      {
        "title": "headline",
        "source": "source name",
        "description": "2-3 sentence summary",
        "link": "https://example.com",
        "pubDate": "ISO 8601 timestamp"
      }
    ]
  }

  Include 10-12 recent news items. Focus on: market movements, earnings, Fed/economic data, major corporate news.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Claude response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.news || [];
}

export async function GET(request: Request) {
  try {
    let newsItems: any[] = [];
    let source = 'Financial Juice RSS Feed';

    // Try RSS first
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
      } else {
        throw new Error(`RSS: ${response.status}`);
      }
    } catch (rssError) {
      console.warn('RSS feed failed, falling back to Claude API:', rssError);

      // Fallback to Claude API for multi-source fetch
      newsItems = await fetchNewsViaLLM();
      source = 'Claude AI Multi-Source Feed';
    }

    // Analyze all news
    const analyzedNews = newsItems.map((item: any) => ({
      title: item.title,
      source: item.source || source,
      pubDate: item.pubDate || new Date().toISOString(),
      content: item.description || item.title,
      link: item.link || '',
      analysis: analyzeSentiment(item.title + ' ' + (item.description || '')),
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
    console.error('Error fetching news:', error);
    return NextResponse.json({
      news: [],
      error: `Failed to fetch news: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      source: 'News Feed',
    });
  }
}
