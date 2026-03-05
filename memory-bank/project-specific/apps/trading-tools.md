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
