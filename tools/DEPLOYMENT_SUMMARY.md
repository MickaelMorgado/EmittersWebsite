# HYTEK EA - Deployment & Testing Summary

**Status:** ✓ Ready to Deploy  
**System:** 9/21 EMA Crossover - Single Position - Libertex Optimized  
**Tested:** EURUSD M5 | 2026-03-02 to 2026-05-06  
**Baseline Results:** 435 trades, 42.53% win rate, $5,598 profit, 1.52 profit factor

---

## Quick Start (Choose Your Platform)

### macOS/Linux
```bash
cd /path/to/tools
bash DEPLOY_AND_TEST.sh
```

### Windows (PowerShell)
```powershell
cd C:\path\to\tools
powershell -ExecutionPolicy Bypass -File DEPLOY_AND_TEST.ps1
```

Both scripts will:
1. ✓ Verify all files are present
2. ✓ Run ea_tester.py to deploy EA to MT5
3. ✓ Display exact MT5 backtest configuration
4. ✓ Show expected baseline results

---

## Manual Testing in MetaTrader 5

If automation doesn't find MT5, follow these steps manually:

### Step 1: Locate MT5 Installation

**macOS (with Wine):**
```bash
find ~/ -name "terminal.exe" -type f 2>/dev/null
```
Copy this path, then add to `~/.zprofile`:
```bash
export MT5_PATH="/path/to/MetaTrader 5"
source ~/.zprofile
```

**Windows:**
Standard location: `C:\Program Files\MetaTrader 5`

Set environment variable (as Administrator):
- Right-click This PC → Properties
- Advanced System Settings → Environment Variables
- New: `MT5_PATH = C:\Program Files\MetaTrader 5`
- Restart PowerShell

### Step 2: Copy EA File

**From:** `/Users/mickael/development/EmittersWebsite/tools/GeneratedEA.mq5`  
**To:** `{MT5_PATH}/MQL5/Experts/Advisors/GeneratedEA.mq5`

Then restart MT5 terminal.

### Step 3: Run Backtest in MT5

**Open Strategy Tester:**
- Menu: View → Strategy Tester
- Or press: Ctrl+R

**Configure EXACTLY:**

| Setting | Value | Note |
|---------|-------|------|
| Expert Advisor | GeneratedEA.mq5 | Dropdown list |
| Symbol | EURUSD | Case-sensitive |
| Period | M5 | 5-minute bars (NOT M15) |
| Model | Every tick | Most accurate |
| Spread | 10 | Fixed spread |
| Start Date | 2026.03.02 00:00 | March 2, 2026 |
| End Date | 2026.05.06 23:59 | May 6, 2026 |

**Click "Start"** - Wait for backtest to complete (~2-5 minutes depending on your CPU)

### Step 4: Verify Results

**Expected Baseline:**
```
Total Trades:          435
Win Rate:              42.53%
Profit Factor:         1.52
Gross Profit:          $5,598.00
Max Drawdown:          $1,065.00
Avg Trade:             ~$12.87
```

**Acceptable Variance:** ±3-5% due to backtest interpolation

**Check Individual Trades:**
1. Click "Deals" tab in backtest results
2. Review the trade sequence
3. Verify SL and TP distances (SL ~50 pips, TP ~100 pips)
4. Check trade timing during 09:50-11:00 trading window

---

## EA Configuration Reference

### Trading Parameters
```
Entry Signal:        9/21 EMA Crossover
  - Fast EMA:        9 periods
  - Slow EMA:        21 periods
  - Entry:           When EMA9 crosses above/below EMA21

Stop Loss:           50 pips (0.0005)
  - Broker Check:    Libertex minimum is 30 points (3 pips)
  - Safety Margin:   Configured at 50 pips
  
Take Profit:         100 pips (0.009)
  - Risk/Reward:     1:2 ratio
  - Expected Close:  When price reaches TP level

Trailing Stop:       Disabled (0)
  - Why:             Grid search shows best performance with TS=0
  - Risk:            Position holds until TP or SL is hit
```

### Risk Management Parameters
```
Trading Hours:       09:50 - 11:00 UTC
  - Purpose:         Avoid off-market volatility
  - Weekend:         Automatically skips Saturday/Sunday

Max Trades Per Day:  10
  - Purpose:         Limit exposure
  - Reset:           Daily at 00:00 UTC

Daily Loss Limit:    $500
  - Purpose:         Stop trading if daily loss exceeds
  - Action:          All positions closed automatically
  - Reset:           Daily at 00:00 UTC

Position Management: Single position only
  - Type:            One position at a time
  - Crossovers:      Close previous position on opposite signal
```

### Lot Size
```
Fixed Lot Size:      1.0 lot
Alternative:         Risk-based sizing (RiskPercent: 2%)
  - Auto Calculate:  Based on SL distance and account balance
```

---

## File Locations

### After Deployment

