# Progress: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Current Status
- **Functionality**: Fully operational backtesting tool with CSID strategy variants.
- **Features Implemented**: CSV upload/parsing, chart rendering, indicator calculations, trade simulation, performance analytics, UI panels.
- **MQL5 Generator**: Successfully generating MQL5 EA code for MT5 with live trading capabilities.
- **Stability**: Core features stable; no known crashes in normal usage.
- **Testing**: Manual testing with sample MT5 data; EA tested on MT5 demo account.

## Completed Milestones
- ✅ Basic CSV parsing and chart initialization.
- ✅ SciChart integration for OHLC visualization.
- ✅ CSID breakout detection and annotation.
- ✅ ATR and TTR indicators.
- ✅ Trade entry/exit logic with TP/SL.
- ✅ Trailing stop implementation (dynamic sizing).
- ✅ Performance calculation and Chart.js equity curves.
- ✅ UI panels for results, configuration, and review.
- ✅ Theme customization and URL persistence.
- ✅ Audio feedback and progress indicators.
- ✅ MQL5 EA Generator (live trading EA from backtesting strategy)

## MQL5 EA Generator (Latest)
The generator now outputs a complete, compilable MQL5 EA with:
- **CSID Signal**: Breakout of highest high (bullish) / lowest low (bearish) using lookback period
- **TTR (Trading Time Range)**: Session time filter (configurable start/end times)
- **MA Direction**: 20-period MA acceleration calculation for trend confirmation
- **ATR Trigger**: High volatility filter - waits for institutional move before enabling entries
- **Visual Lines**: Blue (CSID High), Red (CSID Low), Green/Red vertical (session boundaries)
- **Trading**: Supports multiple trades per session with SL/TP

### EA Inputs:
| Parameter | Default | Description |
|-----------|---------|-------------|
| LookbackPeriod | 20 | CSID lookback candles |
| SessionStart | 09:50 | Trading session start (HH:MM) |
| SessionEnd | 11:00 | Trading session end (HH:MM) |
| MAPeriod | 200 | MA period for trend |
| MAThreshold | 0.00003 | MA acceleration threshold |
| ATRPeriod | 20 | ATR period |
| ATRMultiplier | 1.2 | TR > ATR × multiplier for volatility trigger |
| LotSize | 0.1 | Trade lot size |
| SLPoints | 100 | Stop loss in points |
| TPPoints | 300 | Take profit in points |

### Trading Logic:
1. Wait for session time (TTR)
2. Wait for high volatility (ATR trigger) to enable entries
3. On CSID breakout + MA direction match → execute trade
4. ATR resets at session start (new day)

## Known Issues and Bugs
- **Theme Reload**: Changing themes requires full page reload (not dynamic).
- **Memory Usage**: Large CSV files (>10k rows) may cause browser slowdown.
- **Date Parsing**: Assumes specific MT5 date format; fails on variations.
- **Annotation Overlap**: Dense signals may overlap on chart, reducing readability.
- **MQL5 MA Lines**: MA indicator added separately to chart (not drawn by EA for performance)

## Recent Changes
- Added dynamic trailing stop sizing based on candle size thresholds.
- Implemented MA slope coloring with PaletteProvider.
- Enhanced order history table with color-coded results.
- Added file reading progress bar.
- Created MQL5 EA generator for live trading.

## Planned Improvements
- **Short-Term**:
  - Fix ATR trigger order (check ATR before CSID) - DONE
  - Add max trades per session limit option.
  - Add chart zoom to trade levels on click.
  - Implement pause/resume during backtesting.

- **Medium-Term**:
  - Support multiple timeframes (aggregate from 1m data).
  - Add forward testing with live data feed.
  - Export results to JSON/CSV for external analysis.
  - Mobile optimization for touch interactions.

- **Long-Term**:
  - Custom EA code editor integration.
  - Multi-asset backtesting.
  - Cloud deployment for larger datasets.
  - API integration for data sources beyond MT5.

## Performance Metrics
- **Load Time**: ~2-5 seconds for 1k candles on modern hardware.
- **Memory Peak**: ~50-100MB for large datasets.
- **Responsiveness**: UI remains interactive during streaming.

## Dependencies and Maintenance
- **SciChart License**: Currently using CDN; may need paid license for production.
- **Browser Support**: Tested on Chrome/Firefox; IE not supported.
- **Updates**: Libraries pinned to specific versions; update carefully to avoid breaking changes.
