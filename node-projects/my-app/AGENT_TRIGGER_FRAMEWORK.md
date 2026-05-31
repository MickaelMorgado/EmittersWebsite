# Agent Decision Trigger Framework

## Overview

Event-driven agent system where each agent acts based on specific triggers rather than continuous polling.

## Agent Trigger Events

### 1. History Agent - **TRADE_INSERTED**
- **When:** New trade added to history
- **Triggers:** Analysis of trade outcome (WIN/LOSS)
- **Output:** Consistency metrics, R:R recommendations, milestone reports
- **Location:** `src/app/trading-bot/hooks/useAgentTriggers.ts`

### 2. Trend Agent - **STREAK_CHANGED**
- **When:** Win/loss streak changes
- **Triggers:** Direction determination (BUY/SELL/NEUTRAL)
- **Output:** Trend analysis, MA confirmations, strategy mode
- **Location:** `src/app/trading-bot/hooks/useAgentTriggers.ts`

### 3. Risk Agent - **DRAWDOWN_UPDATED** (Continuous)
- **When:** Drawdown or position count changes
- **Triggers:** Risk threshold monitoring
- **Output:** Position sizing, SL/TP adjustments
- **Location:** `src/app/trading-bot/hooks/useAgentTriggers.ts`

### 4. News Agent - **NEWS_FETCHED**
- **When:** News polled (5-min intervals)
- **Triggers:** Sentiment analysis, volatility assessment
- **Output:** Market impact assessment, headlines display
- **Location:** `src/app/trading-bot/hooks/useAgentTriggers.ts`

### 5. Master Agent - Manual Trigger
- **When:** All sub-agents evaluated
- **Triggers:** Decision gate (75% confidence threshold)
- **Output:** Final signal (BUY/SELL/NEUTRAL), execution decision
- **Location:** `src/app/trading-bot/hooks/useAgentTriggers.ts`

## Integration in Page Component

### Step 1: Import the event system
```typescript
import { useAgentEventSystem } from '@/app/trading-bot/hooks/useAgentEventSystem';
import { 
  emitTradeInserted, 
  emitStreakChanged, 
  emitDrawdownUpdated,
  emitNewsFetched 
} from '@/app/trading-bot/lib/agentEventDispatcher';
```

### Step 2: Initialize the system
```typescript
const { evaluateMasterDecision, getEventHistory } = useAgentEventSystem(
  (action) => {
    // Handle agent action
    addReport(action.agent, action.action, action.reasoning);
  },
  (decision) => {
    // Handle master decision
    console.log(`Master signal: ${decision.signal} (${decision.confidence}%)`);
  }
);
```

### Step 3: Emit events from data changes

**On new trade:**
```typescript
// In the trade stream handler
emitTradeInserted(newTrade, updatedHistory);
```

**On streak change:**
```typescript
// When longestWinStreak or longestLoseStreak changes
emitStreakChanged(winStreak, lossStreak, lastTradeWin);
```

**On drawdown update:**
```typescript
// When maxDrawdown or position count changes
emitDrawdownUpdated(currentDrawdown, maxDrawdown, openPositions.length);
```

**On news fetch:**
```typescript
// In fetchNews callback
emitNewsFetched(newsData.news, sentiment, volatility);
```

## Event Flow Example

```
User places trade
    ↓
Trade closes with LOSS
    ↓
[TRADE_INSERTED] → History Agent evaluates:
    - Latest trade: LOSS
    - Recent consistency: 60%
    - Streak broken
    ↓
[STREAK_CHANGED] → Trend Agent updates:
    - Loss streak: 2
    - Direction: NEUTRAL
    ↓
[DRAWDOWN_UPDATED] → Risk Agent monitors:
    - Drawdown: 15%
    - Position count: 1
    ↓
Master Agent evaluates (manually triggered):
    - Trend: 12pts
    - Risk: 25pts
    - News: 25pts
    - History: 10pts
    - Total: 72pts (GATE CLOSED - below 75%)
    ↓
Signal: NEUTRAL (insufficient confidence)
```

## Event History & Debugging

```typescript
// Get all events
const allEvents = getEventHistory();

// Get specific event type
const tradeEvents = getEventHistory('TRADE_INSERTED');

// View in console
console.table(allEvents);
```

## Benefits

✅ **Efficient:** Agents only run when relevant data changes  
✅ **Reactive:** System responds to actual events, not polling  
✅ **Debuggable:** Event history tracks all agent decisions  
✅ **Scalable:** Easy to add new agents with new event types  
✅ **Decoupled:** Agents don't need to know about each other  

## Files

- `src/app/trading-bot/hooks/useAgentTriggers.ts` - Agent trigger functions
- `src/app/trading-bot/lib/agentEventDispatcher.ts` - Event bus & emission helpers
- `src/app/trading-bot/hooks/useAgentEventSystem.ts` - Complete wired system
