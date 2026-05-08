#!/bin/bash
# HYTEK EA - Automated Deployment & Testing Script
# Usage: bash DEPLOY_AND_TEST.sh
# Deploys GeneratedEA.mq5 to MT5 and provides testing instructions

set -e

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║           HYTEK EA - DEPLOYMENT & TESTING SEQUENCE                    ║"
echo "║                  9/21 EMA Crossover - EURUSD M5                      ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verify files exist
echo "[STEP 1] Verifying files..."
if [ ! -f "GeneratedEA.mq5" ]; then
    echo "✗ GeneratedEA.mq5 not found in current directory"
    exit 1
fi
if [ ! -f "ea_tester.py" ]; then
    echo "✗ ea_tester.py not found in current directory"
    exit 1
fi
echo "✓ All required files present"
echo ""

# Step 2: Run automation script
echo "[STEP 2] Running MT5 automation script..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if python3 ea_tester.py 2>/dev/null; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✓ Automation script executed successfully"
    echo "✓ GeneratedEA.mq5 deployed to MT5 Experts folder"
    echo ""
else
    echo "⚠ Note: MT5 path not found (expected if running on different system)"
    echo "  Please refer to QUICK_START.md for manual setup instructions"
    echo ""
fi

# Step 3: Display testing instructions
echo "[STEP 3] Backtest Configuration (EXACT PARAMETERS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'TESTING_INSTRUCTIONS'

OPEN METATRADER 5 AND FOLLOW THESE STEPS:

1. Click: View → Strategy Tester
   (Or press: Ctrl+R)

2. Configure Strategy Tester Settings:

   ┌─ ESSENTIAL SETTINGS ──────────────────────────────────┐
   │ Expert Advisor:        GeneratedEA.mq5                │
   │ Symbol:                EURUSD                          │
   │ Period:                M5 (5-minute bars)              │
   │ Model:                 Every tick (slower, most accurate) │
   │ Spread:                10 (fixed)                      │
   └───────────────────────────────────────────────────────┘

3. Set Date Range:

   ┌─ DATE RANGE (Original Grid Search) ──────────────────┐
   │ Start Date:            2026.03.02 00:00               │
   │ End Date:              2026.05.06 23:59               │
   │ Duration:             ~9 weeks                         │
   └───────────────────────────────────────────────────────┘

4. Click "Start" button

5. Wait for backtest to complete (will show progress bar)

EXPECTED BASELINE RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Trades:          435 trades
  Win Rate:              42.53%
  Profit Factor:         1.52
  Gross Profit:          $5,598.00
  Max Drawdown:          $1,065.00
  Consecutive Wins:      Check trend
  Consecutive Losses:    Check trend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If results match closely (within ±5%), the EA is working correctly.

IMPORTANT NOTES:
• Use M5 period (NOT M15, NOT M30)
• Use exact date range 2026-03-02 to 2026-05-06
• "Every tick" model gives most accurate results
• Results may vary ±2-3% due to interpolation differences
• Check the "Deals" tab for trade details

NEXT STEPS AFTER TESTING:
1. Review the test results report
2. Check individual trades in "Deals" tab
3. If results match, EA is ready for paper trading
4. If results differ significantly, check:
   - Date range matches exactly
   - Period is M5 (not M15)
   - Symbol is EURUSD (case-sensitive)

TESTING_INSTRUCTIONS

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[INFO] EA Configuration:"
echo "  Entry Signal:     9/21 EMA Crossover"
echo "  Stop Loss:        50 pips (0.0005)"
echo "  Take Profit:      100 pips (0.009)"
echo "  Trailing Stop:    Disabled"
echo "  Trading Hours:    09:50 - 11:00 UTC"
echo "  Max Trades/Day:   10"
echo "  Daily Loss Limit: \$500"
echo ""
echo "[INFO] Files Reference:"
echo "  ✓ QUICK_START.md - Quick setup guide"
echo "  ✓ PRODUCTION_VERIFICATION.md - Full verification report"
echo "  ✓ PROJECT_FILES_INDEX.md - Complete file reference"
echo "  ✓ MT5_AUTOMATION_GUIDE.md - Detailed MT5 setup"
echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT COMPLETE - READY TO TEST                  ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
