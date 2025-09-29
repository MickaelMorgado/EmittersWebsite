# Project Brief

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

This back-testing web application enables users to load MT5-exported CSV bar data and simulate trading strategies over historical price series. It reads the CSV line-by-line, rendering each candlestick on a SciChart chart, computes indicators (CSID breakout, time-in-range, ATR thresholds, moving average trend), and evaluates trade entry/exit logic (TP/SL, trailing stops). Results—including performance metrics, equity curves, and detailed trade logs—are displayed in interactive panels beneath the chart. The core strategy logic is statically defined in JavaScript and runs per candlestick update.
