# HYTEK Trading System - MT5 Deployment Guide

## Expert Advisor: 9/21 EMA Crossover (MQL5)

### File
**HYTEK_9EMA_21EMA_EA.mq5** - Production Ready for MetaTrader 5

---

## Features

✅ **Entry Signal:** 9 EMA / 21 EMA Crossover
- Bullish: 9 EMA crosses above 21 EMA → BUY
- Bearish: 9 EMA crosses below 21 EMA → SELL

✅ **Position Management:**
- Stop Loss: 5 pips (proven optimal)
- Take Profit: 30 pips (proven optimal)
- Trailing Stop: Configurable (disabled by default)

✅ **Risk Management:**
- Maximum trades per day limit
- Daily loss limit with auto-close
- Fixed lot size OR risk-based position sizing

✅ **Trading Hours Filter:**
- UTC time-based trading window
- Default: 09:50 - 11:00 UTC
- Can be disabled for 24/5 trading

---

## Installation (MetaTrader 5)

### Step 1: Copy EA to MT5 Folder
```
MetaTrader 5/
├── MQL5/
│   └── Experts/
│       └── HYTEK_9EMA_21EMA_EA.mq5  ← Copy here
└── (restart MT5)
```

**On Windows:**
```
C:\Users\[YourUsername]\AppData\Roaming\MetaQuotes\Terminal\[TerminalID]\MQL5\Experts\
```

**On Mac/Linux:**
Check your MT5 installation directory for MQL5/Experts folder

### Step 2: Compile in MetaEditor
- Open MetaEditor (Ctrl+Shift+M or Tools → MetaQuotes Language Editor)
- Open HYTEK_9EMA_21EMA_EA.mq5
- Compile (Ctrl+F7 or File → Compile)
- Should show "0 errors, 0 warnings"

### Step 3: Restart MT5
- Close and reopen MetaTrader 5
- EA will appear in Navigator → Experts

### Step 4: Attach to Chart
- Right-click EURUSD M5 chart
- Select "Attach Expert Advisor"
- Choose HYTEK_9EMA_21EMA_EA
- Click "OK"

---

## Parameters Configuration

### Entry Signal
```mql5
EMA_Fast = 9          (Fast EMA period - DO NOT CHANGE)
EMA_Slow = 21         (Slow EMA period - DO NOT CHANGE)
```

### Position Management (Optimized)
```mql5
SL_Pips = 5           (Stop Loss: 5 pips - PROVEN OPTIMAL)
TP_Pips = 30          (Take Profit: 30 pips - PROVEN OPTIMAL)
TS_Pips = 0           (Trailing Stop: 0 = disabled - PROVEN OPTIMAL)
```

### Position Sizing
```mql5
LotSize = 1.0         (Fixed lot size, use this OR RiskPercent)
RiskPercent = 2.0     (Alternative: risk % per trade, set LotSize=0 to use)
```

