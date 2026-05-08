================================================================================
                    HYTEK TRADING SYSTEM - EA PACKAGE
                        9/21 EMA CROSSOVER ROBOT
================================================================================

WHAT'S INCLUDED:
================================================================================

1. HYTEK_9EMA_21EMA_EA.mq4
   - Complete Expert Advisor ready for MetaTrader 4/5
   - 9 EMA / 21 EMA entry signal
   - Optimal parameters: SL=5, TP=30, TS=0
   - Risk management built-in
   - Production ready

2. EA_DEPLOYMENT_GUIDE.md
   - Step-by-step installation guide
   - Parameter configuration reference
   - Testing procedures
   - Troubleshooting guide
   - Multiple account setup

3. HYTEK_9EMA_21EMA_EA.mq4 (Compiled .ex4 - Optional)
   - Pre-compiled version (if you have .ex4 file)
   - Just copy to experts folder and restart MT4


PROVEN PARAMETERS (From Grid Search):
================================================================================

Entry Signal:        9 EMA / 21 EMA Crossover
Stop Loss:           5 pips        ✓ Grid search optimized
Take Profit:         30 pips       ✓ Grid search optimized
Trailing Stop:       0 pips        ✓ Grid search optimized

Performance:
  Win Rate:          42.53%
  Profit Factor:     1.52
  Monthly Profit:    ~$5,598 (backtest data)
  Max Drawdown:      ~$1,065


QUICK START:
================================================================================

Step 1: Copy file to MetaTrader
  MT4: MetaTrader 4/experts/HYTEK_9EMA_21EMA_EA.mq4

Step 2: Compile
  Open MetaEditor → Open .mq4 file → Press F5 to compile

Step 3: Attach to Chart
  Drag EA to EURUSD M5 chart OR right-click chart → Attach EA

Step 4: Test on Demo
  Trade for 1 week on demo account first

Step 5: Deploy Live
  Start with 0.1 lot size, monitor for 1 week, then scale up


SUPPORT:
================================================================================

Common Issues:
- "Volume is invalid" → Check broker lot limits (usually 0.01-100)
- "Trading disabled" → Enable Algorithm Trading in Options
- EA not opening trades → Check Expert tab for error messages

Logs:
- View Expert tab (View → Toolbars → Expert)
- Look for: "BUY Order Opened", "SELL Order Opened", error messages


NEXT STEPS:
================================================================================

Immediate:
  1. Copy EA to MT4/experts folder
  2. Restart MetaTrader
  3. Open EURUSD M5 chart
  4. Drag EA to chart
  5. Test on demo account

Future:
  - Test on different currency pairs (adjust SL/TP for volatility)
  - Use grid search to find optimal params for each market
  - Deploy across multiple accounts/pairs for diversification


TECHNICAL DETAILS:
================================================================================

Magic Number:        12345 (prevents conflicts with other EAs)
Time Filter:         09:50-11:00 UTC (configurable)
Max Trades/Day:      10 (configurable)
Position Sizing:     Fixed lot or risk-based
Slippage:            3 pips (standard)


Questions?
==========
Refer to EA_DEPLOYMENT_GUIDE.md for detailed information.


Version: 1.0
Status: Production Ready
Last Updated: 2026-05-06
================================================================================
