# Functions Reference

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.


This document summarizes every core function defined in `tools/index6.js`, with its signature and purpose.

- **revealAlgoEditor()**  
  Shows the “Algo Editor” panel view by toggling result-panel CSS classes.

- **revealAlgo()**  
  Shows the “Backtesting results (Algo)” panel view.

- **revealReview()**  
  Shows the “Review From Historical Trades” panel view.

- **toggleHeight()**  
  Toggles the result-panel between collapsed and expanded states.

- **stickyTableHeaders(parentElement)**  
  Adds/removes a `.sticky` class on table headers when scrolling within the result panel.

- **animateActiveClass(element)**  
  Plays a notification sound and briefly adds the `active` CSS class for UI feedback.

- **getCandleDirection(openPrice, closePrice)**  
  Returns `"BULL"` or `"BEAR"` based on price comparison (defaults to BULL if zeros).

- **getCandleDirectionFromCandle(candle)**  
  Wrapper around `getCandleDirection` using candle array indices.

- **getCandleChartAxisLocationFromDate(dateString)**  
  Converts a date-time string into a Unix timestamp (seconds) for SciChart’s X-axis.

- **formatDateFromUnix(unixTime)**  
  Formats a Unix timestamp (seconds) into a human-readable date string (`en-GB` locale).

- **stepByStep(step, actions)**  
  Executes the nth callback in an array of action functions, used for multi-click tools.

- **convertMT5DateToUnix(candleTime)**  
  Parses MT5-style date strings (`YYYY.MM.DD HH:MM:SS`) to Unix timestamp (seconds).

- **handleFileAndInitGraph(file)**  
  Entry point for file import: resets state, reads first/last CSV lines, then streams with Papa.parse.

- **initSciChart()**  
  Asynchronously creates and configures the SciChartSurface (axes, series, themes, modifiers).

- **appendDataToChart(d)**  
  Calls `addNewCandleToChart` to append one candle’s OHLC data into the chart series.

- **addNewCandleToChart(d)**  
  Manages a buffer of recent candles (max size) and appends to the SciChart OHLC data series.

- **addBacktestingDateTimeToChart(d)**  
  Annotates chart with session-boundary vertical lines and populates the date dropdown.

- **appendIndicatorsToChart(d, index)**  
  Invokes indicator routines for each new candle: CSID, time-in-range (TTR), ATR.

- **updateCSIDLineAnnotation(d, index)**  
  Detects CSID breakouts, calculates MA trend, draws line or arrow annotations on chart.

- **CSIDIndicator(d, index)**  
  Proxy that calls `updateCSIDLineAnnotation`.

- **inTradingTimeRange(d)**  
  Sets the time-in-range flag in the signals array based on configured session hours.

- **calcATR(d, index)**  
  Computes ATR over a fixed period, draws threshold annotations, and toggles ATR signal flag.

- **checkSignalsForTrade(d, direction)**  
  Tests combined signals (CSID, TTR, ATR, MA) and issues a trade via `AddActionOnChart`.

- **AddActionOnChart(candle, actionType, direction)**  
  Draws chart annotations (vertical line, circle) or adds trade entries to `ordersHistory`.

- **checkForTPSLHit(d, index)**  
  Iterates open orders to detect TP/SL hits, adjusts trailing stops, and draws exit annotations.

- **profitabilityCalculation()**  
  Calculates P/L metrics, win rate, equity curves; renders a Chart.js line chart and builds the order table.

- **reinitializeChart()**  
  Clears existing chart series/annotations and calls `initSciChart` to start fresh.

- **simpleMA(values, period)**  
  Returns a simple moving average array for a series of close prices.

- **updateDynamicInfos(d)**  
  Updates the current reading date display, adjusts the progress bar width, and triggers a notification.

- **updateFileReadingProgression(percentage)**  
  Sets the CSS width of the file-reading progression bar to the given percentage.

- **bttVerticalLineAnnotation(value)**  
  Adds a labeled vertical line annotation at a given X-axis position (used for session boundary markers).

- **changeDate(direction)** (defined in HTML)  
  Moves the selected index in the date dropdown by ±1 and dispatches a change event.

- **applyTheme()** (defined in HTML)  
  Updates URL parameters and reloads the page to apply new color theme settings.

- **saveConfigs()** (defined in HTML)  
  Persists session and risk input values to URL parameters for future reloads.
