# Technical Context: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Frontend Technologies
- **HTML5**: Structure and layout, including file upload inputs, form controls, and result panels.
- **CSS3**: Styling via external stylesheets (`assets/css.css`, `assets/reusables.css`, `index6.css`), responsive design, themes.
- **JavaScript (ES6+)**: Core application logic, event handling, data processing, chart rendering.

## Libraries and Frameworks
- **SciChart**: Professional charting library for OHLC candlestick charts, annotations (lines, arrows, circles), axes, themes. Used for real-time price visualization.
- **Chart.js**: Lightweight library for rendering performance charts (equity curves, P/L lines).
- **PapaParse**: CSV parsing library for streaming large MT5 export files line-by-line.
- **Axios**: HTTP client (imported but not heavily used in current code; may be for future API integrations).
- **Font Awesome**: Icon library for UI elements (buttons, toggles).

## Key Dependencies and Versions
- SciChart: `3.5.782` (specific version pinned for axis label alignment).
- Chart.js: Latest via CDN.
- PapaParse: `5.3.0`.
- Axios: Latest via CDN.
- Font Awesome: `7.0.1`.

## Architecture Patterns
- **Event-Driven**: File upload triggers parsing, which streams data to update charts and calculations.
- **Streaming Data Processing**: CSV processed line-by-line to simulate real-time backtesting.
- **State Management**: Global variables for orders history, chart data, signals array.
- **Modular Functions**: Core logic split into reusable functions (indicators, trading logic, UI updates).
- **URL Parameter Persistence**: Configuration saved to browser URL for session persistence.

## Data Flow
1. User uploads CSV file.
2. PapaParse streams rows one-by-one.
3. Each row (candle) updates chart, calculates indicators, checks signals, simulates trades.
4. After all rows, performance metrics are computed and displayed.

## Data Formats

### Input CSV Format (MT5 Export)
**Required Column Order:**
1. `<DATE>` - Date in format like "2025.01.15"
2. `<TIME>` - Time in format like "10:30:00"
3. `<OPEN>` - Opening price
4. `<HIGH>` - High price
5. `<LOW>` - Low price
6. `<CLOSE>` - Closing price

**Notes:**
- Angle brackets `<>` are required in column headers for parser recognition
- Data exported from MT5 using CTRL+U → Bars tab → filter range → export CSV
- Flat candles (OPEN = HIGH = LOW = CLOSE) are skipped as they represent weekends/holidays

### Output CSV Format (Backtest Results)
**Column Order in resultToCSV():**
1. `csvFileName` - Original filename
2. `timeframe` - Extracted from filename
3. `strategy` - Strategy used (CSID_W_MA_DynamicTS, etc.)
4. `sdt` - Start date (MM/DD/YYYY)
5. `edt` - End date (MM/DD/YYYY)
6. `numbDays` - Number of trading days
7. `sessionStart` - Session start time
8. `sessionEnd` - Session end time
9. `tradeCount` - Number of trades taken
10. `winRate` - Win rate percentage
11. `moneyEquivalent` - Total P/L in currency
12. `profitsInPoints` - Total P/L in points
13. `lotSize` - Lot size used
14. `slSize` - Stop loss size
15. `tpSize` - Take profit size
16. `tsSize` - Trailing stop increment
17. `maPeriod` - Moving average period
18. `maThreshold` - MA acceleration threshold
19. `profitFactor` - Profit factor ratio
20. `commissionSize` - Commission per lot

## Browser Compatibility
- Modern browsers with ES6 support.
- Relies on Web Audio API for notification sounds.
- File API for local file reading.
- Canvas API for chart rendering.

## Performance Considerations
- CSV streaming prevents memory overload for large files.
- Candle buffer limited to 10 for trailing stop calculations.
- Chart updates throttled to avoid UI freezing.
- Indicators computed incrementally per candle.

## Development Environment
- No build tools; plain HTML/JS served statically.
- Debugging via browser console, breakpoints in DevTools.
- Code organized in single JS file with global functions.
