**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

# Active Context

## Current Focus
- Document core functions and their purposes for quick reference.
- Identify and list unused or commented-out code sections for potential removal.

## Extracted Functions & Utilities
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

## Hardcoded Strategy Signals
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

## Important Strategy Insights
- **Win Rate (Positive P/L)**: Represents overall strategy effectiveness including partial profit taking, trailing stops, and manual interventions. This is the traditional winrate that most traders expect.
- **Win Rate (TP Hits)**: Represents pure trend-following accuracy - how often the strategy successfully rides trends to their full profit target. Lower TP winrate but higher average profit per winning trade indicates effective trailing stop management.
- **Why Both Matter**: The gap between these two winrates reveals how much profit is captured through dynamic exit strategies (trailing stops, partial closes) versus full trend captures.

## Unused or Commented Code
- `onData`, `onCandleDrawn` functions are defined but not registered.
- Helper functions `ceilToDecimalPlaces`, `updateYAxisRange`, and commented swing high/low code in `onCandleDrawn`.
- Dead variables: `ods`, unused Axios import, and some UI button handlers disabled by default.
- Several commented-out experimental annotation flows (e.g., HIDDER controls).
