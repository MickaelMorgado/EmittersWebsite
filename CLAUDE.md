# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚀 QUICK START - Run These 3 Commands First

Open 3 terminal windows and run these **in parallel**. Copy + paste the full lines:

```bash
# Terminal 1 - Ollama LLM Server (no path needed)
ollama serve

# Terminal 2 - Next.js Dashboard (copy entire line)
cd /Users/mickael/development/EmittersWebsite/node-projects/my-app && npm run dev

# Terminal 3 - File Sync Watchdog (copy entire line)
cd /Users/mickael/development/MikaBot && python3 sync-trades.py
```

✅ **Done?** Access dashboard at: **http://localhost:3000**

---

## Project Overview

**Master Agent Trading System**: An AI-driven algorithmic trading platform that integrates a Next.js web dashboard with MetaTrader 5 Expert Advisor (EA). The system uses local Ollama LLM for real-time trading decisions while enforcing strict risk management via a gatekeeper Risk Agent.

**Core Purpose**: Automate trading decisions using three independent AI agents (Trend, History, Risk) that must all approve before a trade executes.

---

## Architecture Overview

### Agent-Based Decision Framework

The system uses **four agents** in a hierarchical decision chain:

1. **Trend Agent** (`/api/trading-bot/agents/trend/route.ts`)
   - Reads MA data from EA (ma_data.json)
   - Detects 3-MA crossovers (Fast=9, Medium=21, Slow=50)
   - Returns TrendSignal with: direction, confidence, MA values, crossover status
   - Entry only allowed if crossover_detected=true ("Crossover is King")

2. **History Agent** (`/api/trading-bot/agents/history/route.ts`)
   - Reads trade history (trades.json)
   - Calculates: win_rate, profit_factor, avg_win, avg_loss
   - Recommends R:R ratio based on current market regime
   - Output: history_recommendation.json

3. **Risk Agent** (`/api/trading-bot/agents/risk/route.ts`)
   - **GATEKEEPER**: Approves or rejects ALL trades
   - Enforces daily loss limit (5% equity), monthly limit (10%), max 5 open positions
   - Calculates: position_size, stop_loss_pips, take_profit_pips
   - Uses R:R ratio from History Agent to determine TP distance
   - Output: risk_decision.json

4. **Master Agent** (orchestrator in signal endpoint)
   - Calls Trend Agent → History Agent → Risk Agent in sequence
   - Only executes if ALL agents approve
   - Writes signal.txt to EA with: signal, stopLossPips, takeProfitPips, positionSize

### Data Flow

```
EA (MQL5)
├─ Calculates: 3 MAs, detects crossovers every tick
├─ Writes: ma_data.json (crossover detection), positions.json, trades.json
└─ Reads: signal.txt (trade instructions)

sync-trades.py (100ms polling)
└─ Syncs: trades.json, positions.json, ma_data.json (MT5 UTF-16 LE → Mac UTF-8)

Dashboard (Next.js)
├─ Trend Card: Displays MA9/MA21/MA50 values, crossover status, MA50 trend
├─ Open Positions Card: Shows entry price, lot size, SL, TP, floating P&L
├─ Signal Endpoint: Orchestrates all agents
└─ Displays real-time agent decisions and portfolio state
```

---

## 3-MA Crossover System (Critical)

The EA uses **three moving averages** for trend detection:

| MA | Period | Purpose |
|----|--------|---------|
| MA9 (Fast) | 9 | Entry signal trigger |
| MA21 (Medium) | 21 | Confirmation |
| MA50 (Slow) | 50 | Trend bias / overall direction |

### Crossover Detection Logic

**Key Rule**: Compare **completed candles only** [2] vs [1], never use forming candle [0]

```mql5
// In EA: DetectMACrossover() function
ma_fast[0]   = current forming candle (DO NOT USE)
ma_fast[1]   = most recent COMPLETED candle (use for crossover)
ma_fast[2]   = previous COMPLETED candle (compare against [1])

Crossover UP:   ma_fast[2] < ma_medium[2] AND ma_fast[1] >= ma_medium[1]
Crossover DOWN: ma_fast[2] > ma_medium[2] AND ma_fast[1] <= ma_medium[1]
```

**Why**: Prevents false signals on forming candles that could reverse before close.

### MA50 Trend Determination

```
IF price > ma_50: "Uptrend"
IF price < ma_50: "Downtrend"
IF price ≈ ma_50: "Neutral"
```

