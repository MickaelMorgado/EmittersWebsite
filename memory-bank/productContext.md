# Product Context

## Emitters - Drone Invasion (Game Website)
The main website acts as the public face of the game.
- **Goal**: Convert visitors into players/buyers on Steam and Ultra.
- **Key Sections**:
    - **Home**: Trailer, core value prop.
    - **Story**: Narrative background and lore.
    - **Features**: Weapons, Supports, Enemies (Drones/Androids).
    - **Gallery & Media**: Visual assets.

## Personal CV/Portfolio Page (mika.html)
A dedicated personal portfolio and CV page showcasing professional achievements and social media presence.
- **Technology Stack**: Modern web technologies including Bootstrap 4.5.2, TailwindCSS, Spline 3D viewer, Google Fonts (Inter, Saira Condensed, Teko), Chart.js, jQuery, and Selectize.js.
- **Design**: Dark gradient theme with red accent color (#ff394a), responsive grid layout (1-3 columns), hover animations with background zoom effects, and professional HYTEK branding.
- **Portfolio Sections**:
    - **3D Prints/Models**: Links to Cults3d profile for 3D printing projects.
    - **YouTube Channel**: Technical content and project demonstrations (@HYTEK94).
    - **TikTok**: Short-form content (@mickaelmorgado7).
    - **Game Development**: Personal game project (Emitters) with dedicated website.
    - **Instagram Accounts**: Personal (@mickaelmorgado31) and business/art (@noirdrivenantagonists) profiles.
- **Interactive Features**: Spline 3D background viewer, dynamic title switching, and smooth CSS transitions.

## Backtesting Tool (Internal)
**Scope:** `tools/index6.*`

This tool is designed for traders who want to develop, test, and refine algorithmic strategies against historical market data. Key user workflows:

1. **Import Data**: Export and upload CSV bar data from MetaTrader 5 covering a chosen time range.
2. **Configure**: Set session parameters (start/end times) and risk settings (lot size, SL/TP, trailing stop).
3. **Simulate**: Step through each candlestick; the app draws bars on a SciChart chart, computes signals (CSID breakout, ATR threshold, time-in-range window, moving average trend), and applies entry/exit rules in real-time.
4. **Analyze**: View detailed results: per-trade logs, performance metrics (win rate, profit factor, equity curve), and historical order table.
5. **Iterate**: Tweak strategy code in the embedded “Algo Editor” textarea and re-run the backtest instantly.
6. **Export**: Automatically append the results to a shared Google Sheet for team tracking.


The interface balances visual charting, code-driven strategy customization, and data-driven performance feedback to streamline quantitative strategy development.
