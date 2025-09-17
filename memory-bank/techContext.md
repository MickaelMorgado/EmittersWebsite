# Tech Context

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Languages & Standards
- JavaScript (ES6)
- HTML5
- CSS3 (Custom properties, Flexbox)

## Libraries & Frameworks
- PapaParse v5.3.0 (CSV parsing, step-by-step streaming)
- SciChart.js v3.5.x (real-time candlestick charting with WebAssembly)
- Chart.js (equity curve rendering)
- Font Awesome (iconography)
- Axios (HTTP requests, unused in core)
- UI-Avatars (favicon generation)

## Architecture & Patterns
- **Event-Driven**: DOM events trigger parsing, chart updates, and UI toggles.
- **Streaming Parser**: CSV is processed row-by-row with `Papa.parse` in step mode.
- **Step Pipeline**: Each candle passes through update → indicators → trade logic → rendering.
- **Global Exposure**: Core functions are attached to `window` for in-browser REPL/workflow.
