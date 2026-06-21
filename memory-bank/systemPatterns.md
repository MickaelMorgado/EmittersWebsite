# System Patterns

## New App Entry Checklist

When adding a new app to the homepage:

1. **`src/app/page.tsx`**: Add entry to `PROJECTS` object with `{ title, description, href, accentColor, isPublic? }`
2. **Auth protection**: If `isPublic: false` (or omitted), add cookie-based auth check in the page component:
   - Check `site_unlocked=true` cookie on mount
   - Show lock screen with password input if not unlocked
   - Use `AUTH_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD` for validation
   - Pattern: see `investments/page.tsx` or `llm-rules/page.tsx`
3. **API routes**: If the app has backend logic, create routes under `src/app/api/<app-name>/route.ts`
4. **Credentials**: Never hardcode secrets — always use `.env` with `NEXT_PUBLIC_` prefix for client-side vars
5. **Memory bank**: Update `memory-bank/apps-overview.md` with the new entry

## Project Structure
- **Root**: Contains the main website (`index.html`) and sub-pages (`mika.html`, `tools.html`).
- **assets/**: Shared resources (CSS, JS, Images, Videos, Fonts).
- **tools/**: Directory for auxiliary web apps.
    - **index6.html/js/css**: The **Backtesting App**.
- **memory-bank/**: Project documentation.

## Main Website Architecture
- **Single Page Application (SPA)-like feel**: Uses `jquery.scrollify` for section-based scrolling.
- **Dynamic Content**: Uses `lozad` for lazy loading images/videos, `slick` for carousels.
- **Styling**: `assets/css.css` (core), `assets/desktop.css`, `assets/mobile.css` for responsive design.

## Backtesting Tool Architecture (`tools/index6.*`)

### 1. CSV Loading & Parsing
- User selects a CSV file via `<input id="csvFileInput">`.
- `Papa.parse` reads the file in **step** mode, invoking a callback on each row.
- Parser is paused/resumed between rows to throttle processing (controlled by `readingSpeed` and pause checkbox).

### 2. Per-Candle Processing Pipeline
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

### 3. Chart Initialization & Themes
- `initSciChart` sets up SciChartSurface with:
    - DateTime X-axis, Numeric Y-axis
    - Candlestick series (FastCandlestickRenderableSeries)
    - Custom theme based on URL parameters (bullish/bearish colors)
    - Chart modifiers (cursor, zoom, pan)
    - Annotation series for signals and trade entry/exit

### 4. User Interaction & Controls
- Toolbar toggles (`revealAlgoEditor`, `revealAlgo`, `revealReview`) switch result-panel views.
- Controls for session start/end, risk inputs (lot size, SL/TP, trailing stop).
- “Refresh” button re-runs backtest on the same file.
- Embedded “Algo Editor” textareas allow dynamic injection of custom JS per candle.

### 5. Modularity & Event-Driven Flow
- Core functions are attached to `window` for global access (e.g., `window.calcATR`, `window.profitabilityCalculation`).
- Event listeners orchestrate pipeline triggers (file input change, button clicks, select “change”).