---

## File Protocols & Data Files

### From EA (Written every tick)

**ma_data.json** - Moving Average data with crossover detection
```json
{
  "timestamp": "2026-05-31T11:29:00Z",
  "symbol": "BTCUSD",
  "price": 45240.12345,
  "ma_fast": 45250.50,
  "ma_medium": 45180.25,
  "ma_slow": 45100.00,
  "ma_fast_period": 9,
  "ma_medium_period": 21,
  "ma_slow_period": 50,
  "crossover_detected": true,
  "crossover_direction": "UP"
}
```

**positions.json** - Currently open positions
```json
{
  "openPositions": [
    {
      "id": "pos_1",
      "type": "BUY",
      "entryPrice": 45240.12345,
      "currentPrice": 45280.00,
      "stopLoss": 45140.12345,
      "takeProfit": 45390.12345,
      "volume": 0.02,
      "profit": 79.88,
      "time": "2026-05-31 11:29"
    }
  ]
}
```

**trades.json** - Closed trades history
```json
{
  "history": [
    {
      "id": "trade_1",
      "type": "BUY",
      "openTime": "2026-05-31T10:00:00Z",
      "closeTime": "2026-05-31T11:00:00Z",
      "openPrice": 45200.00,
      "closePrice": 45300.00,
      "profit": 100.0,
      "volume": 0.01,
      "result": "WIN"
    }
  ]
}
```

**signal.txt** - Instructions from dashboard to EA (Mac UTF-8 → EA UTF-16 LE)
```
BUY|50|200|0.02
```
Format: `SIGNAL|SL_PIPS|TP_PIPS|POSITION_SIZE`

### Generated Outputs

**trend_signal.json** - Trend Agent decision
```json
{
  "timestamp": "2026-05-31T11:29:00Z",
  "symbol": "BTCUSD",
  "direction": "BUY",
  "confidence": 87,
  "price": 45240.12345,
  "ma_9": 45250.50,
  "ma_21": 45180.25,
  "ma_50": 45100.00,
  "ma_50_trend": "Uptrend",
  "crossover_status": "UP",
  "entry_allowed": true,
  "trend_strength": "Strong",
  "reasoning": "..."
}
```

**history_recommendation.json** - History Agent recommendation
```json
{
  "rr_ratio": "1:3",
  "profit_factor": 2.15,
  "win_rate": 62,
  "recommendation": "..."
}
```

**risk_decision.json** - Risk Agent approval
```json
{
  "approved": true,
  "position_size": 0.02,
  "stop_loss_pips": 50,
  "take_profit_pips": 150,
  "rejection_reason": null,
  "current_daily_loss": -45.50,
  "current_monthly_loss": -120.00
}
```

---

## API Endpoints

### Agent Endpoints (All POST)

| Endpoint | Input | Output | Purpose |
|----------|-------|--------|---------|
| `/api/trading-bot/agents/trend` | ma_data.json | trend_signal.json | Detect trend & crossovers |
| `/api/trading-bot/agents/history` | trades.json | history_recommendation.json | Analyze past performance |
| `/api/trading-bot/agents/risk` | signal, rr_ratio, history_sl_pips | risk_decision.json | Approve/reject trade |
| `/api/trading-bot/signal` | (orchestrator) | risk_decision.json | Master Agent pipeline |

### Utility Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trading-bot/positions` | GET | Fetch open positions |
| `/api/trading-bot/trades` | GET | Fetch trade history |

---

## Risk Management Rules (Enforced by Risk Agent)

```
1. Daily Loss Limit:  max -5% of equity per day
2. Monthly Loss Limit: max -10% of equity per month
3. Max Open Positions: 5 concurrent trades
4. Position Sizing: (equity × 0.02 max_risk) / (sl_pips × pip_value)
5. SL/TP Calculation: Use R:R ratio from History Agent
   - TP pips = SL pips × (RR denominator / RR numerator)
   - Example: 1:3 ratio with 50 SL = 150 TP
```

---

## Technology Stack

| Component | Tech | Details |
|-----------|------|---------|
| Dashboard | Next.js 14 | React server/client components |
| Backend | Node.js API routes | Serverless functions |
| LLM | Ollama (local) | llama2:7b or better |
| EA | MQL5 | MetaTrader 5 Expert Advisor |
| Sync | Python 3 | 100ms polling watchdog |
| Styling | Tailwind CSS | Utility-first CSS |

---

## Setup & Configuration

