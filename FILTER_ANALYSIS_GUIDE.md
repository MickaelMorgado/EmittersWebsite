# Trade Filter Analysis Guide

## Overview

This analysis tool examines all your closed trades and compares them against the market conditions at entry to identify which market patterns correlate with wins vs losses. By analyzing these patterns, you can create **trading filters** that automatically reject low-probability trades.

## How It Works

### 1. **Data Enrichment**
For each trade, the system captures:
- **Entry Candle Properties**: Size, direction (bull/bear), range
- **Entry Market Conditions**: Volatility (5-candle average), trend structure, momentum
- **Trade Result**: Win/Loss/Breakeven
- **Time of Entry**: Hour and minute

### 2. **Pattern Analysis**
The analysis groups trades by different market conditions and calculates:
- Win rate for each condition
- Number of trades in each condition
- Which conditions are favorable vs unfavorable

### 3. **Filter Suggestions**
Based on significant win rate variations, the tool suggests specific filters with:
- Description of what to filter
- Why it matters (the pattern found)
- How to implement it in code
- Expected impact (trades eliminated)

---

## Key Analysis Sections

### 📊 Candle Size Analysis
**What it measures**: Win rate by the size of the candle at entry

**Why it matters**:
- Small candles = low volatility, weak momentum at entry
- Large candles = high volatility, strong momentum, clearer direction
- Strategy may work better/worse with specific candle sizes

**Filter suggestion threshold**: If one category wins >40% more than another

**Implementation**: Add a candle size check before confirming entry
```javascript
// Example: Only trade on candles larger than 0.0003
const candleSize = Math.abs(entryCandle.close - entryCandle.open);
if (candleSize < 0.0003) {
  rejectTrade('Candle too small');
}
```

---

### 📈 Volatility Analysis
**What it measures**: Win rate during different market volatility periods

**Why it matters**:
- Low volatility periods: Choppy, indecisive market - harder to profit
- High volatility periods: Clear direction, strong moves - better for trend following
- ATR/volatility filters are classic and proven

**Filter suggestion threshold**: If volatility win rates differ by >15%

**Implementation**: Calculate rolling volatility and only trade during favorable periods
```javascript
// Example: Only trade when volatility is in the medium-high range
const volatility = calculateATR(14);
if (volatility < lowVolThreshold || volatility > highVolThreshold) {
  rejectTrade('Volatility outside optimal range');
}
```

---

### 📌 Trend Structure Analysis
**What it measures**: Win rate by market structure (uptrend/downtrend/range)

**Why it matters**:
- Uptrends: Higher highs and higher lows - easier to catch winners
- Downtrends: Lower highs and lower lows - mean reversion may work better
- Ranges: No clear direction - choppy, whipsaws likely

**Filter suggestion threshold**: If one trend type wins >40% more than others

**Implementation**: Check for higher highs/lows before taking trades
```javascript
// Example: Only trade in uptrends
const isUptrend = currentHigh > previousHigh && currentLow > previousLow;
if (!isUptrend) {
  rejectTrade('Not in uptrend');
}
```

---

### 🕯️ Entry Candle Direction Analysis
**What it measures**: Win rate when entering on bull vs bear candles

**Why it matters**:
- Some strategies work better entering on the candle direction matching the signal
- Or opposite (contrarian)
- Alignment with candle direction improves conviction

**Filter suggestion threshold**: If bull/bear entry win rates differ by >12%

**Implementation**: Validate entry candle direction matches signal
```javascript
// Example: Only take bull signals if the entry candle was bullish
if (signalDirection === 'BULL' && entryCandleDirection !== 'BULL') {
  rejectTrade('Entry candle direction mismatch');
}
```

---

### ⏰ Time of Day Analysis
**What it measures**: Win rate by trading hour (9am, 10am, 11am, etc.)

**Why it matters**:
- Different hours have different liquidity and volume patterns
- Asian hours vs London hours vs NY hours have different characteristics
- Some strategies only work during certain sessions

**Filter suggestion threshold**: If best/worst hour has >10% win rate difference

**Implementation**: Only trade during best hours
```javascript
// Example: Only trade between 9:50-11:00 AM (your configured window)
const hour = getHourFromTime(currentTime);
const minute = getMinuteFromTime(currentTime);
if (hour < 9 || (hour === 11 && minute > 0)) {
  rejectTrade('Outside optimal trading hours');
}
```

---

## How to Use the Analysis Dashboard

### Step 1: Run Your Backtest
1. Load your CSV data
2. Configure your strategy parameters
3. Run the backtest
4. Let it complete (you should see 1320+ trades)

