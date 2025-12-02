# Active Context: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Current Development Focus
- **Primary Goal**: Enhance strategy accuracy and add new indicators for more robust backtesting.
- **Completed Task**: ✅ Added clickable rows to Historical Orders Table for chart navigation to trade dates.
- **Active Task**: Add music-player style backtesting controls (play/pause, next step).
- **Implementation Plan**: Replace checkbox with button panel for play/pause toggle and single-step advancement.
- **Next Steps**: Implement RSI or Stochastic oscillators as additional filters.

## Open Questions
- How to optimize ATR calculation for longer periods without performance hit?
- Should trailing stop logic be moved to a separate module for easier testing?
- Potential for Web Workers to offload chart rendering during streaming?

## Recent Insights
- Dynamic trailing stop sizing improves win rate by adapting to volatility.
- Theme persistence via URL works well for sharing configurations.
- PapaParse streaming is effective but could benefit from worker threads for very large files.

## Code Review Notes
- `checkForTPSLHit` is complex; consider splitting into smaller functions.
- Global variables are convenient but make testing harder; consider refactoring to a state object.
- Error handling is minimal; add try-catch blocks around critical paths.

## User Feedback
- Requests for more export formats (PDF reports, images).
- Desire for real-time parameter adjustment during backtesting (sliders instead of inputs).
- Suggestion to add sound toggles for audio feedback.

## Current User Settings
- **URL Parameters**: ?btt=09%3A50%3A00&ett=20%3A30%3A00&maperiod=3&lotsize=1.0&commissionsize=0.00005&slpoints=0.001&tppoints=0.006&tsincrement=0.0001&strategy=CSID_W_MA_DynamicTS&theme=
- **CSV Filename**: EURUSD_M5_202505011000_202508012355
- **Note**: If user asks about this CSV file, remind them of these parameters.
- **Historical Orders Table Columns**: ID, Time, Price, SL, TP, Direction, Closed Order Type, Closed Price, Closed Time, P/L (Points)

## Win Rate Calculation Decision
- **Chosen Approach**: Keep current implementation (any positive trade = win) to maintain code simplicity
- **Rationale**: Avoid code extension that could lead to maintenance difficulties and increased token counts for AI prompting
- **Benefits**: Realistic profitability assessment, accounts for trailing stop benefits, standard win rate metric

## Debugging Aids
- Console logs in `updateCSIDLineAnnotation` for signal debugging.
- Breakpoints in `profitabilityCalculation` to inspect trade arrays.
- Use browser profiler for memory leaks during long backtests.

## Collaboration Notes
- Code is self-contained; easy to share as single HTML/JS files.
- No version control conflicts expected due to single-file structure.
- Documentation updates needed after any major feature additions.

## Risks and Mitigations
- **SciChart Dependency**: If CDN fails, app breaks; mitigate by bundling or adding fallbacks.
- **Browser Limits**: Large datasets hit memory limits; mitigate with data chunking.
- **User Errors**: Invalid CSV formats cause failures; add validation and error messages.