### Environment Variables

**`.env.local`** (Next.js):
```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2:7b
OPENAI_API_KEY=xxx  # Optional fallback
OPENROUTER_API_KEY=xxx  # Optional fallback
HOME=/Users/mickael  # Required for file paths
```

### Full Setup (One-Time Only)

```bash
# 1. Pull Ollama model (run once)
ollama pull llama2:7b

# 2. Install dashboard dependencies (run once or after package.json changes)
cd /Users/mickael/development/EmittersWebsite/node-projects/my-app
npm install

# 3. Load EA in MetaTrader 5 (manual step)
# Path: /Users/mickael/development/MikaBot/GeneratedEA_MasterAgent.mq5
# Attach to BTCUSD chart
```

### File Paths (macOS)

| File | Location |
|------|----------|
| Dashboard | `/Users/mickael/development/EmittersWebsite/node-projects/my-app` |
| EA & Data | `/Users/mickael/development/MikaBot/` |
| Sync Script | `/Users/mickael/development/MikaBot/sync-trades.py` |

---

## Common Development Tasks

### Build & Run

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npm run typecheck
```

### Testing Agents

```bash
# Test Trend Agent directly
curl -X POST http://localhost:3000/api/trading-bot/agents/trend \
  -H "Content-Type: application/json"

# Test Risk Agent
curl -X POST http://localhost:3000/api/trading-bot/agents/risk \
  -H "Content-Type: application/json" \
  -d '{"signal":"BUY","confidence":87,"rr_ratio":"1:3"}'

# Test full signal pipeline
curl -X POST http://localhost:3000/api/trading-bot/signal \
  -H "Content-Type: application/json"
```

### Debugging

- **Console logs**: Check browser DevTools for dashboard, terminal for Next.js server
- **Agent logs**: Terminal running `npm run dev` shows `[TREND AGENT]`, `[RISK AGENT]`, etc.
- **File sync logs**: Watch terminal running `sync-trades.py` for sync events
- **EA logs**: MetaTrader 5 Expert tab shows EA execution logs

### Updating Trend Agent Display

The Trend Agent card shows:
- **MA9 / MA21 / MA50**: Current MA values
- **Crossover Status**: UP (↑), DOWN (↓), or NONE (—)
- **MA50 Trend**: Uptrend, Downtrend, or Neutral
- **Entry Allowed**: Yes if crossover detected, No otherwise

Update file: `/src/app/trading-bot/components/agents/TrendAgentCard.tsx`

---

## Key Implementation Details

### AI Provider Chain (Unified chatAI Function)

Located in `/src/lib/ai.ts`:

```typescript
// Force Ollama for agents
await chatAI(prompt, { provider: 'ollama', temperature: 0.3 })

// Fallback chain for general use
await chatAI(prompt)  // Tries: OpenAI → OpenRouter → Ollama
```

### JSON Parsing from LLM Responses

```typescript
parseJSON<T>(response: string): T | null
```

Handles:
1. Direct JSON parse
2. Markdown code blocks (```json...```)
3. Embedded JSON objects (extracts between { and })

### Risk Agent as Gatekeeper

Risk Agent is called **before** writing signal.txt:
1. Trend Agent approves → Sends to Risk Agent
2. Risk Agent checks: daily loss, monthly loss, position count, calculates size
3. **If Risk rejects**: signal.txt is NOT written, trade blocked
4. **If Risk approves**: signal.txt written with Risk-calculated SL/TP/size

---

## Important Notes for Future Development

1. **Crossover Detection**: Always compare completed candles [2] vs [1]. Never use forming candle [0].
2. **File Encoding**: MT5 writes UTF-16 LE; sync script converts to UTF-8. Keep sync-trades.py encoding logic intact.
3. **Ollama Fallback**: If Ollama unavailable, system falls back to OpenAI/OpenRouter.
4. **Risk Agent is Final Authority**: Even if Trend wants to trade, Risk Agent can veto based on portfolio state.
5. **SL/TP from Risk**: Don't hardcode SL/TP in EA; receive from signal.txt written by Risk Agent.
6. **Position Sync**: positions.json must include: entryPrice, stopLoss, takeProfit, volume, profit for dashboard display.

---

## Branch Information

- **Active Branch**: `bot` (ahead of main by ~48 commits)
- **Recent Changes**: Trend Agent MA display updates, console logging improvements
- **Pending**: Occasional network issues on git push (proxy-related); commits are safe locally