### Step 2: Open the Analysis Dashboard
Open `/tools/filter-analysis-dashboard.html` in your browser

### Step 3: Click "Analyze Trades"
The tool will:
1. Extract all 1320 closed trades
2. Look up market conditions at each trade's entry time
3. Calculate win rates for each condition
4. Generate filter suggestions

### Step 4: Review the Results
The dashboard shows:
- **Summary**: Total trades, win count, current win rate
- **Charts**: Visual comparison of win rates by condition
- **Suggested Filters**: Ranked by impact potential

### Step 5: Implement Filters
Start with HIGH priority filters:
1. Add the filter logic to `executePendingTrade()` or `detectSignal()`
2. Re-run the backtest
3. Note the trade count decrease
4. Check if win rate improved

---

## Understanding Filter Suggestions

### Example: "Filter out small candle entries"
- **Type**: CANDLE_SIZE_FILTER
- **Current Situation**: Small entry candles have 28% win rate
- **Expected Improvement**: Eliminates ~120 losing trades
- **Implementation**: Before confirming trade entry, check candle size

### Example: "Only trade during uptrends"
- **Type**: TREND_FILTER
- **Current Situation**: Uptrend trades have 42% win rate, downtrend only 31%
- **Expected Improvement**: Eliminates ~180 downtrend trades
- **Implementation**: Add trend structure validation

---

## Priority Levels

### 🔴 HIGH Priority
- Large win rate variations (>15% difference)
- Would eliminate 50+ trades
- Quick to implement
- High confidence filter

**Recommended**: Implement these first, one at a time

### 🟡 MEDIUM Priority
- Moderate win rate variations (5-15% difference)
- Would eliminate 20-50 trades
- May require additional logic
- Good for fine-tuning

**Recommended**: Implement after HIGH priority filters

### 🟢 LOW Priority
- Small win rate variations (<5% difference)
- Would eliminate <20 trades
- Marginal impact
- Good for optimization

**Recommended**: Only after other filters are working well

---

## Important Implementation Notes

### 1. **Order Matters**
Add filters in this order:
1. Time of Day (easiest to implement)
2. Volatility (uses existing data)
3. Trend Structure (requires history)
4. Candle Size (already calculated)
5. Entry Direction (simple check)

### 2. **Test Incrementally**
- Add ONE filter at a time
- Run backtest
- Note the impact
- Then add the next filter

### 3. **Expected Results**
If you implement filters correctly:
- Trade count will decrease (fewer trades entered)
- Win rate should increase (bad trades filtered out)
- Profit factor may improve significantly

### 4. **Example: Starting Filter Implementation**

In `executePendingTrade()`, before confirming trade entry:

```javascript
// Filter 1: Time of Day
const entryHour = parseInt(currentTime.split(' ')[1].split(':')[0]);
if (entryHour < 10 || entryHour > 11) {
  console.log('[FILTER] Entry outside 10:00-11:00 window');
  pendingTrade = null;
  return;
}

// Filter 2: Minimum Candle Size
const candleSize = Math.abs(entryCandle.close - entryCandle.open);
if (candleSize < 0.00025) {
  console.log('[FILTER] Candle too small for entry');
  pendingTrade = null;
  return;
}

// Filter 3: Volatility Check
const avgVolatility = calculateRecentVolatility(5);
if (avgVolatility < 0.00015 || avgVolatility > 0.001) {
  console.log('[FILTER] Volatility outside optimal range');
  pendingTrade = null;
  return;
}

// If all filters pass, continue with trade entry...
```

---

## Common Questions

### Q: Will adding filters reduce my profit?
**A**: Short term yes (fewer trades). But if the trades you're eliminating are losers, profit factor should improve. Your total $ profit may go down, but your win rate and risk-adjusted returns (Sharpe ratio) should go up.

### Q: Should I implement all filters?
**A**: No. Start with HIGH priority filters only. Each filter removes certain types of trades. Too many filters may eliminate good trades too.

### Q: How do I know if a filter is working?
**A**: 
- Trade count decreases
- Win rate increases
- Profit factor improves
- If not, the filter isn't helping - remove it

### Q: What if no filters are suggested?
**A**: The signal itself is the limiting factor. Consider:
1. Improving CSID signal detection
2. Adding moving average confirmation
3. Adjusting TP/SL ratios

---

## Next Steps

1. **Run the analysis** on your current backtest results
2. **Review suggested filters** - note which ones have HIGH priority
3. **Pick the easiest filter** (usually time-of-day)
4. **Implement it** in your code
5. **Re-run backtest** and compare
6. **Repeat** with next filter

Good luck! This analysis should help you turn a -$3716 losing strategy into a breakeven or profitable one.
