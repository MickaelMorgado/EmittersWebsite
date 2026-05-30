# C-Only Strategy Test Plan

## 🎯 Overview

You've discovered that Position C is the **only profitable position** in your multi-position strategy. This test will validate whether a single-position strategy (C-only) outperforms the current multi-position approach.

## 📊 Current Baseline (Multi-Position)

```
Strategy: balanced (3 positions: A+B+C)
Trades: 1320
Wins: 453 (34.32%)
P&L: -$3,716
Composition:
  - Position A: 440 trades, -0.01 pts (LOSING)
  - Position B: 440 trades, -0.01 pts (LOSING)
  - Position C: 440 trades, +0.01 pts (WINNING)
```

## 🚀 New Strategy (Single Position)

```
Strategy: c-only (1 position: C only)
Expected Trades: ~440 (1 per signal instead of 3)
Expected Win Rate: 43.64% (same as Position C)
Risk/Reward: 1:2.9 (risk 0.206 pips to make 0.600 pips)
Expected P&L: +$660-$1,000 (estimated)
```

## 🧪 Test Procedure

### Step 1: Run Baseline Test (Current Strategy)
```
1. Open your backtesting page
2. Load CSV: EURUSD_M5_202412311600_202605051355.csv
3. Select Preset: balanced
4. Click "Run Backtest"
5. Note the final P&L and trade count
6. Screenshot the results
```

**Expected Result:**
- P&L: ~-$3,716
- Total Trades: ~1,320
- Win Rate: ~34.32%

### Step 2: Run C-Only Test (New Strategy)
```
1. Keep same CSV, same settings
2. Select Preset: c-only  ← NEW
3. Click "Run Backtest"
4. Compare results to baseline
```

**Expected Result:**
- P&L: Should be POSITIVE (vs -$3,716)
- Total Trades: ~440 (1/3 of baseline)
- Win Rate: ~43.64% (Position C's rate)

### Step 3: Compare Results

Create a comparison table:

| Metric | Balanced (A+B+C) | C-Only | Improvement |
|--------|------------------|--------|------------|
| Total Trades | 1320 | 440 | -67% (fewer trades) |
| Wins | 453 | ~192 | Same % (43.64%) |
| Losses | 867 | ~248 | Fewer bad trades |
| Win Rate | 34.32% | 43.64% | +9.32% |
| **P&L** | **-$3,716** | **??** | **TARGET: +$500+** |
| Avg Win | 0.000359 | 0.000300 | Same |
| Avg Loss | -0.000206 | -0.000206 | Same |
| Risk Per Trade | 0.206 pips | 0.206 pips | Same |
| Reward Per Trade | ↓ varies | 0.600 pips | Consistent |

## 📈 Success Criteria

✅ **Strategy is SUCCESS if:**
- C-only P&L is **POSITIVE** (even if just breakeven)
- Win rate is 43-44%
- Risk/Reward is ~1:2.9
- Account drawdown is low (no more than 2-3 consecutive losses)

❌ **Strategy needs adjustment if:**
- C-only P&L is still negative
- Win rate drops below 40%
- Something else changed unexpectedly

## 🔍 Post-Test Analysis

After running both tests, run this console command to get detailed stats:

```javascript
fetch('./trade-analysis-simple.js')
  .then(r => r.text())
  .then(code => eval(code));
```

This will show you:
- Position breakdown (only C in new test)
- Hourly performance
- Profit by direction
- Profitability metrics

## 💡 What Could Go Wrong?

**Scenario 1: C-only is still unprofitable**
- Possible cause: Something else is dragging it down
- Solution: Run detailed analysis to find the issue
- Action: Check if SL/TP values are correct

**Scenario 2: Win rate drops when C is alone**
- Possible cause: Position-sizing or capital impact
- Solution: Test with different lot sizes
- Action: Try 1.5x or 2.0x lot size on C-only

**Scenario 3: Results match but with fewer trades**
- Good sign! Fewer trades = lower risk, lower fees
- Action: Consider adding back partial A or B if needed

## 🎯 Next Steps (After Test)

**If C-only is PROFITABLE:**
1. ✅ Deploy C-only strategy
2. ✅ Monitor real performance vs backtest
3. ✅ Potentially increase lot size (if account allows)
4. ✅ Track drawdown carefully

**If C-only is UNPROFITABLE:**
1. ❌ Investigate why
2. ❌ Check if SL/TP is being calculated correctly
3. ❌ Review trade entry/exit logic
4. ❌ Consider different TP multiplier for C

## 📝 Documentation

Save your results here:
- **Balanced Results**: `/results/balanced-baseline.txt`
- **C-Only Results**: `/results/c-only-test.txt`
- **Comparison**: `/results/strategy-comparison.md`

---

## 🚀 Ready to Test?

Let me know when you've run both backtests and I'll help analyze the results!

Expected timeline: ~10 minutes total (2 backtests × ~5 minutes each)
