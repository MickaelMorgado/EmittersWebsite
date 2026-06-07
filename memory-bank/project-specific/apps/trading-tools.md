# Trading Tools (SciChart Backtester)

Advanced backtesting and analysis platform for trading strategies, featuring professional-grade interactive charts.

## Overview

The Trading Tools application (specifically `index6.html`) is a high-performance backtesting environment. It allows users to upload MT5 CSV data, run algorithmic or manual backtests, and visualize results with SciChart.JS.

## Key Features

- **Interactive High-Performance Charting**: Built with SciChart.JS for handling large datasets with low latency.
- **Custom Backtesting Engine**: Supports multiple strategies (CSID, CSID_W_MA, etc.) with configurable parameters.
- **MQL5 Expert Advisor Generator**: Includes a built-in editor to generate MQL5 code based on configured strategies.
- **Google Sheets Integration**: Ability to export backtesting results directly to Google Sheets via Web Apps.
- **Backtesting Controls**: Music player style controls (Play, Pause, Step-Forward) for granular data analysis.
- **Annotation Tools**: Manual charting tools including RR (Risk:Reward), Line, BOS, Circle, and Rectangle tools.

## Technical Details

- **Frontend**: Vanilla HTML/JavaScript, SciChart.JS, Chart.JS (for equity curve), PapaParse (for CSV parsing).
- **Styles**: Custom CSS found in `assets/reusables.css` and `assets/css.css`.
- **Location**:
  - HTML: `tools/index6.html`
  - JavaScript: `tools/index6.js`
- **Dependencies**: SciChart, PapaParse, Chart.JS, FontAwesome.

## Usage

1. Open `tools/index6.html`.
2. Upload a CSV file exported from MetaTrader 5 (MT5).
3. Select a strategy and configure parameters (Lot size, RR, MA period, etc.).
4. Click Play to start the backtest.
5. Review results in the Performance Results and Order History sections.

## 1.3.0 Additions (2026-06-07)

### New endpoint: /api/trading-bot/risk-settings

GET/POST of persistent drawdown thresholds stored at `~/development/MikaBot/risk_settings.json`.

Schema:
```ts
interface RiskSettings {
  daily_drawdown_pct:   number;  // default 5
  weekly_drawdown_pct:  number;  // default 7.5
  monthly_drawdown_pct: number;  // default 10
}
```

Clamped to [0.1, 100] on POST. Consumed by the Risk Agent at /api/trading-bot/agents/risk to gate trade approval.

### New trend-signal fields

- `candle_age_seconds`: seconds since the current 1m candle opened, computed entirely from the broker's two clocks (broker/local timezone offset cancels out — perfect accuracy from any viewer location)
- `ma_50_trend`: derived live in the route from price vs MA50, never read from the cached agent file

### News agent plain_summary

Best-effort LLM-generated plain-language recap of today's top headlines, rendered in the News Agent card under "In Plain Words". Generated via `chatAI(prompt, { provider: 'openrouter', maxTokens: 250 })`. null if the LLM is unavailable or returns nothing usable.

### OpenRouter chain order + timeout

`OPENROUTER_TEXT_MODELS` is now ordered fastest→slowest: llama-3.1-8b → mistral-7b → gemma-3-4b → gemma-4-31b. Each model has a 45s AbortController timeout so a single slow free-tier model doesn't block the whole retry chain. Success is logged as `[openrouter] ✓ <modelname>`.
