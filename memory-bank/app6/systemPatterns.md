# System Patterns: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Architectural Patterns
### Event-Driven Architecture
- **File Upload Event**: Triggers `handleFileAndInitGraph`, initializing chart and parsing pipeline.
- **PapaParse Streaming**: `step` callback processes each CSV row, updating UI incrementally.
- **UI Interactions**: Button clicks, input changes dispatch events to update configs or refresh backtest.

### Pipeline Processing
- **Data Flow Chain**: File → Parse → Update Chart → Calculate Indicators → Check Signals → Simulate Trade → Update Metrics.
- Each step is modular, allowing easy extension (e.g., add new indicators).

### State Management
- **Global Variables**: `ordersHistory`, `pnlData`, `equityData`, `arrayOfSignals` hold application state.
- **Mutable State**: Arrays updated in-place during streaming for performance.
- **No Framework**: Plain JS objects; could benefit from a state management library for larger scale.

## Design Patterns
### Singleton Pattern
- **Chart Instance**: `window.existingChart` ensures only one SciChart instance.
- **Audio Objects**: `audioSuccess`, `audioNotify` reused across calls.

### Observer Pattern
- **Event Listeners**: DOM elements listen for changes (e.g., input `change` events trigger animations).
- **Chart Updates**: `profitabilityCalculation` observes `ordersHistory` changes to update displays.

### Strategy Pattern
- **EnumStrategy**: Defines CSID variants (base, with MA, with dynamic TS) as interchangeable strategies.
- **Conditional Logic**: `checkSignalsForTrade` branches based on strategy settings.

### Factory Pattern
- **Annotation Creation**: `AddActionOnChart` creates different annotation types based on `EnumActionType`.
- **Order Creation**: `ordersHistory.push` builds order objects with varying properties.

### Template Method Pattern
- **Indicator Calculation**: `appendIndicatorsToChart` defines sequence: CSID → TTR → ATR.
- **Trade Simulation**: Standard sequence: Check signals → Add order → Manage TP/SL.

## Data Structures
### Arrays for Time Series
- **candlesFromBuffer**: Circular buffer (max 10) for recent candles, used for trailing stop calculations.
- **CSIDLookbackCandleSerie**: Growing array of historical candles for indicator computation.
- **ordersHistory**: Array of trade objects with properties like `id`, `price`, `sl`, `tp`, `direction`.

### Maps for Associations
- **trailingStopSeriesMap**: Map order IDs to SciChart series for dynamic trailing stop visualization.

### Enums for Constants
- **EnumDirection**: `BULL`, `BEAR`.
- **EnumTradeResult**: `WIN`, `LOSS`, `BE`.
- **EnumActionType**: `VERTICAL_LINE`, `DRAW_A_CIRCLE`, `TAKE_A_TRADE`.
- **EnumStrategy**: Strategy variants.
- **EnumMT5OHLC**: Column indices for CSV data.

## Performance Patterns
### Streaming Processing
- **Incremental Updates**: Avoid loading entire CSV; process row-by-row.
- **Buffering**: Limit memory usage with fixed-size buffers.

### Lazy Evaluation
- **On-Demand Calculations**: Indicators computed only when needed per candle.
- **Conditional Rendering**: Charts update only after full dataset or on refresh.

### Caching
- **MA Calculations**: `simpleMA` recomputed per update; could cache results.
- **Date Conversions**: Unix timestamps cached in annotations.

## Error Handling Patterns
### Defensive Programming
- **Null Checks**: Functions check for undefined inputs (e.g., `convertMT5DateToUnix`).
- **Fallbacks**: Default values for missing parameters (e.g., `getCandleDirection` defaults to BULL).

### Logging
- **Console Output**: Errors logged to console (e.g., PapaParse error callback).
- **Silent Failures**: Some functions return early without errors for robustness.

## UI Patterns
### Component-Based Layout
- **Panel System**: Result panels toggle visibility with CSS classes.
- **Grid Layout**: Config inputs arranged in flex grids for responsiveness.

### Progressive Enhancement
- **Basic Functionality**: Works without JS (form inputs), enhanced with scripting.
- **Fallbacks**: Audio fails silently if Web Audio not supported.

## Code Organization
### Functional Decomposition
- **Small Functions**: Each function has single responsibility (e.g., `calcATR`, `checkForTPSLHit`).
- **Global Scope**: All functions attached to `window` for HTML access.

### Configuration-Driven
- **URL Params**: Settings persisted in query string for shareability.
- **Dynamic Configs**: Inputs read dynamically via `getElementById` and `.value`.

## Extensibility Patterns
### Plugin Architecture
- **Indicator Extensions**: New indicators can be added to `appendIndicatorsToChart`.
- **Strategy Variants**: Easy to add new `EnumStrategy` cases.

### Modular Indicators
- **Separate Functions**: CSID, ATR, TTR isolated for independent testing/development.
