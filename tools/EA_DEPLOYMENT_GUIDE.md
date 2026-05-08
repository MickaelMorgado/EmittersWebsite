# HYTEK Trading System - EA Deployment Guide

## Expert Advisor: 9/21 EMA Crossover

### File
**HYTEK_9EMA_21EMA_EA.mq4** - Production Ready

---

## Features

✅ **Entry Signal:** 9 EMA / 21 EMA Crossover
- Bullish: 9 EMA crosses above 21 EMA → BUY
- Bearish: 9 EMA crosses below 21 EMA → SELL

✅ **Position Management:**
- Stop Loss: 5 pips
- Take Profit: 30 pips
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

## Installation

### Step 1: Copy EA to MetaTrader
```
MetaTrader 4 Folder/
├── experts/
│   └── HYTEK_9EMA_21EMA_EA.mq4  ← Copy here
└── (restart MT4)
```

Or for MetaTrader 5:
```
Terminal Data Folder/
├── MQL5/
│   └── Experts/
│       └── HYTEK_9EMA_21EMA_EA.mq4
└── (restart MT5)
```

### Step 2: Compile
- Open MetaEditor (F4)
- Open HYTEK_9EMA_21EMA_EA.mq4
- Compile (F5)
- Should show "0 errors"

### Step 3: Attach to Chart
- Open EURUSD M5 chart
- Drag EA from Navigator → Chart
- OR right-click chart → Attach Expert Advisor
- Configure parameters (see below)

---

## Parameters Configuration

### Entry Signal
```
EMA_Fast = 9          (Fast EMA period - DO NOT CHANGE)
EMA_Slow = 21         (Slow EMA period - DO NOT CHANGE)
```

### Position Management (Optimized)
```
SL_Pips = 5           (Stop Loss: 5 pips - PROVEN OPTIMAL)
TP_Pips = 30          (Take Profit: 30 pips - PROVEN OPTIMAL)
TS_Pips = 0           (Trailing Stop: 0 = disabled - PROVEN OPTIMAL)
```

### Position Sizing
```
LotSize = 1.0         (Fixed lot size, use this OR RiskPercent)
RiskPercent = 2.0     (Alternative: risk % per trade, set LotSize=0 to use)
```

**Choose one:**
- **Fixed Lots:** Set `LotSize = 1.0` and `RiskPercent = 0`
- **Risk-Based:** Set `LotSize = 0` and `RiskPercent = 2.0` (for 2% risk per trade)

### Trading Hours (UTC)
```
TradeStartHour = "09:50"      (Start time HH:MM)
TradeEndHour = "11:00"        (End time HH:MM)
TradeAllHours = false         (true = ignore time filter)
```

### Risk Management
```
MaxTradesPerDay = 10          (Max 10 trades per day)
MaxDailyLoss = 500            (Close if loss exceeds $500)
CloseAllOnMaxLoss = false     (true = close ALL positions when limit hit)
```

---

## Testing & Deployment

### 1. Demo Account Testing (Mandatory)
**Before any live trading:**
```
1. Attach EA to demo account
2. Run for 1 week minimum
3. Monitor:
   - Entry accuracy (9/21 crossovers)
   - Win rate vs expected 42.53%
   - SL/TP execution
   - Daily trading count
4. Check logs in Expert tab
```

### 2. Backtest (Optional Verification)
```
MetaTrader → Tools → Strategy Tester
Symbol: EURUSD
Period: M5
Model: Every tick (most accurate)
Date Range: Last 3 months
Set parameters same as live
```

### 3. Live Deployment (Small Position)
```
1. Start with LotSize = 0.1 (micro lots)
2. Monitor 1 week
3. If results match backtest: scale up
4. If issues: stop and debug
```

---

## Monitoring & Logs

### Check EA Performance
**View in MetaTrader:**
- Open Expert tab (View → Toolbars → Expert)
- Watch for:
  - "BUY Order Opened"
  - "SELL Order Opened"
  - "Position Closed"
  - Any errors

### Key Metrics to Track
- Total trades per day (should be < 10)
- Win rate (expected: ~42%)
- Daily P&L
- Drawdown

### Error Handling
Common errors and fixes:
```
Error 131: Volume is invalid
→ Check LotSize is within broker limits
→ Broker usually requires 0.01-100 lots

Error 138: Requote
→ Increase slippage (3 pips default)
→ Or set TimeToClose to close pending orders

Error 4756: Trading disabled
→ Check Account → Properties
→ Enable Algo Trading in Options
```

---

## Troubleshooting

### EA not opening trades
1. Check Expert tab for errors
2. Verify time filter is correct (UTC!)
3. Confirm MaxTradesPerDay not exceeded
4. Check if TP/SL prices are valid

### Wrong position sizing
1. If LotSize=1.0 and trading 1.0 lots = correct
2. If RiskPercent used: check `AccountBalance * 2% / (5 pips risk)`
3. Verify broker lot limits (MarketWatch → Properties)

### Trailing stop not working
1. Check TS_Pips > 0 (disabled by default)
2. Verify stop only moves UP (for longs) or DOWN (for shorts)
3. Check if price is in profit before TS activates

---

## Performance Expectations

Based on grid search results:

**Best Case (Hill_1_preset_equal):**
- Win Rate: 42.53%
- Profit Factor: 1.52
- Monthly Profit: ~$5,598 (on test data)
- Max Drawdown: ~$1,065

**Conservative Case (Hill_2_preset_conservative):**
- Win Rate: 47.13% (higher)
- Profit Factor: 1.53
- Monthly Profit: ~$2,695
- Less volatile

**Important:** Past backtest results ≠ future live results. Always start small.

---

## Multiple Account Deployment

For trading multiple currency pairs or accounts:

1. **Create copy for each pair:**
   ```
   HYTEK_9EMA_21EMA_EA_GBPUSD.mq4
   HYTEK_9EMA_21EMA_EA_USDJPY.mq4
   HYTEK_9EMA_21EMA_EA_AUDUSD.mq4
   ```

2. **Adjust parameters per pair:**
   - SL/TP might need adjustment for different volatility
   - Keep entry logic (9/21 EMA) same
   - Test each with grid search

3. **Risk management across accounts:**
   - Set MaxDailyLoss per pair
   - Consider total account equity across all pairs
   - Keep correlation in mind (EURUSD and GBPUSD are correlated)

---

## Support & Maintenance

### Update Entry Signal
If you want to change from 9/21 EMA to another signal:
1. Locate `OnTick()` function
2. Replace EMA calculation with your signal
3. Recompile
4. Backtest before deployment

### Modify SL/TP
The optimized values are hardcoded as 5/30 pips:
```
input double SL_Pips = 5;
input double TP_Pips = 30;
```
Change these inputs to test new values.

---

## Emergency Procedures

**If EA malfunctions:**
1. Remove EA from chart immediately
2. Manually close any open positions
3. Check logs for error codes
4. Fix issue locally
5. Retest on demo before reattaching

**Daily procedure:**
- Start trading at 09:50 UTC
- Monitor first few trades
- Stop adding new trades after reaching MaxTradesPerDay
- Review results end of day

---

## Summary

✅ EA ready for deployment
✅ Parameters proven through grid search
✅ Risk management built-in
✅ Multiple account capable

**Next:** Test on demo, validate backtest results, deploy live with small position.