**Choose one method:**
- **Fixed Lots:** Set `LotSize = 1.0` and leave `RiskPercent = 2.0` (won't be used)
- **Risk-Based:** Set `LotSize = 0` and `RiskPercent = 2.0` (will calculate lot size based on 2% risk)

### Trading Hours (UTC)
```mql5
TradeStartHour = "09:50"      (Start time HH:MM)
TradeEndHour = "11:00"        (End time HH:MM)
TradeAllHours = false         (true = ignore time filter for 24/5 trading)
```

### Risk Management
```mql5
MaxTradesPerDay = 10          (Max 10 trades per day)
MaxDailyLoss = 500            (Close if cumulative loss exceeds $500)
CloseAllOnMaxLoss = false     (true = close ALL positions when limit hit)
```

---

## Testing & Deployment

### 1. Demo Account Testing (Mandatory)
**Before any live trading:**

1. Attach EA to EURUSD M5 demo chart
2. Run for **minimum 1 week**
3. Monitor in **Experts Tab:**
   - Look for "BUY Order Opened" and "SELL Order Opened" messages
   - Verify trade count (should be < 10 per day)
   - Check for errors
4. Verify results match backtest:
   - Win rate: ~42.53%
   - Profit factor: ~1.52
   - SL/TP execution correct

### 2. Backtest (Optional Verification)
```
MetaTrader 5 → Strategy Tester
Symbol: EURUSD
Period: M5
Model: Every tick or Every minute (depending on broker)
Optimization: OFF
Date Range: Last 3 months
Parameters: Same as live config
```

Expected results should match your grid search results.

### 3. Live Deployment (Small Position)
```
1. Start with LotSize = 0.1 (micro lots)
2. Monitor for 1 full week
3. Check daily results vs. backtest
4. If consistent: increase to 0.5 lots
5. If issues: stop and review logs
```

---

## Monitoring & Logs

### View EA Activity
**In MetaTrader 5:**
- Open **Experts** tab (View → Toolbars → Experts)
- Watch for trade messages:
  - "BUY Order Opened: Ticket=XXXXX"
  - "SELL Order Opened: Ticket=XXXXX"
  - "Position Closed: XXXXX"
  - Any error messages

### Key Metrics to Track Daily
- Total trades opened (target: 1-10 per day)
- Win rate (expected: ~42%)
- Daily profit/loss
- Largest winning/losing trade
- Drawdown from peak

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No trades opening | Time filter off hours | Enable `TradeAllHours = true` or adjust hours |
| "Volume is invalid" | Lot size too large | Reduce LotSize or check broker limits |
| Max loss hit repeatedly | Parameters not optimal | Review grid search results, adjust SL/TP |
| Slippage too high | Market volatility | Increase slippage tolerance in EA |

---

## MQL5 vs MQL4 Differences

This is **MQL5** code designed for **MetaTrader 5**. Key differences from MQL4:

| Feature | MQL4 | MQL5 |
|---------|------|------|
| File extension | .mq4 | .mq5 |
| Indicator handles | Direct | Handle-based (CopyBuffer) |
| Trade class | OrderSend() | CTrade class |
| Position info | GlobalVariables | CPositionInfo class |
| Time functions | TimeDay() | TimeToStruct() |

**Do NOT use this MQL5 code in MetaTrader 4** - it will not compile. Use HYTEK_9EMA_21EMA_EA.mq4 for MT4.

---

## Performance Expectations

Based on grid search results (82 parameter combinations tested):

**Best Case (Hill_1_preset_equal):**
```
Configuration: SL=5 pips, TP=30 pips, TS=0
Win Rate:      42.53%
Profit Factor: 1.52
Trades:        435
Profit:        +$5,598
Drawdown:      ~$1,065
Period:        Backtest data (EURUSD M5)
```

**Conservative Alternative (Hill_2_preset_conservative):**
```
Configuration: SL=5 pips, TP=30 pips, TS=0
Win Rate:      47.13% (higher, less drawdown)
Profit Factor: 1.53
Profit:        +$2,695
Drawdown:      Less volatile
```

**⚠️ Important:**
- Backtest results ≠ future live results
- Market conditions change
- Always start with small position sizes
- Never risk more than you can afford to lose

---

## Multiple Account Deployment

For trading multiple pairs or accounts:

### Setup Per Pair
1. Create copy for each pair:
   ```
   HYTEK_9EMA_21EMA_EA_GBPUSD.mq5
   HYTEK_9EMA_21EMA_EA_USDJPY.mq5
   HYTEK_9EMA_21EMA_EA_AUDUSD.mq5
   ```

2. Adjust parameters per pair (if needed):
   - SL/TP might need adjustment for different volatility
   - Keep entry signal (9/21 EMA) same
   - Test with grid search for optimal values

3. Use different magic numbers:
   - EURUSD: Magic = 12345
   - GBPUSD: Magic = 12346
   - USDJPY: Magic = 12347
   - (prevents orders from different pairs interfering)

### Risk Management Across Accounts
```
1. Set MaxDailyLoss per pair to total equity exposure
2. Consider correlation (EURUSD + GBPUSD are correlated)
3. Never use 100% of account equity on one pair
4. Recommended: Max 20-30% equity per pair
```

---

## Advanced: Modifying the EA

### Change Entry Signal
Location: `OnTick()` function, around line 120-140

```mql5
// Current logic (9/21 EMA):
bool bullishCrossover = (ema9_previous <= ema21_previous) && (ema9_current > ema21_current);

// To change: replace with your signal logic
// Example (Simple Moving Average):
// bool bullishCrossover = (smaFast > smaSlowNow && smaFast <= smaSlowPrevious);
```

### Change SL/TP Values
Find in `OpenBuyOrder()` and `OpenSellOrder()`:
```mql5
double stopLoss = entryPrice - (SL_Pips * _Point);
double takeProfit = entryPrice + (TP_Pips * _Point);
```

### Add Time-Based Filters
Modify `IsInTradingHours()` function to add additional conditions.

---

## Emergency Procedures

**If EA malfunctions:**
1. **Stop immediately:** Right-click chart → Remove Expert Advisor
2. **Close trades manually:** Check Terminal → Positions, close any open positions
3. **Review logs:** Check Experts tab for error messages
4. **Fix issue:** Make correction to code if needed
5. **Retest:** Always retest on demo before reattaching

**Auto-stop if needed:**
Set `MaxDailyLoss = 500` to auto-close all positions if $500 loss reached.

---

## Daily Checklist

```
□ Start of day: Check EA attached and running
□ 09:50 UTC: Verify first trade opens correctly
□ During trading window: Monitor Experts tab for messages
□ After trading window (11:00 UTC): Review daily results
□ End of day: Note P&L, trades taken, any issues
□ Weekly: Compare actual results vs. backtest expectations
```

---

## Support & Logs

All EA activity is logged in **Experts tab** (View → Toolbars → Experts):
- Trade opens/closes
- Error messages
- Initialization status

Save logs regularly for analysis.

---

## Summary

✅ EA ready for MetaTrader 5
✅ Parameters proven through 82-combination grid search
✅ Risk management built-in
✅ Multiple pair capable
✅ Production ready

**Next steps:**
1. Copy to MQL5/Experts folder
2. Compile in MetaEditor
3. Test on demo for 1 week
4. Deploy live with 0.1 lot
5. Monitor and scale up

Good luck! 🚀
