# Active Context: App6 Backtesting Tool

**Scope:** Documents exclusively the `tools/index6.*` files for the Backtesting app.

## Current Development Focus
- **Primary Goal**: Enhance strategy accuracy and add new indicators for more robust backtesting.
- **Active Task**: Investigating MA acceleration calculation to better detect trending markets.
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
