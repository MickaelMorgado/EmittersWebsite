# Product Context

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

This back-testing tool is designed for traders who want to develop, test, and refine algorithmic strategies against historical market data. Key user workflows:

1. Export and upload CSV bar data from MetaTrader 5 covering a chosen time range.  
2. Configure session parameters (start/end times, risk settings: lot size, SL/TP, trailing stop increment).  
3. Step through each candlestick: the app draws bars on a SciChart chart, computes signals (CSID breakout, ATR threshold, time-in-range window, moving average trend), and applies entry/exit rules in real-time.  
4. View detailed results: per-trade logs, performance metrics (win rate, profit factor, equity curve), CSV-exportable summary, and historical order table.  
5. Iterate by tweaking strategy code in the embedded “Algo Editor” textarea and re-running the backtest instantly.  

The interface balances visual charting, code-driven strategy customization, and data-driven performance feedback to streamline quantitative strategy development.
