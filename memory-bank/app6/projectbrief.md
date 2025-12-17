# Project Brief: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

This back-testing web application enables users to load MT5-exported CSV bar data and simulate trading strategies over historical price series. It reads the CSV line-by-line, rendering each candlestick on a SciChart chart, computes indicators (CSID breakout, time-in-range, ATR thresholds, moving average trend), and evaluates trade entry/exit logic (TP/SL, trailing stops). Results—including performance metrics, equity curves, and detailed trade logs—are displayed in interactive panels beneath the chart. The core strategy logic is statically defined in JavaScript and runs per candlestick update.

## Key Features
- CSV file upload and parsing (PapaParse)
- Real-time chart visualization (SciChart for OHLC candles, Chart.js for equity curves)
- Indicator calculations: CSID (price action breakout), ATR (volatility), MA (trend)
- Strategy backtesting: CSID, CSID_W_MA, CSID_W_MA_DynamicTS
- Risk management: SL/TP points, trailing stops, commissions
- Session-based filtering (start/end times)
- Performance analytics: win rate, profit factor, drawdown, equity curve
- Theme customization (color schemes for bullish/bearish)
- Configuration persistence via URL parameters
- Order history table with trade details
- File reading progress indicator
