# Progress: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Current Status
- **Functionality**: Fully operational backtesting tool with CSID strategy variants.
- **Features Implemented**: CSV upload/parsing, chart rendering, indicator calculations, trade simulation, performance analytics, UI panels.
- **Stability**: Core features stable; no known crashes in normal usage.
- **Testing**: Manual testing with sample MT5 data; no automated tests.

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

## Known Issues and Bugs
- **Theme Reload**: Changing themes requires full page reload (not dynamic).
- **Memory Usage**: Large CSV files (>10k rows) may cause browser slowdown.
- **ATR Reset**: ATR signal resets after each trade; may need refinement for multi-trade sessions.
- **MA Acceleration**: MA trend calculation simplistic; may not capture complex patterns.
- **Date Parsing**: Assumes specific MT5 date format; fails on variations.
- **Annotation Overlap**: Dense signals may overlap on chart, reducing readability.

## Recent Changes
- Added dynamic trailing stop sizing based on candle size thresholds.
- Implemented MA slope coloring with PaletteProvider.
- Enhanced order history table with color-coded results.
- Added file reading progress bar.

## Planned Improvements
- **Short-Term**:
  - Add more strategies (e.g., RSI-based, MACD crossovers).
  - Improve MA calculation efficiency (cache results).
  - Add chart zoom to trade levels on click.
  - Implement pause/resume during backtesting.

- **Medium-Term**:
  - Support multiple timeframes (aggregate from 1m data).
  - Add forward testing with live data feed.
  - Export results to JSON/CSV for external analysis.
  - Mobile optimization for touch interactions.

- **Long-Term**:
  - Custom EA code editor integration (eval user code safely).
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
