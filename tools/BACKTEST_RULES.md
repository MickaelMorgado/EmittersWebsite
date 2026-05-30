# Backtesting System - Critical Rules & Features

## 🔴 CORE FEATURES (DO NOT REMOVE)

### 1. Next-Candle Entry Timing
- **Purpose**: Entries happen on NEXT candle OPEN, not current candle CLOSE (realistic trading)
- **Key Variables**:
  - `let pendingTrade = null;` (global scope, line ~1038)
  - `let tradeCount = 0;` (global scope, line ~1039)
- **Flow**:
  1. Candle X: CSID signal detected → `pendingTrade = { direction }`, `tradeCount = 0`
  2. Candle X+1: `executePendingTrade()` called → trades execute at candle OPEN price
- **Critical**: Signal detection MUST check trading hours BEFORE setting pendingTrade
- **Code Location**: CSID detection line ~3013 MUST have: `if ((bullishCSID || bearishCSID) && arrayOfSignals[EnumArrayOfSignalsIndex.TTR])`

### 2. Multi-Position Trading (3 Positions Per Trade)
- **Positions**: A (1.0R TP), B (0.7R TP), C (0.5R TP)
- **Per-Position TP Scaling**: Uses `tpMultiplier` field in preset config
- **SL Management**: 
  - Initial SL: 1R from entry (same for all positions)
  - Progressive SL movement: Every 0.5R profit increase
  - Trailing stop: Activated at position-specific threshold
- **Fields Required in Order**:
  - `lotMultiplier`, `slMoveStartR`, `trailingStartR`, `runToTP`, `tpMultiplier`
- **Code Location**: Multi-position creation in `executePendingTrade()` and order creation

### 3. Trading Hours Filter (9:50-11:00 Default)
- **Purpose**: Only allow entries within session time range
- **Variables**: `$sessionStartInput`, `$sessionEndInput`
- **Critical Function**: `inTradingTimeRange(d)` 
  - **MUST convert** MT5 date format (YYYY.MM.DD) to JS format (YYYY-MM-DD) using `.replaceAll('.', '-')`
  - Sets `arrayOfSignals[1] = true/false` based on time range
- **Instances**: 2 locations
  1. Grid search function (line ~160)
  2. SciChart backtest (line ~2776)
- **BOTH must be in sync with same date conversion logic**

### 4. Fast Mode Performance Optimization
- **Purpose**: Skip chart rendering, defer profitability calculation
- **Guard Pattern**: `if (!isFastMode) { ...chart operations... }`
- **Optimizations**:
  - Progress bar updated every 100 candles (not every candle)
  - Profitability calculation deferred to end of backtest (O(n²) → O(n))
  - All SciChart appends wrapped in `!isFastMode` check
  - Auto-visualize results after completion
- **Code Location**: Main backtest loop checks `$fastBacktestMode?.checked`

### 5. Signal Marker Positioning
- **Critical**: `timeToIndex` MUST be populated BEFORE `calculateIndicators()` in main loop
- **Order**:
  1. `updateDynamicInfos()` 
  2. `timeToIndex.set(unixTime, chartCandleIndex)` ← HAPPENS HERE
  3. `calculateIndicators()` ← Uses timeToIndex
- **Code Location**: Main backtest loop before calculateIndicators call

### 6. Trade Count Management Per Signal
- **Reset**: When new CSID signal detected → `tradeCount = 0`
- **Increment**: When `executePendingTrade()` executes → `tradeCount++`
- **Purpose**: Track trades within signal wave, prevent multiple entries on same signal
- **Locations**:
  - Line ~1039: Global declaration
  - Line ~2984: Reset on new signal
  - Line ~1138: Increment on execution

## ⚠️ COMMON PITFALLS

| Issue | Cause | Fix |
|-------|-------|-----|
| 1000+ trades in 6-7 days | TTR checked BEFORE being calculated for current candle | Move `inTradingTimeRange()` BEFORE `updateCSIDLineAnnotation()` in calculateIndicators |
| Trading hours check using stale value | updateCSIDLineAnnotation runs before inTradingTimeRange | In calculateIndicators: inTradingTimeRange MUST be first (line ~3422) |
| Days/months show 0 | Using `numbDays` which only increments in normal mode | Use `processedDays` instead (incremented in updateDynamicInfos, works in both modes) |
| pendingTrade/tradeCount undefined | Variables declared inside promise scope | Must be declared at global scope BEFORE Papa.parse() |
| Date filtering broken | MT5 format (dots) not converted to JS format | Use `.replaceAll('.', '-')` before creating Date objects |
| Grid search variables leak | Monthly loss tracking in main backtest | Remove `localCurrentMonth`, `localMonthlyPnl` checks from backtest functions |
| Signal markers all at start | timeToIndex populated AFTER calculateIndicators | Move timeToIndex.set() BEFORE calculateIndicators() call |
| Fast Mode slow | Profitability calculated every trade close | Defer to end of backtest, not per trade |

## 🔧 SCOPE RULES

| Variable | Scope | Declaration Line | Used By |
|----------|-------|------------------|---------|
| `pendingTrade` | Global | ~1038 | executePendingTrade, CSID detection |
| `tradeCount` | Global | ~1039 | executePendingTrade, CSID detection |
| `timeToIndex` | Global | ~883 | Chart positioning, signal markers |
| `ordersHistory` | Global | ~1026 | Trade management, backtest |
| `signalAnnotation` | Window (global) | Line after ~1601 | executePendingTrade (chart) |
| `arrayOfSignals` | Inside SciChart promise | ~1602 | Signal detection, trading rules |
| `inTradingTimeRange` | Inside SciChart promise | ~2776 | Called on every candle |

## 📝 KEY FUNCTIONS & LOCATIONS

- `executePendingTrade()` - Line ~1043 (GLOBAL, called in main loop)
- `inTradingTimeRange()` - Line ~2776 (inside promise, sets arrayOfSignals[1])
- `calculateIndicators()` - Line ~3180+ (runs always, even Fast Mode)
- `checkForTPSLHit()` - Line ~1703 (manages open orders)
- `CSID signal detection` - Line ~3013 (MUST check trading hours)

## ✅ CHECKLIST BEFORE CHANGES

- [ ] Signal detection checks trading hours? (`&& arrayOfSignals[EnumArrayOfSignalsIndex.TTR]`)
- [ ] Date format conversion present in inTradingTimeRange? (`.replaceAll('.', '-')`)
- [ ] timeToIndex populated BEFORE calculateIndicators?
- [ ] pendingTrade & tradeCount at global scope?
- [ ] Fast Mode guards in place? (`if (!isFastMode)`)
- [ ] No grid search variables in main backtest?
- [ ] Trade count reset on new signal?
