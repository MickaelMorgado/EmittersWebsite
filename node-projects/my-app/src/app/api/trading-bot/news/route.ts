import { NextResponse } from 'next/server';

// Trading news headlines database
const TRADING_NEWS = [
  {
    title: 'Federal Reserve signals higher-for-longer interest rate stance amid inflation concerns',
    source: 'Bloomberg',
    keywords: ['Fed', 'inflation', 'rates'],
  },
  {
    title: 'Tech stocks rally on AI optimism, Nasdaq closes near all-time highs',
    source: 'Reuters',
    keywords: ['tech', 'AI', 'rally'],
  },
  {
    title: 'Oil prices surge past $90 as geopolitical tensions escalate',
    source: 'MarketWatch',
    keywords: ['oil', 'energy', 'geopolitical'],
  },
  {
    title: 'JPMorgan reports stronger-than-expected earnings, outpaces analyst estimates',
    source: 'CNBC',
    keywords: ['earnings', 'finance', 'beat'],
  },
  {
    title: 'Dollar strengthens against major currencies on economic data',
    source: 'FX Street',
    keywords: ['currency', 'dollar', 'strong'],
  },
  {
    title: 'European markets decline as economic growth concerns mount',
    source: 'Investing.com',
    keywords: ['Europe', 'economy', 'decline'],
  },
  {
    title: 'Bitcoin climbs past $65,000 amid institutional adoption wave',
    source: 'CoinDesk',
    keywords: ['crypto', 'Bitcoin', 'surge'],
  },
  {
    title: 'Manufacturing PMI falls below 50, signaling economic contraction',
    source: 'Trading Economics',
    keywords: ['manufacturing', 'PMI', 'contraction'],
  },
  {
    title: 'Apple announces record iPhone sales, stock hits new peak',
    source: 'Yahoo Finance',
    keywords: ['Apple', 'tech', 'sales', 'beat'],
  },
  {
    title: 'Gold surges as investors seek safe-haven assets amid uncertainty',
    source: 'Kitco',
    keywords: ['gold', 'safe-haven', 'surge'],
  },
];

interface NewsAnalysis {
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  keywords: string[];
  impact: 'High' | 'Medium' | 'Low';
  relevanceScore: number;
}

function analyzeSentiment(text: string): NewsAnalysis {
  const lowerText = text.toLowerCase();

  // Bullish keywords
  const bullishWords = ['surge', 'rally', 'jump', 'gain', 'bull', 'strong', 'positive', 'soar', 'growth', 'beat', 'profit', 'climb', 'peak', 'outpace'];
  // Bearish keywords
  const bearishWords = ['crash', 'plunge', 'fall', 'loss', 'bear', 'weak', 'negative', 'decline', 'miss', 'threat', 'contraction', 'concerns', 'weakness'];

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

export async function GET(request: Request) {
  try {
    // Simulate news rotation by time-based selection
    const hour = new Date().getHours();
    const newsPool = TRADING_NEWS;

    // Shuffle news based on hour to simulate different headlines
    const shuffled = [...newsPool].sort(() => {
      const seed = hour * 12345; // Use hour as seed
      return (Math.sin(seed) * 10000) % 1 - 0.5;
    });

    // Analyze all news
    const analyzedNews = shuffled.map((news, idx) => ({
      title: news.title,
      source: news.source,
      pubDate: new Date(Date.now() - (idx * 60000)).toISOString(), // Stagger timestamps
      content: news.title,
      link: `https://news.example.com/${idx}`,
      analysis: analyzeSentiment(news.title),
    }));

    // Sort by relevance
    analyzedNews.sort((a, b) => b.analysis.relevanceScore - a.analysis.relevanceScore);

    return NextResponse.json({
      news: analyzedNews.slice(0, 10), // Return top 10
      timestamp: new Date().toISOString(),
      newsCount: TRADING_NEWS.length,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({
      news: [],
      error: 'Failed to fetch news',
      timestamp: new Date().toISOString(),
    });
  }
}
