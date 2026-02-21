# Active Context

## Current Focus
- Initialize Project Memory Bank to cover the full repository scope.
- Maintain detailed documentation for the Backtesting Tool.
- **Implement Google Sheets Export**: Enable one-click export of backtesting results to a specific Google Sheet.
- **PC AI Assistant App**: Created new standalone Node.js application with galaxy visualization inside `node-projects/my-app/pc-ai-assistant/`.
- **Stalker 2 Ammo Tracker enhancements**: Overhauled Ammo Calibration UI, implemented surplus detection logic, and integrated magazine-based transfers.

## Recent Changes
- Expanded `projectbrief.md` to cover the Game Website.
- Updated `productContext.md` and `techContext.md` with Main Website details.
- Updated `systemPatterns.md` to outline the full project structure.
- Enhanced `stalker2-ammo` application with premium tactical UI and advanced logistics logic.

## Backtesting Tool Reference (`tools/index6.js`)

### Extracted Functions & Utilities
- revealAlgoEditor, revealAlgo, revealReview — Toggle result-panel views.
- toggleHeight — Expand/collapse result panel.
- stickyTableHeaders — Make table header sticky on scroll.
- animateActiveClass — Trigger notification animation on UI elements.
- getCandleDirection, getCandleDirectionFromCandle — Determine candle bull/bear direction.
- getCandleChartAxisLocationFromDate, formatDateFromUnix — Convert dates for chart axis and labels.
- stepByStep — Helper to sequence multi-click tool actions.
- convertMT5DateToUnix — Parse MT5 date-time strings to Unix timestamp.
- handleFileAndInitGraph — Entry point for file import and chart initialization.
- initSciChart — Set up SciChartSurface, axes, series, modifiers, and theming.
- appendDataToChart, addNewCandleToChart — Append OHLC data to chart buffer and series.
- addBacktestingDateTimeToChart — Annotate chart and dropdown with session dates.
- appendIndicatorsToChart — Invoke indicators: CSID, TTR, ATR.
- updateCSIDLineAnnotation — Detect CSID breakouts and draw annotations.
- inTradingTimeRange — Flag candles within configured session hours.
- calcATR — Compute ATR and annotate threshold breaches.
- checkSignalsForTrade — Evaluate combined signal array to place trades.
- AddActionOnChart — Annotate chart with lines, circles, or trade entries.
- checkForTPSLHit — Manage open orders: TP/SL hits and trailing stop adjustments.
- profitabilityCalculation — Compute performance metrics, render Chart.js equity curve, and build trade table.
- reinitializeChart — Clear and re-create chart for fresh backtest.
- simpleMA — Compute simple moving average series.
- updateDynamicInfos — Update date display and progress bar on each new date.

### Hardcoded Strategy Signals
- **CSID Breakout (arrayOfSignals[0])**: breakout above or below the 15-bar high/low sets this signal.
- **Time-In-Range (arrayOfSignals[1])**: candle timestamp falls within sessionStart–sessionEnd.
- **ATR Threshold (arrayOfSignals[2])**: current True Range > 1.2 × ATR over the last 20 bars.
- **MA Trend (arrayOfSignals[3])**: simple MA(200) acceleration exceeds ±0.0008.

## Key Recent Changes
- **Fixed Max Updraw Calculation**: Corrected the updraw calculation logic in `profitabilityCalculation()` function. Previously used `trough - peak` (always negative), now properly calculates maximum recovery from drawdowns using `peak - trough` when new peaks are reached. Also renamed variable from `maxUpdrawn` to `maxUpdraw` for consistency.
- **Added Total Wins/Losses Count**: Added `totalWins` and `totalLosses` counters to display simple total wins and losses counts in addition to consecutive wins/losses.
- **Dual Winrate Display**: Implemented two types of winrate calculations:
  - Winrate (Positive P/L): Based on any trade with positive P/L (backward compatible with existing behavior)
  - Winrate (TP Hits): Based only on trades closed by take profit (TP) hits
  - Both winrates are now displayed in the results for comprehensive analysis
- **Google Sheets Export Button Enhancement**: Implemented dynamic button state management for the "Send to Google Sheets" functionality. The button is now only enabled when there is data in the CSV Exportable text field, preventing empty exports. Added `updateGoogleSheetsButtonState()` function that monitors the textarea content and enables/disables the button accordingly. Button state updates both when results are programmatically populated during backtesting and when users manually edit the textarea.

## Important Strategy Insights
- **Win Rate (Positive P/L)**: Represents overall strategy effectiveness including partial profit taking, trailing stops, and manual interventions. This is the traditional winrate that most traders expect.
- **Win Rate (TP Hits)**: Represents pure trend-following accuracy - how often the strategy successfully rides trends to their full profit target. Lower TP winrate but higher average profit per winning trade indicates effective trailing stop management.
- **Why Both Matter**: The gap between these two winrates reveals how much profit is captured through dynamic exit strategies (trailing stops, partial closes) versus full trend captures.

## Stalker 2 Ammo Tracker Reference (`stalker2-ammo/page.tsx`)

### Key Features & Logic
- **Ammo Calibration UI**: Search-integrated modal for hardware-specific compatibility overrides and threshold management.
- **Magazine-Based Transfers**: Uses `boxSize` from `data.ts` to ensure transfers and adjustments align with in-game magazine capacities.
- **Kuznetsov AI Logistics Scan**: 
    - **Shortage Alerts**: Real-time detection of backpack and stash deficits.
    - **Surplus Detection**: Recommends selling/storing inventory exceeding 3x threshold, with caliber-wide safety checks.
    - **Hardware Mismatch**: Identifies equipped hardware without compatible ammunition.
- **Tiered Munitions**: 
    - **Purple Grade**: Precision/Match/Sniper rounds (.308 Match, 7.62x54mm 7N1, 5.56x45mm Mk 262).
    - **Green Grade**: Mid-tier/AP rounds (9x19mm +P, standard AP variants).
- **Tactical UI/UX**: 
    - Industrial-grade header with multi-tone branding and top-edge scanner accents.
    - Graph View integration for visual verification of supply surpluses.
    - Tactical audio feedback (zipper, ammo, box sounds) for all manifest interactions.

## Unused or Commented Code
- `onData`, `onCandleDrawn` functions are defined but not registered.
- Helper functions `ceilToDecimalPlaces`, `updateYAxisRange`, and commented swing high/low code in `onCandleDrawn`.
- Dead variables: `ods`, unused Axios import, and some UI button handlers disabled by default.
- Several commented-out experimental annotation flows (e.g., HIDDER controls).
