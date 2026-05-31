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

export async function GET(request: Request) {
  try {
    // Fetch from Financial Juice RSS feed
    const response = await fetch('https://www.financialjuice.com/feed.ashx?xy=rss', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }

    const xmlText = await response.text();
    const parsedItems = parseRSSFeed(xmlText);

    // Analyze all news
    const analyzedNews = parsedItems.map((item) => ({
      title: item.title,
      source: 'Financial Juice',
      pubDate: item.pubDate,
      content: item.description || item.title,
      link: item.link,
      analysis: analyzeSentiment(item.title + ' ' + (item.description || '')),
    }));

    // Sort by relevance and date
    analyzedNews.sort((a, b) => {
      const relevanceDiff = b.analysis.relevanceScore - a.analysis.relevanceScore;
      if (relevanceDiff !== 0) return relevanceDiff;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    return NextResponse.json({
      news: analyzedNews.slice(0, 15), // Return top 15
      timestamp: new Date().toISOString(),
      newsCount: analyzedNews.length,
      source: 'Financial Juice RSS Feed',
    });
  } catch (error) {
    console.error('Error fetching RSS news:', error);
    return NextResponse.json({
      news: [],
      error: `Failed to fetch news: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      source: 'Financial Juice RSS Feed',
    });
  }
}
