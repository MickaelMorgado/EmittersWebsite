# System Patterns

## New App Entry Checklist

When adding a new app to the homepage:

1. **`src/app/page.tsx`**: Add entry to `PROJECTS` object with `{ title, description, href, accentColor, isPublic? }`
2. **Auth protection**: If `isPublic: false` (or omitted), add cookie-based auth check in the page component:
   - Check `site_unlocked=true` cookie on mount
   - Show lock screen with password input if not unlocked
   - Use `AUTH_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD` for validation
   - Pattern: see `investments/page.tsx` or `llm-rules/page.tsx`
3. **API routes**: If the app has backend logic, create routes under `src/app/api/<app-name>/route.ts`
4. **Credentials**: Never hardcode secrets — always use `.env` with `NEXT_PUBLIC_` prefix for client-side vars
5. **Memory bank**: Update `memory-bank/apps-overview.md` with the new entry

## Project Structure
- **Root**: Contains the main website (`index.html`) and sub-pages (`mika.html`, `tools.html`).
- **assets/**: Shared resources (CSS, JS, Images, Videos, Fonts).
- **tools/**: Directory for auxiliary web apps.
    - **index6.html/js/css**: The **Backtesting App**.
- **memory-bank/**: Project documentation.

## Main Website Architecture
- **Single Page Application (SPA)-like feel**: Uses `jquery.scrollify` for section-based scrolling.
- **Dynamic Content**: Uses `lozad` for lazy loading images/videos, `slick` for carousels.
- **Styling**: `assets/css.css` (core), `assets/desktop.css`, `assets/mobile.css` for responsive design.

## Backtesting Tool Architecture (`tools/index6.*`)

### 1. CSV Loading & Parsing
- User selects a CSV file via `<input id="csvFileInput">`.
- `Papa.parse` reads the file in **step** mode, invoking a callback on each row.
- Parser is paused/resumed between rows to throttle processing (controlled by `readingSpeed` and pause checkbox).

### 2. Per-Candle Processing Pipeline
On each parsed candle (`results.data`):
- **Dynamic Info Update**: `updateDynamicInfos` updates current date, progression bar.
- **Chart Update**:
    - `appendDataToChart` calls `addNewCandleToChart` to append to SciChart’s OHLC series.
    - `addBacktestingDateTimeToChart` adds vertical lines at session boundaries and populates date dropdown.
- **Indicator Computation & Annotation**:
    - `appendIndicatorsToChart` invokes:
    - `updateCSIDLineAnnotation` (CSID breakout detection + MA trend check)
    - `inTradingTimeRange` (sets time-in-range flag)
    - `calcATR` (ATR threshold detection)
- **Trade Logic**:
    - `checkForTPSLHit` scans open orders for TP/SL hits or adjusts trailing stops.
    - `profitabilityCalculation` recomputes P/L, win rate, equity series, and re-renders Chart.js chart and order table.

### 3. Chart Initialization & Themes
- `initSciChart` sets up SciChartSurface with:
    - DateTime X-axis, Numeric Y-axis
    - Candlestick series (FastCandlestickRenderableSeries)
    - Custom theme based on URL parameters (bullish/bearish colors)
    - Chart modifiers (cursor, zoom, pan)
    - Annotation series for signals and trade entry/exit

### 4. User Interaction & Controls
- Toolbar toggles (`revealAlgoEditor`, `revealAlgo`, `revealReview`) switch result-panel views.
- Controls for session start/end, risk inputs (lot size, SL/TP, trailing stop).
- “Refresh” button re-runs backtest on the same file.
- Embedded “Algo Editor” textareas allow dynamic injection of custom JS per candle.

### 5. Modularity & Event-Driven Flow
- Core functions are attached to `window` for global access (e.g., `window.calcATR`, `window.profitabilityCalculation`).
- Event listeners orchestrate pipeline triggers (file input change, button clicks, select “change”).

## AI Provider Layer (`node-projects/my-app/src/lib/ai.ts`)

The `chatAI()` helper is a unified entry point that fronts three independent LLM providers, allowing the rest of the codebase to remain provider-agnostic.

### Providers exposed
- **OpenAI** — direct `https://api.openai.com/v1/chat/completions`, model overridable via `OPENAI_MODEL` (default `gpt-4o-mini`), `max_tokens: 800`.
- **OpenRouter** — `https://openrouter.ai/api/v1/chat/completions`, `max_tokens: 800`, sends `HTTP-Referer` / `X-Title` headers for OpenRouter attribution. Runs through a **sequential model chain** (see below).
- **Ollama (local)** — `http://localhost:11434/api/chat` with `OLLAMA_HOST` and `OLLAMA_MODEL` env vars (default `llama2:7b`), streams disabled.

### Provider selection & fallback
- `chatAI(prompt, { provider: 'openai' | 'openrouter' | 'ollama' })` forces a specific provider.
- When no `provider` is supplied (auto mode) and `OPENAI_API_KEY` is set, OpenAI is tried first; on empty content it falls back to OpenRouter. With no OpenAI key, OpenRouter is the default.
- When a specific provider is forced and `fallback: false`, the call returns whatever that provider produced even on failure.
- All three providers return a uniform `AIResponse { content, provider, error? }` shape.

### OpenRouter model chain (with env override)
```ts
const OPENROUTER_TEXT_MODELS = [
  process.env.OPENROUTER_MODEL,                          // env override
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
].filter(Boolean);
```
- Tried **sequentially**; first model to return non-empty `choices[0].message.content` wins.
- All models capped at `max_tokens: 800`.
- **Why this chain:** the previous chain (`deepseek-v4-flash:free`, `qwen3-next-80b-a3b-instruct:free`, `llama-3.3-70b-instruct:free`) was returning empty / errored responses in production, breaking trade-analysis notes generation.

### `parseJSON` strategy
`parseJSON<T>(response: string): T | null` tries in order:
1. **Direct** `JSON.parse(response)`.
2. **Markdown fence** — extract first ```json … ``` block.
3. **Prefix strip** — drop everything before the first `{` or `[` and re-parse.
4. **Object match** — first `{…}` substring.
5. **Array match** — first `[…]` substring.
6. Returns `null` on full failure.
- This was hardened in 1.2.1: the older single `{[\s\S]*}` regex over-matched into prose when the LLM emitted commentary alongside JSON; adding prefix-strip and array-match recovers the actual payload.
