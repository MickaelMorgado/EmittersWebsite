# Functions Reference: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

This document summarizes every core function defined in `tools/index6.js` and `tools/index6.html`, with its signature and purpose.

## UI Panel Management
- **revealAlgoEditor()**  
  Shows the "Algo Editor" panel view by toggling result-panel CSS classes.

- **revealAlgo()**  
  Shows the "Backtesting results (Algo)" panel view.

- **revealReview()**  
  Shows the "Review From Historical Trades" panel view.

- **toggleHeight()**  
  Toggles the result-panel between collapsed and expanded states.

## UI Utilities
- **stickyTableHeaders(parentElement)**  
  Adds/removes a `.sticky` class on table headers when scrolling within the result panel.

- **animateActiveClass(element)**  
  Plays a notification sound and briefly adds the `active` CSS class for UI feedback.

- **updateDynamicInfos(d)**  
  Updates the current reading date display, adjusts the progress bar width, and triggers a notification.

- **updateFileReadingProgression(percentage)**  
  Sets the CSS width of the file-reading progression bar to the given percentage.

## Data Conversion and Formatting
- **getCandleDirection(openPrice, closePrice)**  
  Returns `"BULL"` or `"BEAR"` based on price comparison (defaults to BULL if zeros).

- **getCandleDirectionFromCandle(candle)**  
  Wrapper around `getCandleDirection` using candle array indices.

- **getCandleChartAxisLocationFromDate(dateString)**  
  Converts a date-time string into a Unix timestamp (seconds) for SciChart's X-axis.

- **formatDateFromUnix(unixTime)**  
  Formats a Unix timestamp (seconds) into a human-readable date string (`en-GB` locale).

- **convertMT5DateToUnix(candleTime)**  
  Parses MT5-style date strings (`YYYY.MM.DD HH:MM:SS`) to Unix timestamp (seconds).

## File Handling and Parsing
- **handleFileAndInitGraph(file)**  
  Entry point for file import: resets state, reads first/last CSV lines, then streams with Papa.parse.

## Chart Initialization and Management
- **initSciChart()**  
  Asynchronously creates and configures the SciChartSurface (axes, series, themes, modifiers).

- **addNewCandleToChart(d)**  
  Manages a buffer of recent candles (max size) and appends to the SciChart OHLC data series.

- **reinitializeChart()**  
  Clears existing chart series/annotations and calls `initSciChart` to start fresh.

- **bttVerticalLineAnnotation(value)**  
  Adds a labeled vertical line annotation at a given X-axis position (used for session boundary markers).

## Data Processing
- **appendDataToChart(d)**  
  Calls `addNewCandleToChart` to append one candle's OHLC data into the chart series.

- **appendIndicatorsToChart(d, index)**  
  Invokes indicator routines for each new candle: CSID, time-in-range (TTR), ATR.

- **addBacktestingDateTimeToChart(d)**  
  Annotates chart with session-boundary vertical lines and populates the date dropdown.

## Indicators and Signals
- **CSIDIndicator(d, index)**  
  Proxy that calls `updateCSIDLineAnnotation`.

- **updateCSIDLineAnnotation(d, index)**  
  Detects CSID breakouts, calculates MA trend, draws line or arrow annotations on chart.

- **inTradingTimeRange(d)**  
  Sets the time-in-range flag in the signals array based on configured session hours.

- **calcATR(d, index)**  
  Computes ATR over a fixed period, draws threshold annotations, and toggles ATR signal flag.

- **simpleMA(values, period)**  
  Returns a simple moving average array for a series of close prices.

## Trading Logic
- **checkSignalsForTrade(d, direction)**  
  Tests combined signals (CSID, TTR, ATR, MA) and issues a trade via `AddActionOnChart`.

- **AddActionOnChart(candle, actionType, direction)**  
  Draws chart annotations (vertical line, circle) or adds trade entries to `ordersHistory`.

- **checkForTPSLHit(d, index)**  
  Iterates open orders to detect TP/SL hits, adjusts trailing stops, and draws exit annotations.

## Performance Analysis
- **profitabilityCalculation()**  
  Calculates P/L metrics, win rate, equity curves; renders a Chart.js line chart and builds the order table.

## Configuration Management
- **saveConfigs()**  
  Persists session and risk input values to URL parameters for future reloads.

- **loadConfigs()**  
  Loads configuration from URL parameters and updates the page.

## HTML-Defined Functions
- **changeDate(direction)** (defined in HTML)  
  Moves the selected index in the date dropdown by ±1 and dispatches a change event.

- **applyTheme()** (defined in HTML)  
  Updates URL parameters and reloads the page to apply new color theme settings.

- **stepByStep(step, actions)**  
  Executes the nth callback in an array of action functions, used for multi-click tools.

---

## MT5 Strategy Tester Issues

### "Waiting for Update" Hang
A custom indicator or template that runs fine on a live chart but hangs inside the tester UI can freeze it on "Waiting for Update". 

**Solutions:**
1. Close MT5 completely
2. Run the cleanup commands below
3. Delete any custom templates from `MQL5/Profiles/Templates/`
4. Delete any custom indicators that may be causing issues
5. Restart MT5

### Infinite Loops / Blocking Code
Infinite loops or blocking code in `OnInit` of the EA or its indicators will also prevent the first tick from being processed in visual mode.

**Solutions:**
1. Ensure `OnInit` returns quickly (no while loops, no long calculations)
2. Use `OnStart()` for one-time initialization instead of `OnInit()`
3. Move heavy calculations to `OnTick()` with proper bar check
4. Avoid `Sleep()` in visual mode

---

## MT5 Strategy Tester Maintenance

When the MT5 strategy tester is failing, producing unexpected results, or visualization issues occur, run these cleanup commands.

**Terminal Path:** `C:\Users\Mickael M\AppData\Roaming\MetaQuotes\Terminal\D0E8209F77C8CF37AD8BF550E51FF075`

**WSL Path:** `/mnt/<DRIVE>/Users/<USER>/AppData/Roaming/MetaQuotes/Terminal/<ID>/`

```bash
# Delete old Tester ini files (7+ days)
find MQL5/Profiles/Tester/ -maxdepth 1 -mtime +7 -type f -iname "*.ini" -exec rm {} \;

# Delete .dat files in symbols
find bases/XPMT5-*/symbols/ -type f -iname "*.dat" -exec rm {} \;

# Delete .dat files in trades
find bases/XPMT5-*/trades/* -type f -name "*.dat" -exec rm {} \;

# Delete chr and wnd files
find MQL5/Profiles/ -type f -name "*.chr" -exec rm {} \;
find MQL5/Profiles/ -type f -name "*.wnd" -exec rm {} \;

# Backup tester.tpl
[ -f MQL5/Profiles/Templates/tester.tpl ] && mv MQL5/Profiles/Templates/tester.tpl MQL5/Profiles/Templates/_tester.tpl

# Clear ticks and cache
rm -r bases/XPMT5-*/ticks/*
rm -r Tester/cache/
```

**Note:** Close MT5 before running these commands.
