// MULTI-POSITION STRATEGY: 3 TRADES, SAME ENTRY, DIFFERENT LOTS
// =============================================================

const MULTI_POSITION_CONFIG = {
  // Lot sizing: 1.0 + 0.7 + 0.5 = 2.2 total lots
  positions: [
    { lot: 1.0, name: 'A', slMoveStartR: 0.5, trailingStartR: 2.0 },  // Aggressive
    { lot: 0.7, name: 'B', slMoveStartR: 1.0, trailingStartR: 3.0 },  // Medium
    { lot: 0.5, name: 'C', slMoveStartR: 1.5, trailingStartR: 4.0 }   // Conservative
  ],
  baseSL: 0.001,      // 1R = 100 pips (0.001)
  baseTP: 0.006,      // 6R = 600 pips
  trailingSize: 0.0003  // 0.3R trailing after trigger
};

// Entry: Open all 3 positions at once
const openMultiPosition = (direction, entryPrice) => {
  const isBull = direction === 'BULL';
  const sl = isBull ? entryPrice - MULTI_POSITION_CONFIG.baseSL 
                    : entryPrice + MULTI_POSITION_CONFIG.baseSL;
  const tp = isBull ? entryPrice + MULTI_POSITION_CONFIG.baseTP 
                    : entryPrice - MULTI_POSITION_CONFIG.baseTP;
  
  MULTI_POSITION_CONFIG.positions.forEach(posConfig => {
    const order = {
      id: `pos${posConfig.name}-${Date.now()}`,
      name: posConfig.name,
      lot: posConfig.lot,
      direction: direction,
      price: entryPrice,
      sl: sl,
      tp: tp,
      initialSL: sl,
      trailingStartR: posConfig.trailingStartR,
      slMoveStartR: posConfig.slMoveStartR,
      slMoveCount: 0,
      trailingActive: false,
      trailingStartPrice: null,
      closed: false,
      closedPrice: null,
      closedTime: null,
      pnlR: 0
    };
    orders.push(order);
    console.log(`📈 Opened Position ${posConfig.name}: ${posConfig.lot} lots @ ${entryPrice}`);
  });
};

// Check TP/SL for all positions (called each candle)
const checkMultiPositionTPSL = (d) => {
  const high = Number(d[HIGH]);
  const low = Number(d[LOW]);
  const close = Number(d[CLOSE]);
  
  orders.forEach(order => {
    if (order.closed) return;
    
    // Calculate current R
    const currentR = order.direction === 'BULL'
      ? (close - order.price) / MULTI_POSITION_CONFIG.baseSL
      : (order.price - close) / MULTI_POSITION_CONFIG.baseSL;
    
    // 1. SL Movement (progressive SL updates)
    if (!order.trailingActive && currentR >= order.slMoveStartR + (order.slMoveCount * 0.5)) {
      const newSL = order.direction === 'BULL'
        ? order.price + (order.slMoveStartR * MULTI_POSITION_CONFIG.baseSL) + (order.slMoveCount * 0.5 * MULTI_POSITION_CONFIG.baseSL)
        : order.price - (order.slMoveStartR * MULTI_POSITION_CONFIG.baseSL) - (order.slMoveCount * 0.5 * MULTI_POSITION_CONFIG.baseSL);
      
      order.sl = newSL;
      order.slMoveCount++;
      console.log(`🔒 Position ${order.name}: SL moved to ${newSL.toFixed(5)} (${currentR.toFixed(2)}R)`);
    }
    
    // 2. Activate Trailing
    if (currentR >= order.trailingStartR && !order.trailingActive) {
      order.trailingActive = true;
      order.trailingStartPrice = close;
      console.log(`🏃 Position ${order.name}: Trailing activated at ${currentR.toFixed(2)}R`);
    }
    
    // 3. Update Trailing SL
    if (order.trailingActive) {
      const newTrailingSL = order.direction === 'BULL'
        ? close - MULTI_POSITION_CONFIG.trailingSize
        : close + MULTI_POSITION_CONFIG.trailingSize;
      
      // Only move SL, never backward
      const slImprove = order.direction === 'BULL' 
        ? newTrailingSL > order.sl 
        : newTrailingSL < order.sl;
      
      if (slImprove) {
        order.sl = newTrailingSL;
        console.log(`↔️ Position ${order.name}: Trailing SL updated to ${newTrailingSL.toFixed(5)}`);
      }
    }
    
    // 4. Check for close (SL hit)
    const hitSL = order.direction === 'BULL' 
      ? low <= order.sl 
      : high >= order.sl;
    
    if (hitSL) {
      order.closed = true;
      order.closedPrice = order.sl;
      order.pnlR = order.direction === 'BULL'
        ? (order.sl - order.price) / MULTI_POSITION_CONFIG.baseSL
        : (order.price - order.sl) / MULTI_POSITION_CONFIG.baseSL;
      
      console.log(`❌ Position ${order.name} CLOSED by SL @ ${order.sl.toFixed(5)} (${order.pnlR.toFixed(2)}R)`);
    }
  });
};

// Example Run:
// =============
// Entry @ 1.1700 BULL
// 
// Price → 1.1710 (+1.0R)
//   Position A: SL moved to break-even (1.1700)
//   Position B: SL still at 1.1690 (needs +1.0R for move)
//   Position C: SL still at 1.1690 (needs +1.5R for move)
// 
// Price → 1.1720 (+2.0R)
//   Position A: Trailing active, SL @ 1.1717
//   Position B: SL moved to +1.0R (1.1710)
//   Position C: SL still at 1.1690
// 
// Price → 1.1740 (+4.0R)
//   Position A: Trailing SL @ 1.1737, still in
//   Position B: Trailing active, SL @ 1.1737
//   Position C: SL moved to +1.5R (1.1715)
// 
// Price → 1.1760 (+6.0R) then drops to 1.1735
//   Position A: Trailing hit @ 1.1737 → closed +3.7R
//   Position B: Trailing hit @ 1.1737 → closed +3.7R  
//   Position C: Still running, SL @ 1.1715 → still in
// 
// Position C eventually closes at end: +6R
//
// Total PnL: A(3.7R × 1.0) + B(3.7R × 0.7) + C(6R × 0.5) = 3.7 + 2.59 + 3 = 9.29R


// COMPARISON: Single Position
// ===========================
// Single 2.2 lots @ 1.1700, TP at +2R, SL at -1R
// - If hits TP: +4.4R (2 × 2.2)
// - If hits SL: -2.2R (1 × 2.2)
// - 50% win rate expected: (0.5 × 4.4) - (0.5 × 2.2) = +1.1R
//
// Multi-Position:
// - More trades stay alive longer
// - Catches big trends better
// - Smaller individual losses when A/B close


// INTEGRATION WITH EXISTING STRATEGY
// ==================================
// In your existing checkSignalsForTrade():
// 
// Instead of:
//   localOrdersHistory.push({ ... single order ... });
// 
// Do:
//   openMultiPosition(direction, entryPrice);
// 
// In checkForTPSLHit():
//   Replace existing logic with checkMultiPositionTPSL(d);