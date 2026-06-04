# MikaBot Dashboard

AI trading bot performance analytics and self-learning system.

## Overview

| Attribute | Value |
|-----------|-------|
| **Route** | `/trading-bot` |
| **Type** | Private (requires auth) |
| **Stack** | Next.js + React |
| **Data Source** | FileSignalEA (MT5) |
| **AI Provider** | OpenRouter (free model chain) for trade-analysis notes |
| **Version** | my-app 1.2.1 (2026-06-04) |

## Features

- Real-time trade execution monitoring
- Performance analytics (win rate, P&L, streak)
- Trade history with entry/exit prices
- AI-powered insights and pattern detection via the **Learning Board**
- Recommendations for strategy improvements

## Data Flow

```
MT5 (Wine/Mac)
    ↓ trades
FileSignalEA.mq5
    ↓ logs
Python signal script → JSON file
    ↓ reads
API endpoint → Dashboard UI
```

## AI Insights Engine

The trade-analysis flow lives at `src/app/api/trading-bot/report-history/route.ts` and produces three note streams, all running on **OpenRouter** (free model chain, see `systemPatterns.md` → AI Provider Layer):

- **50-trade tactical notes** (`50-trade-notes.json`) — every 50 trades, 4 actionable improvements targeting the most recent 50 trades.
- **500-trade strategic notes** (`500-trade-notes.json`) — every 500 trades, 3 high-level strategic improvements.
- **Global recommendation** (`global-recommendation.json`) — synthesised from both 50-trade and 500-trade items into one master recommendation + 3–4 key insights, regenerated whenever a 50- or 500-cycle fires.

The 50- and 500-trade generators each return 4 / 3 items as a JSON array with `{id, content, action}` (where `action ∈ {add, update, deprecate}`). The endpoint writes the new cycle into the corresponding notes file.

### `mergeNoteUpdates` consolidation

`mergeNoteUpdates(previousItems, updates)` is the merger that keeps note history consistent across cycles:

1. **Malformed-item filter** — drops any prior item whose `content` itself looks like raw JSON (e.g. matches `{"id":` / `[{` / `"action":"add"`), so corrupted legacy entries do not propagate into the active set.
2. **Action handling**:
   - `add` — pushes a new item with fresh `id`, `addedAt`, `lastUpdatedAt`, `status: 'active'`.
   - `update` — finds the existing item by `id` (or by content prefix) and replaces its `content`, refreshing `lastUpdatedAt`.
   - `deprecate` — finds the existing item and marks `status: 'deprecated'`, refreshing `lastUpdatedAt`.
   - **Unknown action** — defaults to `add` (the update is preserved as a new active item rather than silently dropped).

The result is appended back into the on-disk notes file; the dashboard's "Learning Board" view renders the active subset.

## Related Projects

- **MikaBot** (`~/development/MikaBot/`) - Trading bot source code
- **FileSignalEA** - MT5 EA that executes trades based on signals

## Future Enhancements

- Connect to live trade data via shared file
- Ollama integration for AI analysis (currently in code as a third provider, not used by this flow)
- Pattern recognition engine
- Strategy optimizer
