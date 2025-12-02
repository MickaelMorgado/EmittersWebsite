# Product Context: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Product Overview
App6 is a specialized web-based backtesting tool for algorithmic trading strategies, focused on price action and institutional signals. It simulates trading on historical MT5 data to evaluate strategy performance, risk metrics, and equity curves.

## Target Users
- Algorithmic traders developing strategies based on breakout patterns.
- Quantitative analysts testing CSID (price action breakouts) with MA and ATR filters.
- Traders using MT5 for data export who need quick backtesting without coding an EA.

## Core Functionality
### Data Input
- Upload MT5-exported CSV files containing OHLC data.
- Automatic parsing of date/time formats and price fields.
- Support for large files via streaming (no full load into memory).

### Strategy Configuration
- **Strategy Selection**: Choose from CSID, CSID_W_MA, CSID_W_MA_DynamicTS.
- **Risk Parameters**: SL/TP points, trailing stop increments, lot size, commissions.
- **Session Filtering**: Define trading hours (e.g., 09:50-11:00) to simulate intraday sessions.
- **Indicator Settings**: MA period/threshold for trend confirmation.

### Real-Time Simulation
- Candles render sequentially on chart to mimic live trading.
- Indicators calculated per candle: CSID breakout detection, ATR volatility, MA slope.
- Trade signals generated when all conditions met (CSID + TTR + ATR + MA).
- TP/SL management with dynamic trailing stops based on candle size.

### Visualization
- **Price Chart**: SciChart OHLC candlesticks with annotations (entry/exit arrows, signal lines).
- **Equity Curve**: Chart.js line chart showing cumulative P/L and portfolio equity.
- **Theme Support**: Color schemes (Green/Red, Blue/Magenta, etc.) for bullish/bearish visualization.

### Analytics Output
- **Performance Metrics**: Win rate, profit factor, total trades, gross profit/loss.
- **Risk Metrics**: Max drawdown, max updrawn, consecutive wins/losses.
- **Order History**: Detailed table of all trades with timestamps, prices, P/L.
- **CSV Export**: Formatted data for spreadsheet analysis.

## User Experience
### Workflow
1. Select/upload CSV file.
2. Configure strategy parameters (strategy, SL/TP, session times).
3. Click refresh to run backtest.
4. View results in panels: chart annotations, equity curve, metrics, trade log.
5. Navigate through dates to inspect specific sessions.
6. Save/load configurations via URL for repeatability.

### UI Components
- **Upload Section**: File input, navigation controls, progress bar.
- **Chart Area**: Interactive SciChart with zoom/pan, cursor tooltips.
- **Result Panels**: Tabbed interface (Algo Results, Algo Editor, Review Trades).
- **Config Grid**: Input fields for all parameters with labels and tooltips.
- **Theme Selector**: Dropdown for visual customization.
- **Audio Feedback**: Sounds for notifications and completions.

### Accessibility and Usability
- Responsive design (flex layouts, mobile-friendly).
- Tooltips on inputs for parameter explanations.
- Visual feedback (animations, progress bars).
- Keyboard navigation (date selector arrows).
- Error handling (console logs for parsing issues).

## Business Value
- Enables rapid iteration on trading strategies without MT5 coding.
- Provides comprehensive performance analysis for decision-making.
- Free/open-source tool for traders (no licensing fees).
- Educational: Helps users understand indicator interactions and risk management.

## Limitations and Known Issues
- Strategies hardcoded; no custom EA import yet.
- Single timeframe (assumes 1-minute bars from MT5).
- No forward testing or live integration.
- Memory usage for very large files (streaming mitigates but not eliminates).
- Theme changes require page reload.
