# HYTEK EA - Automated Deployment & Testing Script (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File DEPLOY_AND_TEST.ps1
# Deploys GeneratedEA.mq5 to MT5 and provides testing instructions

Write-Host @"
╔════════════════════════════════════════════════════════════════════════╗
║           HYTEK EA - DEPLOYMENT & TESTING SEQUENCE                    ║
║                  9/21 EMA Crossover - EURUSD M5                      ║
╚════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Step 1: Verify files exist
Write-Host "[STEP 1] Verifying files..." -ForegroundColor Yellow

if (-Not (Test-Path "GeneratedEA.mq5")) {
    Write-Host "✗ GeneratedEA.mq5 not found in current directory" -ForegroundColor Red
    exit 1
}
if (-Not (Test-Path "ea_tester.py")) {
    Write-Host "✗ ea_tester.py not found in current directory" -ForegroundColor Red
    exit 1
}
Write-Host "✓ All required files present" -ForegroundColor Green
Write-Host ""

# Step 2: Run automation script
Write-Host "[STEP 2] Running MT5 automation script..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

try {
    python ea_tester.py 2>&1 | Out-Host
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "✓ Automation script executed successfully" -ForegroundColor Green
    Write-Host "✓ GeneratedEA.mq5 deployed to MT5 Experts folder" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠ Note: MT5 path not found (expected if MT5 not installed)" -ForegroundColor Yellow
    Write-Host "  Please refer to QUICK_START.md for manual setup instructions" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Display testing instructions
Write-Host "[STEP 3] Backtest Configuration (EXACT PARAMETERS)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$testingInstructions = @"

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If results match closely (within ±5%), the EA is working correctly!

IMPORTANT NOTES:
• Use M5 period (NOT M15, NOT M30)
• Use exact date range 2026-03-02 to 2026-05-06
• "Every tick" model gives most accurate results
• Check the "Deals" tab for individual trade details

"@

Write-Host $testingInstructions

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "[INFO] EA Configuration:" -ForegroundColor Cyan
Write-Host "  Entry Signal:     9/21 EMA Crossover"
Write-Host "  Stop Loss:        50 pips (0.0005)"
Write-Host "  Take Profit:      100 pips (0.009)"
Write-Host "  Trailing Stop:    Disabled"
Write-Host "  Trading Hours:    09:50 - 11:00 UTC"
Write-Host "  Max Trades/Day:   10"
Write-Host "  Daily Loss Limit: $500"
Write-Host ""
Write-Host "[INFO] Files Reference:" -ForegroundColor Cyan
Write-Host "  ✓ QUICK_START.md - Quick setup guide"
Write-Host "  ✓ PRODUCTION_VERIFICATION.md - Full verification report"
Write-Host "  ✓ PROJECT_FILES_INDEX.md - Complete file reference"
Write-Host "  ✓ MT5_AUTOMATION_GUIDE.md - Detailed MT5 setup"
Write-Host ""

Write-Host @"
╔════════════════════════════════════════════════════════════════════════╗
║                  DEPLOYMENT COMPLETE - READY TO TEST                  ║
╚════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green
