# App6 Status Report - 2026-04-02

## Summary
Fixed CSID logic alignment between backtest (BT) and live Expert Advisor (EA) to ensure trades are executed consistently.

---

## Issues Fixed

### 1. CSID Signal Alignment (BT vs EA)
**Problem**: EA was missing valid trades that BT detected (e.g., 11:05 trade on 2026.03.02).

**Root Cause**: 
- BT compares against `highestHighLong[length-2]` - the previous iteration's MAX
- EA was computing fresh MAX each tick and comparing immediately

**Solution**: Added persistent state variables:
- `prev_highest` / `prev_lowest` - stores previous candle's levels
- `UpdatePreviousCSIDLevels()` - updates levels AFTER checking signal
- `CheckCSIDSignal()` - now uses `prev_highest`/`prev_lowest` instead of fresh calculation

**Files Modified**: `tools/index6.js` (lines 3097-3098, 3172-3178, 3211-3212, 3272-3277)

---

### 2. SL/TP Multiplication Removed
**Problem**: EA was multiplying SL and TP by 3x unnecessarily.

**Solution**: Removed extra logic, now uses parametric SL_PRICE and TP_PRICE directly.

**Files Modified**: `tools/index6.js` (lines 3238-3259)

---

### 3. LPRB Button Fix
**Problem**: LPRB button complained about CSV not loaded even when data was cached.

**Solution**: Added fallback check for `cachedCSVData.length > 0` in addition to `cachedFile`.

**Files Modified**: `tools/index6.js` (line 2651)

---

## New Files Created

### tools/glossary.md
Comprehensive terminology reference including:
- Trading Terms: SL, TP, BULL, BEAR, P/L, R
- Technical Indicators: CSID (Change in State of Delivery), ATR, MA, EA, TS
- Web App Elements: RC, BTR, MQL, LPRB
- Data Structures: EnumMT5OHLC, EnumDirection, etc.
- Configuration Parameters

---

## Known Behavior
- Backtest executes trade on NEXT candle after CSID breakout (e.g., breakout at 11:00 → trade at 11:05)
- Live EA now matches this behavior with the prev_highest/prev_lowest approach
- Session time: 09:50 - 11:00 (configurable)

---

## Next Steps
1. Recompile EA and test on historical data
2. Verify 11:05 trade now triggers correctly
3. Compare RC (Results Comparison) panel outputs between BT and EA