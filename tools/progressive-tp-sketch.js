// PROGRESSIVE TP SCALE-OUT STRATEGY
// ================================
// Single entry, multiple partial closes at different R levels

// Strategy Config:
const PROGRESSIVE_TP_CONFIG = {
  totalLots: 2.0,           // Total position size (e.g., 2.0 lots)
  partials: [
    { percent: 0.50, tpR: 1.0 },  // Close 50% at 1R profit
    { percent: 0.25, tpR: 2.0 },  // Close 25% at 2R profit  
    { percent: 0.25, tpR: null }  // Close 25% at final (trailing or end)
  ],
  trailingStartR: 2.0       // Start trailing after this R
};

// New Order Structure:
{
  id: 1,
  time: "2026.03.02 10:00:00",
  price: 1.17226,
  direction: "BULL",
  totalLots: 2.0,           // Total lots
  remainingLots: 2.0,        // Still open
  sl: 1.17126,               // 1R stop
  breakEvenMoved: false,
  
  // Partial close tracking:
  partials: [
    { closedLots: 1.0, closedR: 1.0, closedPrice: 1.17326, pnlR: 1.0 },  // 50%
    { closedLots: 0.5, closedR: 2.0, closedPrice: 1.17426, pnlR: 2.0 }   // 25%
  ],
  closed: false
}

// TP/SL Check Logic:
const checkForTPSLHit = (d) => {
  const high = Number(d[HIGH]);
  const low = Number(d[LOW]);
  const close = Number(d[CLOSE]);
  
  activeOrders.forEach(order => {
    const currentR = order.direction === 'BULL' 
      ? (close - order.price) / localSlSize()      // (price - entry) / R
      : (order.price - close) / localSlSize();     // (entry - price) / R
    
    // 1. Check each partial TP level
    PROGRESSIVE_TP_CONFIG.partials.forEach((partial, idx) => {
      if (partial.tpR === null) return; // Skip final
      
      const alreadyClosed = order.partials.some(p => p.closedR === partial.tpR);
      if (alreadyClosed) return;
      
      if (currentR >= partial.tpR) {
        // Close this portion
        const lotsToClose = order.totalLots * partial.percent;
        const closedPrice = order.direction === 'BULL' 
          ? order.price + (partial.tpR * localSlSize())
          : order.price - (partial.tpR * localSlSize());
        
        order.partials.push({
          closedLots: lotsToClose,
          closedR: partial.tpR,
          closedPrice: closedPrice,
          pnlR: partial.tpR
        });
        order.remainingLots -= lotsToClose;
        
        console.log(`🔒 Partial close: ${lotsToClose} lots at ${partial.tpR}R`);
      }
    });
    
    // 2. Update trailing stop (if enabled)
    if (currentR >= PROGRESSIVE_TP_CONFIG.trailingStartR && !order.trailingStarted) {
      order.trailingStarted = true;
      order.trailingStartPrice = close;
    }
    
    if (order.trailingStarted) {
      const newSL = order.direction === 'BULL'
        ? close - localTsSize()
        : close + localTsSize();
      order.sl = newSL;
    }
    
    // 3. Check final close (SL or end of data)
    if (order.remainingLots > 0) {
      const hitSL = order.direction === 'BULL' 
        ? low <= order.sl 
        : high >= order.sl;
      
      if (hitSL) {
        const lotsToClose = order.remainingLots;
        const closedPrice = order.sl;
        
        order.partials.push({
          closedLots: lotsToClose,
          closedR: currentR,
          closedPrice: closedPrice,
          pnlR: currentR,
          reason: 'SL'
        });
        order.remainingLots = 0;
        order.closed = true;
        order.closedPrice = closedPrice;
        order.closedOrderType = 'CLOSED_BY_SL';
      }
    }
    
    // 4. Mark fully closed if no remaining lots
    if (order.remainingLots <= 0.001) { // floating point tolerance
      order.closed = true;
    }
  });
}

// Result Calculation:
const calculateResults = () => {
  let totalPnlR = 0;
  let wins = 0;
  let losses = 0;
  
  localOrdersHistory.forEach(order => {
    order.partials.forEach(partial => {
      // Each partial is a "mini trade"
      if (partial.pnlR > 0) {
        totalPnlR += partial.pnlR * partial.closedLots;
        wins++;
      } else if (partial.pnlR < 0) {
        totalPnlR += partial.pnlR * partial.closedLots;
        losses++;
      }
    });
  });
  
  // Compare to single-position strategy:
  // Single: 2.0 lots at 1R = +2.0R
  // Progressive: 1.0*1R + 0.5*2R + 0.5*(-1R) = 1.0 + 1.0 - 0.5 = 1.5R
};

// Example Results Comparison:
// ==========================
// Random walk simulation (1000 trades):
//
// Single Position (2.0 lots, TP at 1R):
//   - Win rate: 50%
//   - Avg win: +2.0R
//   - Avg loss: -1.0R  
//   - Expected: 0.5 * 2 - 0.5 * 1 = +0.5R per trade
//
// Progressive TP (this strategy):
//   - 50% closed at 1R: +0.5R * 50% = +0.25R expected
//   - 25% closed at 2R: +0.5R * 25% = +0.125R expected
//   - 25% runs: (let's say 30% win at 3R, 70% lose at -1R)
//     = 0.25 * (0.3 * 3 + 0.7 * (-1)) = 0.25 * 0.2 = +0.05R
//   - Total expected: +0.25 + 0.125 + 0.05 = +0.425R
//
// Actually worse in pure randomness! But safer (smaller max loss)