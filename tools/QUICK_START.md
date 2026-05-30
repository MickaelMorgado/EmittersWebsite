# HYTEK EA - Quick Start Guide

## 30-Second Setup

### Step 1: Find Your MT5 Installation (One-Time)

**macOS with Wine:**
```bash
find ~/ -name "terminal.exe" -type f 2>/dev/null
```

Copy the path, then edit `~/.zprofile` and add:
```bash
export MT5_PATH="/path/to/MetaTrader 5"
```

Then reload:
```bash
source ~/.zprofile
```

**Windows (PowerShell):**
```powershell
Get-ChildItem -Path "C:\Program Files*" -Recurse -Include "terminal.exe" 2>/dev/null
```

Then set environment variable:
- Right-click **This PC** → Properties
- Advanced System Settings → Environment Variables
- New: `MT5_PATH = C:\Program Files\MetaTrader 5`

### Step 2: Run the Automation Script

**macOS/Linux:**
```bash
cd /path/to/tools
python3 ea_tester.py
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\tools
python ea_tester.py
```

Expected output:
```
[✓] MT5 Automation initialized for Darwin
Operating System:    Darwin
MT5 Root Path:       /Users/username/.wine/drive_c/Program Files/MetaTrader 5
Experts:             .../MQL5/Experts/Advisors/ ✓ OK
History:             .../history/ICMarkets/ ✓ OK
Results:             .../tester/ ✓ OK
[✓] Configuration saved to: /Users/username/.mt5_automation_config.json
```

### Step 3: Test in MT5

1. Open MT5 terminal
2. View → Strategy Tester (Ctrl+R)
3. Select: **GeneratedEA.mq5**
4. Configure:
   - Symbol: **EURUSD**
   - Period: **M5** (5-minute bars)
   - Date: **2026-03-02 to 2026-05-06** (Original backtest range)
5. Click **Start**

Expected baseline: 435 trades, 42.53% win rate, $5,598 profit, 1.52 profit factor

---

## Files Ready to Use

| File | Purpose | Status |
|------|---------|--------|
| `GeneratedEA.mq5` | Expert Advisor (MQL5 code) | ✓ Ready to deploy |
| `ea_tester.py` | Automation script | ✓ Tested & verified |
| `index6.html` | Web app for code generation | ✓ Default params loaded |
| `GridSearch_Backup_HYTEK.json` | Best 131 parameter results | ✓ Reference data |
| `MT5_AUTOMATION_GUIDE.md` | Detailed documentation | ✓ Complete |
| `PRODUCTION_VERIFICATION.md` | Full verification report | ✓ All checks passed |

---

## Key Parameters

```
Stop Loss (SL):     50 pips  (0.0005)
Take Profit (TP):   100 pips (0.009)
Trailing Stop (TS):  0 (disabled)
Entry Signal:        9/21 EMA Crossover
Trading Window:      09:50 - 11:00
Max Trades/Day:      10
Daily Loss Limit:    $500
```

---

## Expected Performance

- **Win Rate:** ~42.53%
- **Profit Factor:** 1.52
- **Monthly Profit:** ~$5,598
- **Max Drawdown:** ~$1,065

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MT5 not found | Run: `find ~/ -name "terminal.exe"` and set `MT5_PATH` |
| Wine not installed (Mac) | Install via: `brew install wine-stable` |
| Permission denied | Run: `chmod +x ea_tester.py` |
| Python not found | Install: `brew install python3` (Mac) or download from python.org (Windows) |
| EA doesn't appear in MT5 | Check EA folder exists and permissions are readable |

---

## Next Steps

1. **Verify automation works:** Run `python3 ea_tester.py`
2. **Deploy EA to MT5:** Script will copy automatically
3. **Run backtest:** Use MT5 Strategy Tester with date range 2026-04-01 to 2026-05-06
4. **Compare results:** Check against `GridSearch_Backup_HYTEK.json` baseline
5. **Adjust if needed:** Use web app (index6.html) to generate new parameters

---

## Support Files

- 📄 Full verification: `PRODUCTION_VERIFICATION.md`
- 📖 Detailed guide: `MT5_AUTOMATION_GUIDE.md`
- 📊 Grid search results: `GridSearch_Backup_HYTEK.json`
- 🔧 This guide: `QUICK_START.md`

---

**Ready to test?** Run `python3 ea_tester.py` and follow the output instructions.