| File | Location (macOS with Wine) | Location (Windows) |
|------|-------------------------|-------------------|
| GeneratedEA.mq5 | `~/.wine/drive_c/Program Files/MetaTrader 5/MQL5/Experts/Advisors/` | `C:\Program Files\MetaTrader 5\MQL5\Experts\Advisors\` |
| Config | `~/.mt5_automation_config.json` | `C:\Users\[username]\.mt5_automation_config.json` |
| History Data | `~/.wine/drive_c/Program Files/MetaTrader 5/history/[Broker]/` | `C:\Program Files\MetaTrader 5\history\[Broker]\` |
| Backtest Results | `~/.wine/drive_c/Program Files/MetaTrader 5/tester/` | `C:\Program Files\MetaTrader 5\tester\` |

---

## Troubleshooting

### MT5 Not Found
**On macOS:**
```bash
find ~/ -name "terminal.exe" -type f 2>/dev/null
```
Copy the path and set `MT5_PATH` environment variable.

**On Windows:**
Check if MT5 is installed in `C:\Program Files` or `C:\Program Files (x86)`

---

### EA Not Appearing in Strategy Tester
1. Verify file is in correct folder: `{MT5_PATH}/MQL5/Experts/Advisors/GeneratedEA.mq5`
2. Check file permissions (should be readable)
3. Restart MT5 terminal completely
4. The EA should appear in the dropdown list

---

### Backtest Returns Different Results
1. **Check date range:**
   - Start: 2026.03.02 00:00 ✓
   - End: 2026.05.06 23:59 ✓

2. **Check timeframe:**
   - Period: M5 (5-minute bars) ✓
   - NOT M15 or M30

3. **Check symbol:**
   - Symbol: EURUSD (case-sensitive) ✓

4. **Acceptable variance:**
   - ±3-5% is normal (backtest interpolation)
   - ±10% or more = check configuration

5. **Check broker/data:**
   - Different brokers may have slightly different historical data
   - ICMarkets data used in original grid search

---

### Python/ea_tester.py Issues

**"Python not found"**
```bash
# macOS - Install
brew install python3

# Windows - Download from python.org
```

**"Module not found"**
```bash
# The script only uses built-in Python modules
# No external packages needed
```

**"Permission denied" on shell script**
```bash
chmod +x DEPLOY_AND_TEST.sh
```

---

## Next Steps After Successful Backtest

### If Results Match Baseline (✓ Success)
1. ✓ EA is functioning correctly
2. ✓ Ready for paper trading (demo account)
3. ✓ Monitor for 1-2 weeks on demo
4. ✓ If results are consistent, can go live

### If Results Differ Significantly (>±10%)
1. Verify date range is exactly 2026-03-02 to 2026-05-06
2. Verify period is M5 (not M15 or other)
3. Check if running on same broker (ICMarkets data used)
4. Historical data may differ slightly - check with broker
5. Consider re-running with "Every tick" model for accuracy

### Customizing Parameters

To change SL/TP or other parameters:

1. Open `index6.html` in web browser
2. Adjust parameters:
   - SL: 25-100 pips range
   - TP: 50-200 pips range
   - Trading hours, max trades, etc.
3. Download new `GeneratedEA.mq5`
4. Deploy using `ea_tester.py` or manual copy
5. Re-test in MT5 with same date range

---

## System Status Checklist

- [x] GeneratedEA.mq5 - Compiled & verified
- [x] ea_tester.py - Syntax checked & tested
- [x] Code generation - Consistent across outputs
- [x] Grid search - 131 parameters, best result saved
- [x] Documentation - Complete (5 files)
- [x] Deployment scripts - macOS/Windows versions
- [x] Automation - Cross-platform path detection
- [x] Broker optimization - Libertex specific features
- [x] Date range - Confirmed (2026-03-02 to 2026-05-06)
- [x] Timeframe - Confirmed (M5)

---

## Support Resources

| Document | Purpose |
|----------|---------|
| QUICK_START.md | 30-second setup guide |
| PRODUCTION_VERIFICATION.md | Full technical verification |
| PROJECT_FILES_INDEX.md | File reference & organization |
| MT5_AUTOMATION_GUIDE.md | Detailed MT5 path setup |
| GridSearch_Backup_HYTEK.json | All 131 parameter results |
| DEPLOY_AND_TEST.sh | macOS/Linux automation |
| DEPLOY_AND_TEST.ps1 | Windows automation |

---

## Contact & Questions

If EA behavior is unexpected:
1. Check this document's Troubleshooting section
2. Review PRODUCTION_VERIFICATION.md for technical details
3. Verify date range and timeframe match exactly
4. Compare results with GridSearch_Backup_HYTEK.json baseline

---

**Last Updated:** 2026-05-06  
**System:** Production Ready  
**Next Action:** Run `bash DEPLOY_AND_TEST.sh` or `powershell -ExecutionPolicy Bypass -File DEPLOY_AND_TEST.ps1`
