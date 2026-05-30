# HYTEK Trading System - File Index

**Last Updated:** 2026-05-06  
**Project Status:** Production Ready  
**Location:** `/Users/mickael/development/EmittersWebsite/tools/`

---

## Core Application Files

### 1. GeneratedEA.mq5 (16.9 KB)
**Type:** MQL5 Expert Advisor  
**Status:** ✓ Production Ready  
**Purpose:** The trading bot that runs in MetaTrader 5

**Key Features:**
- 9/21 EMA Crossover entry logic
- Two-step execution (order → modify SL/TP)
- Libertex broker optimizations
- Daily loss limits and trading hours filter
- Single position management
- Magic number protection

**Parameters:**
- SL: 50 pips | TP: 100 pips | TS: Disabled
- Trading hours: 09:50–11:00
- Max 10 trades/day | Daily loss limit: $500

**Deployment:** Copy to `MT5_PATH/MQL5/Experts/Advisors/GeneratedEA.mq5`

---

### 2. ea_tester.py (11 KB)
**Type:** Python Automation Script  
**Status:** ✓ Tested & Verified  
**Purpose:** Auto-detect MT5, export EA, manage paths across platforms

**Capabilities:**
- OS detection (macOS, Windows, Linux)
- MT5 path auto-detection (6 fallback locations)
- EA export to Experts folder
- Configuration persistence (~/.mt5_automation_config.json)
- Folder validation

**Usage:**
```bash
python3 ea_tester.py      # macOS/Linux
python ea_tester.py       # Windows
```

**Platforms Supported:**
- ✓ macOS with Wine
- ✓ Windows (native)
- ✓ Linux with Wine

---

### 3. index6.html (33.6 KB)
**Type:** Web Application (HTML)  
**Status:** ✓ Active  
**Purpose:** User interface for generating and customizing the EA

**Features:**
- Real-time MQL5 code preview (textarea)
- Parameter customization
- Download GeneratedEA.mq5
- Default parameters auto-load on page refresh
- Grid search interface for parameter optimization

**Access:** Open in web browser at `file:///path/to/index6.html`

---

### 4. index6.js (202 KB)
**Type:** Web Application JavaScript  
**Status:** ✓ Verified  
**Purpose:** Code generation engine and UI logic

**Key Functions:**
- `generateMQLFromParams()` - Converts parameters to MQL5
- `generateDefaultMQL()` - Auto-loads best parameters
- `runGridSearch()` - Parameter optimization engine
- Grid search analysis and result sorting

**Parameters Generated:**
- All 13 input parameters (SL, TP, TS, EMA periods, etc.)
- Broker-specific settings
- Risk management parameters
- Trading time filters

---

## Documentation Files

### 5. QUICK_START.md (Latest)
**Type:** Quick Reference  
**Purpose:** 30-second setup guide for new users

**Contents:**
- Step-by-step MT5 automation
- One-time environment setup
- Key parameters reference
- Expected performance metrics
- Troubleshooting quick answers

**Best For:** Getting started quickly

---

### 6. PRODUCTION_VERIFICATION.md (Latest)
**Type:** Full Verification Report  
**Purpose:** Complete system verification and status documentation

**Contents:**
- Component verification results (5 sections)
- Code quality analysis
- Libertex optimizations checklist
- All functions verified (14/14 present)
- Architecture summary
- Performance baseline

**Best For:** Technical review and compliance

---

### 7. MT5_AUTOMATION_GUIDE.md (11 KB)
**Type:** Comprehensive Guide  
**Purpose:** Detailed documentation for cross-platform MT5 setup

**Contents:**
- Path detection commands (Mac, Windows, Linux)
- Environment variable setup
- Alternative installation paths
- Key folders documentation
- Manual backtest workflow
- Troubleshooting guide

**Best For:** Deep technical understanding

---

### 8. GridSearch_Backup_HYTEK.json (2.1 KB)
**Type:** JSON Data Archive  
**Purpose:** Backup of all 131 parameter combinations tested during grid search

**Contents:**
- Best parameters (Rank 1): SL=50, TP=100, TS=0
- Top 10 ranked results with performance metrics
- Performance summary: 42.53% win rate, 1.52 profit factor, $5,598 profit
- All 131 parameter combinations available in full backup

**Usage:** Reference baseline for backtest comparison

---

## Related Files (Reference)

### Historical/Testing
- `EURUSD_M5_*.csv` - Market data used for grid search
- `backtest-result*.png` - Previous backtest screenshots
- Various HTML test files (index1.html - index13.html) - Legacy versions

### Configuration
- `EA_DEPLOYMENT_GUIDE.md` - Deployment procedures
- `MT5_DEPLOYMENT_GUIDE.md` - MT5-specific deployment
- `README_EA.txt` - Project readme

---

## File Organization by Function

### Trading System (Must Deploy)
```
GeneratedEA.mq5          ← EA to deploy to MT5
GridSearch_Backup_HYTEK.json  ← Parameter reference
```

### User Interface (Optional - Web Tools)
```
index6.html              ← Open in browser
index6.js                ← Loaded by index6.html
index6.css               ← Styling
```

### Automation (Deployment Tools)
```
ea_tester.py             ← Run to auto-deploy
MT5_AUTOMATION_GUIDE.md  ← Setup reference
```

### Documentation (Reference)
```
PRODUCTION_VERIFICATION.md  ← Full status report
QUICK_START.md              ← Quick guide
PROJECT_FILES_INDEX.md      ← This file
```

---

## Deployment Checklist

- [x] GeneratedEA.mq5 - Ready to deploy
- [x] ea_tester.py - Ready to run
- [x] All documentation complete
- [x] Code generation tested and verified
- [x] Grid search results backed up
- [x] Cross-platform automation ready

---

## Quick Reference: File Sizes & Dates

| File | Size | Modified | Status |
|------|------|----------|--------|
| GeneratedEA.mq5 | 16.9 KB | 2026-05-06 | ✓ Production |
| ea_tester.py | 11 KB | 2026-05-06 | ✓ Tested |
| index6.js | 202 KB | 2026-05-06 | ✓ Active |
| index6.html | 33.6 KB | 2026-05-06 | ✓ Active |
| GridSearch_Backup_HYTEK.json | 2.1 KB | 2026-05-06 | ✓ Reference |
| PRODUCTION_VERIFICATION.md | Latest | 2026-05-06 | ✓ New |
| QUICK_START.md | Latest | 2026-05-06 | ✓ New |
| MT5_AUTOMATION_GUIDE.md | 11 KB | 2026-05-06 | ✓ Complete |

---

## What to Do Next

### Option 1: Test Automation (Recommended)
```bash
python3 ea_tester.py
```
This will verify MT5 is found and EA can be deployed.

### Option 2: Manual Deployment
1. Copy `GeneratedEA.mq5` to `MT5_PATH/MQL5/Experts/Advisors/`
2. Restart MT5
3. Open Strategy Tester
4. Select GeneratedEA.mq5 and run backtest

### Option 3: Customize Parameters
1. Open `index6.html` in browser
2. Adjust parameters as needed
3. Download new GeneratedEA.mq5
4. Deploy to MT5

---

## Support Resources

- **Quick answers:** QUICK_START.md
- **Full details:** PRODUCTION_VERIFICATION.md
- **Technical setup:** MT5_AUTOMATION_GUIDE.md
- **Parameter history:** GridSearch_Backup_HYTEK.json
- **Web tool help:** index6.html (built-in UI)

---

**All files are in:** `/Users/mickael/development/EmittersWebsite/tools/`
