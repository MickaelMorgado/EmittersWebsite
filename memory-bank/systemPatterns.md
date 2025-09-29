# System Patterns

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## High-Level Architecture

1. **CSV Loading & Parsing**  
   - User selects a CSV file via `<input id="csvFileInput">`.  
   - `Papa.parse` reads the file in **step** mode, invoking a callback on each row.  
   - Parser is paused/resumed between rows to throttle processing (controlled by `readingSpeed` and pause checkbox).

2. **Per-Candle Processing Pipeline**  
   On each parsed candle (`results.data`):  
   - **Dynamic Info Update**: `updateDynamicInfos` updates current date, progression bar.  
   - **Chart Update**:  
     - `appendDataToChart` calls `addNewCandleToChart` to append to SciChart’s OHLC series.  
     - `addBacktestingDateTimeToChart` adds vertical lines at session boundaries and populates date dropdown.  
   - **Indicator Computation & Annotation**:  
     - `appendIndicatorsToChart` invokes:  
       - `updateCSIDLineAnnotation` (CSID breakout detection + MA trend check)  
       - `inTradingTimeRange` (sets time-in-range flag)  
       - `calcATR` (ATR threshold detection)  
   - **Trade Logic**:  
     - `checkForTPSLHit` scans open orders for TP/SL hits or adjusts trailing stops.  
     - `profitabilityCalculation` recomputes P/L, win rate, equity series, and re-renders Chart.js chart and order table.

3. **Chart Initialization & Themes**  
   - `initSciChart` sets up SciChartSurface with:  
     - DateTime X-axis, Numeric Y-axis  
     - Candlestick series (FastCandlestickRenderableSeries)  
     - Custom theme based on URL parameters (bullish/bearish colors)  
     - Chart modifiers (cursor, zoom, pan)  
     - Annotation series for signals and trade entry/exit

4. **User Interaction & Controls**  
   - Toolbar toggles (`revealAlgoEditor`, `revealAlgo`, `revealReview`) switch result-panel views.  
   - Controls for session start/end, risk inputs (lot size, SL/TP, trailing stop).  
   - “Refresh” button re-runs backtest on the same file.  
   - Embedded “Algo Editor” textareas allow dynamic injection of custom JS per candle.

5. **Modularity & Event-Driven Flow**  
   - Core functions are attached to `window` for global access (e.g., `window.calcATR`, `window.profitabilityCalculation`).  
   - Event listeners orchestrate pipeline triggers (file input change, button clicks, select “change”).

6. **Dead-Code & Comments**  
   - Several commented-out sections (swing high/low in `onCandleDrawn`, helper functions) indicate removed or experimental features.  
   - Unused utility functions and variables should be reviewed and pruned.
