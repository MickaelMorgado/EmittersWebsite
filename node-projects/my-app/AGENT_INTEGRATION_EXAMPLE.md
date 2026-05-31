# Agent Trigger Framework - Integration Example

## Quick Start: Wire up the system in `page.tsx`

### 1. Add imports at the top

```typescript
import { useAgentEventSystem } from '@/app/trading-bot/hooks/useAgentEventSystem';
import { 
  emitTradeInserted, 
  emitStreakChanged, 
  emitDrawdownUpdated,
  emitNewsFetched 
} from '@/app/trading-bot/lib/agentEventDispatcher';
```

### 2. Initialize in component

```typescript
export default function TradingBotDashboard() {
  // ... existing state ...

  // Initialize agent event system
  const { evaluateMasterDecision } = useAgentEventSystem(
    (action) => {
      // Log agent action
      addReport(action.agent, action.action, action.data, action.reasoning);
    },
    (decision) => {
      // Handle master decision
      if (decision.signal !== 'NEUTRAL' && decision.confidence >= 0.75) {
        console.log(`✓ Executing ${decision.signal} signal`);
      }
    }
  );

  // ... rest of code ...
}
```

### 3. Emit events from your data streams

#### When new trade arrives (from stream):

```typescript
tradesSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    const newTrade = data.history[data.history.length - 1];
    
    setHistory(data.history || []);
    setStats(data.stats);

    // ✅ EMIT TRADE INSERTED EVENT
    emitTradeInserted(newTrade, data.history);

  } catch (error) {
    console.error('Failed to parse trades data:', error);
  }
};
```

#### When reports are computed (useMemo):

```typescript
const { pnlData, equityData, reports } = useMemo(() => {
  // ... existing calculation ...
  
  // After computing reports, check for streak change
  const prevStreak = agentLastRun.streak || {};
  if (prevStreak.win !== reports.longestWinStreak || 
      prevStreak.loss !== reports.longestLoseStreak) {
    
    // ✅ EMIT STREAK CHANGED EVENT
    emitStreakChanged(
      reports.longestWinStreak, 
      reports.longestLoseStreak,
      history[history.length - 1]?.result === 'WIN'
    );
  }

  // ✅ EMIT DRAWDOWN UPDATED EVENT
  emitDrawdownUpdated(
    reports.maxDrawdown,
    stats.totalPnl * 0.5, // Max threshold
    openPositions.length
  );

  return { pnlData, equityData, reports };
}, [history, ...deps]);
```

#### When news is fetched:

```typescript
const fetchNews = useCallback(async () => {
  try {
    const res = await fetch('/api/trading-bot/news');
    const data = await res.json();
    setLatestNews(data.news || []);

    // ✅ EMIT NEWS FETCHED EVENT
    const avgSentiment = calculateAverageSentiment(data.news);
    const avgVolatility = calculateAverageVolatility(data.news);
    
    emitNewsFetched(data.news, avgSentiment, avgVolatility);

    // Generate news agent report
    if (data.news.length > 0) {
      const topNews = data.news[0];
      addReport('news', `📰 ${topNews.title.substring(0, 60)}...`, { ... });
    }
  } catch (error) {
    console.error('Failed to fetch news:', error);
  }
}, [addReport]);
```

#### Manually trigger Master Agent decision:

```typescript
// In debug mode or when you want explicit evaluation
const triggerMasterEvaluation = useCallback(() => {
  // Calculate agent scores
  const trendScore = reports.longestWinStreak > 3 ? 25 : 12;
  const riskScore = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
  const newsScore = latestNews.length > 0 ? 25 : 15;
  const historyScore = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;

  // ✅ TRIGGER MASTER AGENT EVALUATION
  evaluateMasterDecision(trendScore, riskScore, newsScore, historyScore);
}, [reports, stats, latestNews]);
```

## Event Flow in Practice

```
Timeline of events during a trading session:

00:00 - User starts bot
  → All agents initialize with baseline data

00:05 - News polled
  [NEWS_FETCHED] → News Agent analyzes sentiment & volatility

02:30 - First trade closes as WIN
  [TRADE_INSERTED] → History Agent: Win streak: 1
  
03:15 - Second trade closes as WIN  
  [TRADE_INSERTED] → History Agent: Win streak: 2, Consistency: 100%
  [STREAK_CHANGED] → Trend Agent: Still NEUTRAL (need >3)

04:00 - Third trade closes as WIN
  [TRADE_INSERTED] → History Agent: Win streak: 3, Consistency: 100%
  [STREAK_CHANGED] → Trend Agent: Direction: BUY (streak > 3)

04:30 - Position opens
  [DRAWDOWN_UPDATED] → Risk Agent: Position count: 1

05:00 - News polled again
  [NEWS_FETCHED] → News Agent: Bullish sentiment detected

05:15 - Master evaluation triggered
  Trend: 25 (BUY signal) + Risk: 25 + News: 25 + History: 20 = 95%
  → Gate OPEN → Signal: BUY executed
```

## Testing the Events

### In browser console:

```javascript
// Get event history
const history = agentEventDispatcher.getHistory();
console.table(history);

// Get specific event type
const tradeEvents = agentEventDispatcher.getHistory('TRADE_INSERTED');
console.table(tradeEvents);

// Count listeners
console.log(agentEventDispatcher.listenerCount('TRADE_INSERTED')); // Should be 1
```

## Benefits of This Approach

| Before (Polling) | After (Event-Driven) |
|---|---|
| Agents check every tick | Agents only run on relevant events |
| Continuous calculations | On-demand calculations |
| Hard to debug flow | Clear event history |
| Wasteful resources | Efficient & responsive |

## Next Steps

1. Add the integration code to `page.tsx`
2. Test event emissions in browser console
3. Verify agent reports are generated
4. Monitor event history for debugging
5. Fine-tune event timing as needed
