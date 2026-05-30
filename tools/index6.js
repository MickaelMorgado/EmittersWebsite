// Store parsed CSV data in memory for multiple backtest runs
let cachedCSVData = [];
let cachedFileInfo = null;
let cachedFile = null;

// Store backtest results for comparison
let backtestResults = [];
window.backtestResults = backtestResults;

// Saved parameter sets
let savedParamSets = [];
window.savedParamSets = savedParamSets;

const EnumclosedOrderType = {
  PENDING: 'PENDING',
  CLOSED_BY_TP: 'CLOSED_BY_TP',
  CLOSED_BY_SL: 'CLOSED_BY_SL',
};
const EnumTradeResult = {
  WIN: 'WIN',
  LOSS: 'LOSS',
  BE: 'BE',
};
const EnumDirection = {
  BULL: 'BULL',
  BEAR: 'BEAR',
};

// Multi-position strategy presets
const MULTI_POSITION_PRESETS = {
  single: {
    enabled: false,
    positions: []
  },
  'c-only': {
    enabled: true,
    positions: [
      { lot: 0.5, name: 'C', slMoveStartR: 1.0, trailingStartR: 2.5, lotMultiplier: 0.5, tpMultiplier: 0.5 }
    ]
  },
  balanced: {
    enabled: true,
    positions: [
      { lot: 0.5, name: 'A', slMoveStartR: 0.3, trailingStartR: 0.8, lotMultiplier: 0.5, tpMultiplier: 1.0 },
      { lot: 0.7, name: 'B', slMoveStartR: 0.7, trailingStartR: 1.5, lotMultiplier: 0.7, tpMultiplier: 0.7 },
      { lot: 1.0, name: 'C', slMoveStartR: 1.0, trailingStartR: 2.5, lotMultiplier: 1.0, tpMultiplier: 0.5 }
    ]
  },
  equal: {
    enabled: true,
    positions: [
      { lot: 1.0, name: 'A', slMoveStartR: 0.3, trailingStartR: 0.8, lotMultiplier: 1.0, tpMultiplier: 1.0 },
      { lot: 1.0, name: 'B', slMoveStartR: 0.7, trailingStartR: 1.5, lotMultiplier: 1.0, tpMultiplier: 1.0 },
      { lot: 1.0, name: 'C', slMoveStartR: 1.0, trailingStartR: 2.5, lotMultiplier: 1.0, tpMultiplier: 1.0 }
    ]
  },
  aggressive: {
    enabled: true,
    positions: [
      { lot: 0.3, name: 'A', slMoveStartR: 0.3, trailingStartR: 0.8, lotMultiplier: 0.3, tpMultiplier: 1.5 },
      { lot: 0.7, name: 'B', slMoveStartR: 0.7, trailingStartR: 1.5, lotMultiplier: 0.7, tpMultiplier: 0.7 },
      { lot: 1.5, name: 'C', slMoveStartR: 1.0, trailingStartR: 2.5, lotMultiplier: 1.5, tpMultiplier: 0.3 }
    ]
  },
  conservative: {
    enabled: true,
    positions: [
      { lot: 0.5, name: 'A', slMoveStartR: 0.25, trailingStartR: 0.6, lotMultiplier: 0.5, tpMultiplier: 0.5 },
      { lot: 0.5, name: 'B', slMoveStartR: 0.6, trailingStartR: 1.2, lotMultiplier: 0.5, tpMultiplier: 0.5 },
      { lot: 0.5, name: 'C', slMoveStartR: 1.0, trailingStartR: 2.0, lotMultiplier: 0.5, tpMultiplier: 0.5 }
    ]
  },
  'balanced-runner': {
    enabled: true,
    positions: [
      { lot: 0.5, name: 'A', slMoveStartR: 0.3, trailingStartR: 0.8, lotMultiplier: 0.5, tpMultiplier: 1.0 },
      { lot: 0.7, name: 'B', slMoveStartR: 0.7, trailingStartR: 1.5, lotMultiplier: 0.7, tpMultiplier: 0.7 },
      { lot: 1.0, name: 'C', slMoveStartR: 1.0, runToTP: true, lotMultiplier: 1.0, tpMultiplier: 0.5 }
    ]
  },
  'aggressive-runner': {
    enabled: true,
    positions: [
      { lot: 0.3, name: 'A', slMoveStartR: 0.3, trailingStartR: 0.8, lotMultiplier: 0.3, tpMultiplier: 1.5 },
      { lot: 0.7, name: 'B', slMoveStartR: 0.7, trailingStartR: 1.5, lotMultiplier: 0.7, tpMultiplier: 0.7 },
      { lot: 1.5, name: 'C', slMoveStartR: 1.0, runToTP: true, lotMultiplier: 1.5, tpMultiplier: 0.3 }
    ]
  }
};

// Get preset from dropdown, URL, or default to 'balanced'
const getMultiPositionConfig = () => {
  // First check dropdown value
  const dropdown = document.getElementById('multiPositionPreset');
  let presetKey = 'balanced';
  if (dropdown && dropdown.value) {
    presetKey = dropdown.value;
  } else {
    // Fall back to URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    presetKey = urlParams.get('multipreset') || 'balanced';
  }
  const config = MULTI_POSITION_PRESETS[presetKey] || MULTI_POSITION_PRESETS.balanced;
  return { ...config, presetName: presetKey };
};

// Run optimized backtest (no chart rendering)
const runOptimizedBacktest = (params, csvRows) => {
  // Get multi-position config from params preset (if provided), otherwise from dropdown
  let MULTI_POSITION_CONFIG;
  if (params && params.preset) {
    // Use preset from params (for Grid Search)
    const presetKey = params.preset;
    const config = MULTI_POSITION_PRESETS[presetKey] || MULTI_POSITION_PRESETS.balanced;
    MULTI_POSITION_CONFIG = { ...config, presetName: presetKey };
  } else {
    // Fall back to reading from dropdown
    MULTI_POSITION_CONFIG = getMultiPositionConfig();
  }
  console.log('Multi-position preset:', MULTI_POSITION_CONFIG.enabled ?
    `enabled (${MULTI_POSITION_CONFIG.positions.length} positions)` : 'disabled');
  
  // Reset state for new backtest run
   const localOrdersHistory = [];
   let localCSIDLookbackCandleSerie = [];
   let localCSIDSignalTriggered = false;
   let localCSIDCoolddownSignal = 5;
   let localCandlesFromBuffer = [];
   let localChartCandleIndex = 0;
   let localCandleTimes = [];
   let localTimeToIndex = new Map();
   let localNumbDays = 0;
   let localProcessedDays = 0;
   let localTradeCount = 0;
   
       // Monthly max loss tracking
       let localCurrentMonth = null;
       let localMonthlyMaxLossPercent = params.monthlyMaxLossPercent || 5; // Default 5%
       let localMonthlyPnl = 0; // Track monthly P&L in money terms
       const MONTHLY_START_EQUITY = 10000; // Assume $10k starting equity
       
       // Reset monthly P&L on new month
       const checkMonthlyReset = (candleDate) => {
         const month = candleDate?.slice(0, 7); // "2026.03"
         if (month && month !== localCurrentMonth) {
           localCurrentMonth = month;
           localMonthlyPnl = 0;
           console.log(`New month: ${month}, monthly max loss: ${localMonthlyMaxLossPercent}%`);
         }
       };
   // Local state for indicators
   let localHighestHighLong = [];
  let localLowestLowShort = [];
  let localListeningATR = true;
  let localCanTakeATrade = true;
  
  const localSlSize = () => params.slSize;
  const localTpSize = () => params.tpSize;
  const localLotSize = () => params.lotSize;
  const localCommissionSize = () => params.commissionSize;
  const localTsSize = () => params.tsSize;
  const localMaPeriod = () => params.maPeriod;
  const localMaThreshold = () => params.maThreshold;
  const localStrategy = params.strategy;
  const localSessionStart = params.sessionStart;
  const localSessionEnd = params.sessionEnd;
  
  const localArrayOfSignals = [false, true, false, false]; // [CSID, TTR, ATR, MADirection]
  const lookbackPeriod = 20;
  
  const getCandleDirection = (openPrice = 0, closePrice = 0) => {
    if (openPrice == 0 || closePrice == 0) return 'BULL';
    return closePrice > openPrice ? 'BULL' : 'BEAR';
  };
  
  const convertMT5DateToUnix = (candleTime) => {
    const ct = candleTime.replaceAll('.', '-');
    return new Date(ct).getTime() / 1000;
  };
  
  const inTradingTimeRange = (d) => {
    // Convert MT5 date format (YYYY.MM.DD) to JS format (YYYY-MM-DD)
    const dateFormatted = d[EnumMT5OHLC.DATE].replaceAll('.', '-');
    const startRangeTime = new Date(`${dateFormatted} ${localSessionStart}`);
    const endRangeTime = new Date(`${dateFormatted} ${localSessionEnd}`);
    const currentTime = new Date(`${dateFormatted} ${d[EnumMT5OHLC.TIME]}`);
    localArrayOfSignals[1] = currentTime >= startRangeTime && currentTime <= endRangeTime;
  };
  
  const calcATR = (d, dataIndex) => {
    const ATRLength = 20;
    const atrMultiplierThreshold = 1.2;
    
    if (dataIndex < ATRLength || !localListeningATR || !localArrayOfSignals[1]) return;
    
    const lastIndex = localCandlesFromBuffer.length - 1;
    if (lastIndex < 1) return;
    
    const currCandle = localCandlesFromBuffer[lastIndex];
    const prevCandle = localCandlesFromBuffer[lastIndex - 1];
    
    const currTR = Math.max(
      currCandle[EnumMT5OHLC.HIGH] - currCandle[EnumMT5OHLC.LOW],
      Math.abs(currCandle[EnumMT5OHLC.HIGH] - prevCandle[EnumMT5OHLC.CLOSE]),
      Math.abs(currCandle[EnumMT5OHLC.LOW] - prevCandle[EnumMT5OHLC.CLOSE])
    );
    
    let trSum = 0;
    for (let i = Math.max(1, localCandlesFromBuffer.length - ATRLength); i < localCandlesFromBuffer.length; i++) {
      const c = localCandlesFromBuffer[i];
      const pc = localCandlesFromBuffer[i - 1];
      trSum += Math.max(
        c[EnumMT5OHLC.HIGH] - c[EnumMT5OHLC.LOW],
        Math.abs(c[EnumMT5OHLC.HIGH] - pc[EnumMT5OHLC.CLOSE]),
        Math.abs(c[EnumMT5OHLC.LOW] - pc[EnumMT5OHLC.CLOSE])
      );
    }
    const atr = trSum / Math.min(ATRLength, localCandlesFromBuffer.length);
    
    if (currTR > atr * atrMultiplierThreshold) {
      localListeningATR = false;
      localArrayOfSignals[2] = true;
    }
  };
  
  const simpleMA = (candles, period) => {
    if (candles.length < period) return 0;
    let sum = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
      sum += Number(candles[i][EnumMT5OHLC.CLOSE]);
    }
    return sum / period;
  };
  
  const computeMAAccel = (maArray) => {
    const len = maArray.length;
    if (len < 3) return 0;
    return maArray[len - 1] - 2 * maArray[len - 2] + maArray[len - 3];
  };
  
  // Process each candle
  csvRows.forEach((row, idx) => {
    if (!row[EnumMT5OHLC.OPEN]) return;
    
    if (row[EnumMT5OHLC.OPEN] === row[EnumMT5OHLC.HIGH] &&
        row[EnumMT5OHLC.HIGH] === row[EnumMT5OHLC.LOW] &&
        row[EnumMT5OHLC.LOW] === row[EnumMT5OHLC.CLOSE]) return;
    
    const dataIndex = idx;
    
    if (localCandlesFromBuffer.length >= 10) {
      localCandlesFromBuffer.shift();
    }
    localCandlesFromBuffer.push(row);
    
    const candleDateTime = `${row[EnumMT5OHLC.DATE]} ${row[EnumMT5OHLC.TIME]}`;
    const unixTime = convertMT5DateToUnix(candleDateTime);
    localCandleTimes.push(unixTime);
    localTimeToIndex.set(unixTime, localChartCandleIndex);
    localChartCandleIndex++;
    
    if (row[EnumMT5OHLC.DATE] !== (localCandlesFromBuffer[localCandlesFromBuffer.length - 2]?.[EnumMT5OHLC.DATE])) {
      localProcessedDays++;
    }
    
    // Check for new month and reset monthly P&L
    checkMonthlyReset(row[EnumMT5OHLC.DATE]);
    
    inTradingTimeRange(row);
    calcATR(row, dataIndex);
    
    if (dataIndex >= lookbackPeriod) {
      localCSIDLookbackCandleSerie.push(row);
      
      const recentCandles = localCSIDLookbackCandleSerie.slice(-lookbackPeriod - 1);
      if (recentCandles.length >= lookbackPeriod) {
        const highPrices = recentCandles.slice(0, lookbackPeriod).map(c => 
          getCandleDirection(Number(c[EnumMT5OHLC.OPEN]), Number(c[EnumMT5OHLC.CLOSE])) === 'BULL' 
            ? Number(c[EnumMT5OHLC.CLOSE]) : Number(c[EnumMT5OHLC.OPEN])
        );
        const lowPrices = recentCandles.slice(0, lookbackPeriod).map(c => 
          getCandleDirection(Number(c[EnumMT5OHLC.OPEN]), Number(c[EnumMT5OHLC.CLOSE])) === 'BULL' 
            ? Number(c[EnumMT5OHLC.OPEN]) : Number(c[EnumMT5OHLC.CLOSE])
        );
        
        localHighestHighLong.push(Math.max(...highPrices));
        localLowestLowShort.push(Math.min(...lowPrices));
        
        const currentClose = Number(row[EnumMT5OHLC.CLOSE]);
        const bullishCSID = currentClose > localHighestHighLong[localHighestHighLong.length - 2];
        const bearishCSID = currentClose < localLowestLowShort[localLowestLowShort.length - 2];
        
        const maArray = [];
        for (let i = Math.max(0, localCSIDLookbackCandleSerie.length - 10); i < localCSIDLookbackCandleSerie.length; i++) {
          maArray.push(simpleMA(localCSIDLookbackCandleSerie.slice(0, i + 1), 6));
        }
        const accel = computeMAAccel(maArray);
        localArrayOfSignals[3] = Math.abs(accel) > 0.00003;
        
        if ((bullishCSID || bearishCSID) && localArrayOfSignals[1] && localArrayOfSignals[2] && localArrayOfSignals[3]) {
          if (localCSIDSignalTriggered) {
            localCSIDCoolddownSignal--;
            if (localCSIDCoolddownSignal > 0) return;
            localCSIDSignalTriggered = false;
            localCSIDCoolddownSignal = 5;
          }
          
const direction = bullishCSID ? 'BULL' : 'BEAR';
          const entryPrice = Number(row[EnumMT5OHLC.OPEN]);
          
          if (MULTI_POSITION_CONFIG.enabled) {
            // Create 3 positions at once (each with per-position TP target)
            MULTI_POSITION_CONFIG.positions.forEach(posConfig => {
              // Per-position TP: scale base TP by lot multiplier (e.g., if TP=3R, A gets 3.0R, B gets 2.1R, C gets 1.5R)
              const positionTpDistance = (posConfig.tpMultiplier || 1.0) * localTpSize();
              localOrdersHistory.push({
                id: `${localTradeCount + 1}`,
                posName: posConfig.name,
                lotMultiplier: posConfig.lotMultiplier,
                time: candleDateTime,
                price: entryPrice,
                sl: direction === 'BULL' ? entryPrice - localSlSize() : entryPrice + localSlSize(),
                initialSL: direction === 'BULL' ? entryPrice - localSlSize() : entryPrice + localSlSize(),
                tp: direction === 'BULL' ? entryPrice + positionTpDistance : entryPrice - positionTpDistance,
                direction: direction,
                entryCandleIndex: localChartCandleIndex,
                slMoveStartR: posConfig.slMoveStartR,
                slMoveCount: 0,
                trailingStartR: posConfig.trailingStartR,
                runToTP: posConfig.runToTP || false,
                trailingActive: false,
                breakEvenMoved: false,
                closed: false,
                closedOrderType: 'PENDING',
              });
            });
          } else {
            // Single position mode (original)
            localOrdersHistory.push({
              id: localOrdersHistory.length + 1,
              breakEvenMoved: false,
              time: candleDateTime,
              price: entryPrice,
              entryCandleIndex: localChartCandleIndex,
              sl: direction === 'BULL' ? entryPrice - localSlSize() : entryPrice + localSlSize(),
              tp: direction === 'BULL' ? entryPrice + localTpSize() : entryPrice - localTpSize(),
              direction: direction,
              closed: false,
              closedOrderType: 'PENDING',
            });
          }
          
          localTradeCount++;
          localListeningATR = true;
          localArrayOfSignals[2] = false;
          localCSIDSignalTriggered = true;
        }
      }
    }
    
    const activeOrders = localOrdersHistory.filter(o => !o.closed);
    activeOrders.forEach(order => {
      const high = Number(row[EnumMT5OHLC.HIGH]);
      const low = Number(row[EnumMT5OHLC.LOW]);
      const close = Number(row[EnumMT5OHLC.CLOSE]);
      
      // Calculate current R
      const currentR = order.direction === 'BULL'
        ? (close - order.price) / localSlSize()
        : (order.price - close) / localSlSize();
      
      if (MULTI_POSITION_CONFIG.enabled) {
        // Multi-position SL management
        
        // Skip trailing logic on the entry candle
        if (localChartCandleIndex > order.entryCandleIndex) {
        
        // 1. Progressive SL movement (move SL every 0.5R)
        if (!order.trailingActive) {
          const slMoveThreshold = order.slMoveStartR + (order.slMoveCount * 0.5);
          if (currentR >= slMoveThreshold) {
            // For BULL: SL starts at entry - 1R, moves up as profit increases
            // For BEAR: SL starts at entry + 1R, moves down as profit increases
            const slAdjustment = slMoveThreshold * localSlSize();
            const newSL = order.direction === 'BULL'
              ? order.price - localSlSize() + slAdjustment
              : order.price + localSlSize() - slAdjustment;
            order.sl = newSL;
            order.slMoveCount++;
          }
        }

        // 2. Activate trailing after trailingStartR (skip for runToTP positions — they ride to TP)
        if (!order.runToTP && currentR >= order.trailingStartR && !order.trailingActive) {
          order.trailingActive = true;
        }

        // 3. Apply trailing stop
        if (order.trailingActive && localCandlesFromBuffer.length >= 2) {
          const prevCandle = localCandlesFromBuffer[localCandlesFromBuffer.length - 2];
          let candleSize = Math.abs(Number(prevCandle[EnumMT5OHLC.CLOSE]) - Number(prevCandle[EnumMT5OHLC.OPEN]));
          let trailingMultiplier = localStrategy === 'CSID_W_MA_DynamicTS'
            ? (candleSize >= 0.0005 ? 3 : candleSize >= 0.0003 ? 2 : 1)
            : 1;
          const trailingSize = localTsSize() * trailingMultiplier;

          const newTrailingSL = order.direction === 'BULL'
            ? close - trailingSize
            : close + trailingSize;

          // Only improve SL (never move backwards)
          const slImproved = order.direction === 'BULL'
            ? newTrailingSL > order.sl
            : newTrailingSL < order.sl;

          if (slImproved) {
            order.sl = newTrailingSL;
          }
        } // end trailingActive check
      } // end: skip entry candle check
      
      } else {
        // Single position mode (original logic)
        if (!order.breakEvenMoved) {
          if ((order.direction === 'BULL' && close >= order.price + localSlSize()) ||
              (order.direction === 'BEAR' && close <= order.price - localSlSize())) {
            order.sl = order.price;
            order.breakEvenMoved = true;
          }
        }
        
        if (localCandlesFromBuffer.length >= 2) {
          const prevCandle = localCandlesFromBuffer[localCandlesFromBuffer.length - 2];
          let candleSize = Math.abs(Number(prevCandle[EnumMT5OHLC.CLOSE]) - Number(prevCandle[EnumMT5OHLC.OPEN]));
          
          let trailingMultiplier = localStrategy === 'CSID_W_MA_DynamicTS' 
            ? (candleSize >= 0.0005 ? 3 : candleSize >= 0.0003 ? 2 : 1)
            : 1;
          
          const trailingSize = localTsSize() * trailingMultiplier;
          if (order.direction === 'BULL') {
            order.sl += trailingSize;
          } else {
            order.sl -= trailingSize;
          }
        }
      }
      
// Check for SL hit (or TP if you want - this strategy only uses SL)
      if ((order.direction === 'BULL' && low <= order.sl) ||
          (order.direction === 'BEAR' && high >= order.sl)) {
        order.closed = true;
        order.closedPrice = order.sl;
        order.closedTime = candleDateTime;
        if (order.direction === 'BULL') {
          order.closedOrderType = high >= order.tp ? 'CLOSED_BY_TP' : 'CLOSED_BY_SL';
        } else {
          order.closedOrderType = low <= order.tp ? 'CLOSED_BY_TP' : 'CLOSED_BY_SL';
        }
        order.pnlPoints = order.direction === 'BULL'
          ? order.closedPrice - order.price
          : order.price - order.closedPrice;
        order.tradeResult = order.pnlPoints > 0 ? 'WIN' : (order.pnlPoints < -0.0001 ? 'LOSS' : 'BE');
      }
    });
  });
  
  const calculateResults = () => {
    const commissionPoints = localCommissionSize();
    let profitsInPoints = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let losses = 0;
    let equityDataMoney = [];
    
    localOrdersHistory.filter(o => o.closed).forEach(order => {
      if (order.closedOrderType === 'CLOSED_BY_TP') profitsInPoints += localTpSize();
      if (order.closedOrderType === 'CLOSED_BY_SL') profitsInPoints -= localSlSize();
      
      // Use lotMultiplier if available (multi-position mode), otherwise use default lotSize
      const lotSize = order.lotMultiplier ? order.lotMultiplier * localLotSize() : localLotSize();
      const tradeMoney = (order.pnlPoints - commissionPoints) * 100000 * lotSize;
      equityDataMoney.push((equityDataMoney.at(-1) || 0) + tradeMoney);
      
      if (tradeMoney > 0) {
        grossProfit += tradeMoney;
        wins++;
      } else if (tradeMoney < 0) {
        grossLoss += Math.abs(tradeMoney);
        losses++;
      }
    });
    
    const winRate = localOrdersHistory.length > 0 
      ? ((wins / localOrdersHistory.length) * 100).toFixed(2) 
      : 0;
    
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? '∞' : '0');
    const moneyEquivalent = equityDataMoney.at(-1) || 0;
    
    let maxDrawdown = 0;
    let peak = equityDataMoney[0] || 0;
    for (const value of equityDataMoney) {
      if (value > peak) peak = value;
      const drawdown = peak - value;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return {
      params: { ...params },
      id: Date.now(),
      timestamp: new Date().toISOString(),
      tradeCount: localTradeCount,
      totalTrades: localOrdersHistory.filter(o => o.closed).length,
      winRate,
      profitFactor,
      profitsInPoints,
      moneyEquivalent: moneyEquivalent.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      orders: localOrdersHistory,
    };
  };
  
  return calculateResults();
};
/*
  Most of the functions if they are using charting annotation, they need to be inside initchart function.
  - The Graph is now populating or get drawned with the CSV file data at a pace speed (one by one).
  - When dealing with times for candles never forget this pattern: `${d[EnumMT5OHLC.DATE]} $d[EnumMT5OHLC.TIME]}`
*/

// Result Panel Related Actions / Triggers:
const $resultPanel = document.querySelector('#result-panel');
const $csvRefresh = document.querySelector('#csvRefresh');
const $resultPanelToolbarContentTogglerAlgoEditor = document.getElementById(
  'result-panel-toolbar-content-toggler-algo-editor'
);
const $resultPanelToolbarContentTogglerAlgo = document.getElementById(
  'result-panel-toolbar-content-toggler-algo'
);
const $resultPanelToolbarContentTogglerReview = document.getElementById(
  'result-panel-toolbar-content-toggler-review'
);
//const $csvDataField = document.getElementById('csvContent');
const $backTestingResult = document.getElementById('backtestingResult');
const $exportableCSVField = document.getElementById('exportableCSVField');
const $csvFileInput = document.getElementById('csvFileInput');
const $toolbarToggler = document.querySelector('#result-panel-toolbar-toggler');
const $navigateTroughtDates = document.getElementById('NavigateTroughtDates');
const $SLPointsInput = document.getElementById('SLPoints');
const $TPPointsInput = document.getElementById('TPPoints');
const $LotSizeInput = document.getElementById('LotSize');
const $CommissionSizeInput = document.getElementById('CommissionSize');
const $TSIncrementInput = document.getElementById('TSIncrement');
const $MAPeriodInput = document.getElementById('MAPeriod');
const $MAThresholdInput = document.getElementById('MAThreshold');
const $InstitutionalMultiplierInput = document.getElementById('InstitutionalMultiplier');
const $EntryZoneDistanceInput = document.getElementById('EntryZoneDistance');
const $textareaHistoricalTradesLines = document.getElementById('textareaHistoricalTradesLines');
const $firstDate = document.getElementById('firstDate');
const $lastDate = document.getElementById('lastDate');
const $currentReadingDate = document.getElementById('currentReadingDate');
const $resultPanelContent = document.querySelectorAll('.result-panel-content'); //result-panel-content
const $backTestingPauseButton = document.getElementById('backTestingPauseButton'); // Keep for compatibility
const $backtestingPlayPause = document.getElementById('backtestingPlayPause');
const $backtestingPlayPauseIcon = $backtestingPlayPause.querySelector('i');
const $backtestingNext = document.getElementById('backtestingNext');
const $backtestingStop = document.getElementById('backtestingStop');
let backTestingPaused = false; // Default to not paused
let backTestingStepMode = false; // For single-step advancement
let currentParser = null; // Store parser reference for step control
const $sessionStartInput = document.getElementById('backtesting-hour');
const $sessionEndInput = document.getElementById('backtesting-end');
const $ThemeInput = document.getElementById('themeSelector');
const $BTTInput = document.getElementById('backtesting-hour');
const $ETTInput = document.getElementById('backtesting-end');
const $strategyInput = document.getElementById('backtesting-strategy');
const $fastBacktestMode = document.getElementById('fastBacktestMode');
const $googleSendToSheetsBtn = document.getElementById('googleSendToSheetsBtn');
const audioSuccess = new Audio('squirrel_404_click_tick.wav');
const audioNotify = new Audio('joseegn_ui_sound_select.wav');

// Regenerate MQL when form inputs change
const regenerateMQLFromForm = () => {
  const params = getCurrentParams();
  const mqlText = generateMQLFromParams(params);
  const textarea = document.getElementById('algoEditorTextareaMain1');
  if (textarea) textarea.value = mqlText;
};

// Initialize form input listeners after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const sessionStartInput = document.getElementById('backtesting-hour');
  const sessionEndInput = document.getElementById('backtesting-end');
  const slPointsInput = document.getElementById('SLPoints');
  const tpPointsInput = document.getElementById('TPPoints');
  const lotSizeInput = document.getElementById('LotSize');
  const maPeriodInput = document.getElementById('MAPeriod');
  const maThresholdInput = document.getElementById('MAThreshold');
  
  const mqlFormInputs = [sessionStartInput, sessionEndInput, slPointsInput, tpPointsInput, lotSizeInput, maPeriodInput, maThresholdInput];
  mqlFormInputs.forEach(input => {
    if (input) input.addEventListener('change', regenerateMQLFromForm);
  });
});

// Function to update Google Sheets button state based on CSV field content
const updateGoogleSheetsButtonState = () => {
  const csvContent = $exportableCSVField.value.trim();
  $googleSendToSheetsBtn.disabled = !csvContent;
};

// Test the function (can be removed after testing)
window.updateGoogleSheetsButtonState = updateGoogleSheetsButtonState;

const myChart = document.getElementById('myChart');

// Load URL parameters into inputs on page load
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('theme')) { $ThemeInput.value = urlParams.get('theme') }
if (urlParams.has('btt')) { $BTTInput.value = urlParams.get('btt') }
if (urlParams.has('ett')) { $ETTInput.value = urlParams.get('ett') }
if (urlParams.has('maperiod')) { $MAPeriodInput.value = urlParams.get('maperiod') }
if (urlParams.has('lotsize')) { $LotSizeInput.value = urlParams.get('lotsize') }
if (urlParams.has('commissionsize')) { $CommissionSizeInput.value = urlParams.get('commissionsize') }
if (urlParams.has('slpoints')) { $SLPointsInput.value = urlParams.get('slpoints') }
if (urlParams.has('tppoints')) { $TPPointsInput.value = urlParams.get('tppoints') }
if (urlParams.has('tsincrement')) { $TSIncrementInput.value = urlParams.get('tsincrement') }
if (urlParams.has('institutionalmultiplier')) { $InstitutionalMultiplierInput.value = urlParams.get('institutionalmultiplier') }
if (urlParams.has('entryzonedistance')) { $EntryZoneDistanceInput.value = urlParams.get('entryzonedistance') }
if (urlParams.has('strategy')) { $strategyInput.value = urlParams.get('strategy') }

// Auto-load CSV file from URL parameter
if (urlParams.has('csv')) {
  const csvPath = urlParams.get('csv');
  console.log('Loading CSV from:', csvPath);
  fetch(csvPath)
    .then(response => response.text())
    .then(csvText => {
      document.getElementById('csvContent').value = csvText;
      // Also cache the data for Run Backtest button
      const lines = csvText.split(/\r?\n/).filter(Boolean);
      const headers = lines[0].split('\t');
      cachedCSVData = lines.slice(1).map(line => {
        const values = line.split('\t');
        const row = {};
        headers.forEach((h, i) => row[h] = values[i]);
        return row;
      }).filter(row => row['<OPEN>']);
      console.log('CSV loaded and cached, length:', csvText.length, 'rows:', cachedCSVData.length);
    })
    .catch(err => console.error('Failed to load CSV:', err));
}

// Auto-enable Fast Mode from URL parameter
if (urlParams.has('fastmode')) {
  setTimeout(() => {
    const fastModeCheckbox = document.querySelector('input[type="checkbox"][id*="fast"]');
    if (fastModeCheckbox) {
      fastModeCheckbox.checked = true;
      console.log('Fast Mode auto-enabled');
    }
  }, 1000);
}

const saveConfigs = () => {
  const urlParams = new URLSearchParams(window.location.search);

  urlParams.set('theme', $ThemeInput.value);
  urlParams.set('btt', $BTTInput.value);
  urlParams.set('ett', $ETTInput.value);
  urlParams.set('maperiod', $MAPeriodInput.value);
  urlParams.set('lotsize', $LotSizeInput.value);
  urlParams.set('commissionsize', $CommissionSizeInput.value);
  urlParams.set('slpoints', $SLPointsInput.value);
  urlParams.set('tppoints', $TPPointsInput.value);
  urlParams.set('tsincrement', $TSIncrementInput.value);
  urlParams.set('strategy', $strategyInput.value);

  window.location.search = urlParams;
}

const loadConfigs = () => {
  /* 
    Load settings from previously backed-up backtesting result settings, must follow this keys pattern:  
    ?...btt=09%3A50%3A00&ett=11%3A00%3A00&maperiod=200&lotsize=1.0&commissionsize=0.00005&slpoints=0.0001&tppoints=0.0003&tsincrement=0.0001&strategy=CSID_W_MA_DynamicTS
  */
  let configuration = '';
  const line = prompt("Load Configurations paramters or complete URL from Backed Up Settings: ");
  
  if (!line) return;
  
  configuration = line.indexOf('?') > -1 ? line.split('?')[1] : line;

  window.location.search = configuration;
}

// Generate default MQL5 code on page load
const generateDefaultMQL = () => {
  const defaultParams = {
    slSize: 0.0005,
    tpSize: 0.0009,
    lotSize: 1.0,
    commissionSize: 0.00005,
    tsSize: 0,
    maPeriod: 200,
    maThreshold: 0.003,
    strategy: 'CSID_W_MA_DynamicTS',
    sessionStart: '09:50:00',
    sessionEnd: '11:00:00',
    monthlyMaxLossPercent: 5,
    multiPositionPreset: 'c-only'
  };

  const mqlText = generateMQLFromParams(defaultParams);
  const textarea = document.getElementById('algoEditorTextareaMain1');
  if (textarea) {
    textarea.value = mqlText;
  }
};

// Call on page load
setTimeout(() => {
  generateDefaultMQL();
}, 500);

// Panel order in HTML: [0]=MQL5, [1]=Backtesting Algo, [2]=Review, [3]=Comparison

const revealAlgoEditor = () => {
  // MQL5 Generator is panel 0
  $resultPanel.classList.add('active');
  document.querySelectorAll('.result-panel-content')[0].classList.remove('h-hide');
  document.querySelectorAll('.result-panel-content')[1].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[2].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[3].classList.add('h-hide');
};

const revealAlgo = () => {
  // Backtesting results (Algo) is panel 1
  $resultPanel.classList.add('active');
  document.querySelectorAll('.result-panel-content')[0].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[1].classList.remove('h-hide');
  document.querySelectorAll('.result-panel-content')[2].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[3].classList.add('h-hide');
};
revealAlgo();

const revealReview = () => {
  // Review Historical is panel 2
  $resultPanel.classList.add('active');
  document.querySelectorAll('.result-panel-content')[0].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[1].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[2].classList.remove('h-hide');
  document.querySelectorAll('.result-panel-content')[3].classList.add('h-hide');
};

const revealComparison = () => {
  // Parameter Comparison is panel 3
  $resultPanel.classList.add('active');
  document.querySelectorAll('.result-panel-content')[0].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[1].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[2].classList.add('h-hide');
  document.querySelectorAll('.result-panel-content')[3].classList.remove('h-hide');
};

const toggleHeight = () => {
  const chartSection = document.querySelector('.chart-section');
  
  // Toggle panel active
  $resultPanel.classList.toggle('active');
  
  if ($resultPanel.classList.contains('active')) {
    if (chartSection.classList.contains('chart-collapsed')) {
      // Details only: full height panel
      $resultPanel.classList.add('full-height');
      chartSection.style.height = '0px';
    } else {
      // Split layout: half height each
      $resultPanel.classList.remove('full-height');
      const fullHeight = window.innerHeight;
      const halfHeight = Math.max(500, fullHeight / 2);
      $resultPanel.style.height = `${halfHeight}px`;
      chartSection.style.height = `${halfHeight}px`;
    }
  } else {
    // Panel hidden or minimal height
    $resultPanel.classList.remove('full-height');
    $resultPanel.style.height = '';
    chartSection.style.height = '';
  }
};
$toolbarToggler?.addEventListener('click', toggleHeight);

const stickyTableHeaders = (parentElement) => {
  const $orderHistoryHeader = document.querySelector('table thead');

  const scrollTop = parentElement.scrollTop;
  if ($orderHistoryHeader) {
    if (scrollTop > 408) {
      $orderHistoryHeader.classList.add('sticky');
    } else {
      $orderHistoryHeader.classList.remove('sticky');
    }
  }
};

$resultPanelToolbarContentTogglerAlgoEditor?.addEventListener('click', () => revealAlgoEditor());
$resultPanelToolbarContentTogglerAlgo?.addEventListener('click', () => revealAlgo());
$resultPanelToolbarContentTogglerReview?.addEventListener('click', () => revealReview());
$resultPanel.addEventListener('scroll', (event) => stickyTableHeaders(event.target));

// Result panel toggle button
const $chartSection = document.querySelector('.chart-section');
const $resultPanelCollapseBtn = document.getElementById('result-panel-collapse-btn');

$resultPanelCollapseBtn?.addEventListener('click', () => {
  // Single button cycles through all layout states smoothly
  const isChartCollapsed = $chartSection.classList.contains('chart-collapsed');
  const isPanelExpanded = $resultPanel.classList.contains('active');
  const isPanelFullHeight = $resultPanel.classList.contains('full-height');

  if (!isChartCollapsed && !isPanelExpanded) {
    // State 1: Default -> Show both chart and expanded panel
    $resultPanel.classList.add('active');
  } else if (!isChartCollapsed && isPanelExpanded && !isPanelFullHeight) {
    // State 2: Both visible -> Hide chart, expand panel to full height
    $chartSection.classList.remove('chart-expanded');
    $chartSection.classList.add('chart-collapsed');
    $resultPanel.classList.add('full-height');
  } else if (isChartCollapsed && isPanelExpanded && isPanelFullHeight) {
    // State 3: Panel full height -> Reset to default (chart visible, panel collapsed)
    $resultPanel.classList.remove('active');
    $resultPanel.classList.remove('full-height');
    $chartSection.classList.remove('chart-collapsed');
    $chartSection.classList.add('chart-expanded');
  }

  animateActiveClass($resultPanelCollapseBtn);
});
$SLPointsInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$TPPointsInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$LotSizeInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$CommissionSizeInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$TSIncrementInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$MAPeriodInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$MAThresholdInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$InstitutionalMultiplierInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$EntryZoneDistanceInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
$strategyInput?.addEventListener('change', () => animateActiveClass($csvRefresh));

// Enable/Disable Institutional Multiplier input based on preset selection
const $multiPositionPreset = document.getElementById('multiPositionPreset');
const updateInstitutionalMultiplierState = () => {
  if ($multiPositionPreset && $InstitutionalMultiplierInput) {
    const isC_Only = $multiPositionPreset.value === 'c-only';
    $InstitutionalMultiplierInput.disabled = !isC_Only;
  }
};

// Set initial state on page load
updateInstitutionalMultiplierState();

// Update when preset changes
$multiPositionPreset?.addEventListener('change', () => {
  updateInstitutionalMultiplierState();
  animateActiveClass($csvRefresh);
});

/* ---- */

// Backtesting Controls - Music Player Style
$backtestingPlayPause.addEventListener('click', () => {
  if (backTestingPaused) {
    // Currently paused, so resume (show pause icon)
    backTestingPaused = false;
    backTestingStepMode = false;
    $backtestingPlayPause.classList.remove('play-btn');
    $backtestingPlayPause.classList.add('pause-btn');
    $backtestingPlayPauseIcon.classList.remove('fa-play');
    $backtestingPlayPauseIcon.classList.add('fa-pause');
    $backtestingPlayPause.title = 'Pause Backtesting';
    animateActiveClass($backtestingPlayPause);
    if (currentParser) {
      currentParser.resume();
      document.getElementById('loading-element').classList.add('visible');
    }
  } else {
    // Currently playing, so pause (show play icon)
    backTestingPaused = true;
    backTestingStepMode = false;
    $backtestingPlayPause.classList.remove('pause-btn');
    $backtestingPlayPause.classList.add('play-btn');
    $backtestingPlayPauseIcon.classList.remove('fa-pause');
    $backtestingPlayPauseIcon.classList.add('fa-play');
    $backtestingPlayPause.title = 'Resume Backtesting';
    if (currentParser) {
      document.getElementById('loading-element').classList.remove('visible');
    }
  }
});

$backtestingNext.addEventListener('click', () => {
  // Advance one step
  backTestingPaused = false;
  backTestingStepMode = true; // Will pause after next candle
  animateActiveClass($backtestingNext);
  if (currentParser) {
    currentParser.resume();
    document.getElementById('loading-element').classList.add('visible');
  }
});

// Visualize Results button
const $visualizeResultsBtn = document.getElementById('visualizeResultsBtn');
if ($visualizeResultsBtn) {
  $visualizeResultsBtn.addEventListener('click', () => {
    visualizeBacktestResults();
  });
}

// Show Visualize button only when backtest has results
const showVisualizeButton = () => {
  if ($visualizeResultsBtn && ordersHistory.length > 0) {
    $visualizeResultsBtn.style.display = 'inline-block';
  }
};

// Hide Visualize button when starting new backtest
const hideVisualizeButton = () => {
  if ($visualizeResultsBtn) {
    $visualizeResultsBtn.style.display = 'none';
  }
};

// Populate trade history textarea for easy sharing
const populateTradeHistoryTextarea = () => {
  const $tradeHistoryTextarea = document.getElementById('tradeHistoryExport');
  if (!$tradeHistoryTextarea) return;

  if (ordersHistory.length === 0) {
    $tradeHistoryTextarea.value = 'No trades executed';
    return;
  }

  // Format trade history as tab-separated for easy copy/paste
  let tradeHistoryText = 'ID\tPosition\tDirection\tEntry Time\tEntry Price\tClose Time\tClose Price\tTP\tSL\tPnL Points\tPnL Money\tLot Size\tResult\n';
  tradeHistoryText += '='.repeat(150) + '\n';

  ordersHistory.forEach((order) => {
    const direction = order.direction === 1 ? 'LONG' : 'SHORT';
    const closedPrice = order.closedPrice?.toFixed(6) || 'OPEN';
    const pnlPoints = order.pnlPoints?.toFixed(6) || '0';
    const pnlMoney = order.pnlMoney?.toFixed(2) || '0';
    const lotSize = order.lotMultiplier || '1';
    const result = order.closed ? (order.tradeResult || 'UNKNOWN') : 'OPEN';

    tradeHistoryText += `${order.id}\t${order.posName || 'N/A'}\t${direction}\t${order.time}\t${order.price.toFixed(6)}\t${order.closedTime || 'OPEN'}\t${closedPrice}\t${order.tp.toFixed(6)}\t${order.sl.toFixed(6)}\t${pnlPoints}\t$${pnlMoney}\t${lotSize}\t${result}\n`;
  });

  $tradeHistoryTextarea.value = tradeHistoryText;
};

// Copy trade history to clipboard
const copyTradeHistoryToClipboard = () => {
  const $tradeHistoryTextarea = document.getElementById('tradeHistoryExport');
  if (!$tradeHistoryTextarea || !$tradeHistoryTextarea.value) {
    alert('No trade history to copy');
    return;
  }

  $tradeHistoryTextarea.select();
  document.execCommand('copy');

  // Show feedback
  const $copyBtn = document.getElementById('copyTradeHistoryBtn');
  const originalText = $copyBtn.innerHTML;
  $copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
  setTimeout(() => {
    $copyBtn.innerHTML = originalText;
  }, 2000);
};

// Add event listener for copy button
const $copyTradeHistoryBtn = document.getElementById('copyTradeHistoryBtn');
if ($copyTradeHistoryBtn) {
  $copyTradeHistoryBtn.addEventListener('click', copyTradeHistoryToClipboard);
}

$backtestingStop.addEventListener('click', () => {
  backTestingPaused = true;
  backTestingStepMode = false;
  $backtestingPlayPause.classList.remove('pause-btn');
  $backtestingPlayPause.classList.add('play-btn');
  animateActiveClass($backtestingStop);
  if (currentParser) {
    document.getElementById('loading-element').classList.remove('visible');
  }
});

// Keep old checkbox for compatibility but hide it (if it exists)
if ($backTestingPauseButton) {
  $backTestingPauseButton.style.display = 'none';
}

/* ---- */
/* ---- */

const decimals = 5;
let candlesFromBuffer = [];
const MAX_BUFFER_SIZE = 10;
let chartCandleIndex = 0;
let candleTimes = [];
let timeToIndex = new Map();
const MA_PERIOD = 6;
const ACCEL_THRESHOLD = 0.00003; // threshold for MA acceleration signal

function computeMAAccel(maArray) {
  const len = maArray.length;
  if (len < 3) return 0;
  return maArray[len - 1] - 2 * maArray[len - 2] + maArray[len - 3];
}
let slSize = () => parseFloat($SLPointsInput.value);
let tpSize = () => parseFloat($TPPointsInput.value);
let lotSize = () => parseFloat($LotSizeInput.value);
let commissionSize = () => parseFloat($CommissionSizeInput.value);
let tsSize = () => parseFloat($TSIncrementInput.value);
let maPeriod = () => parseFloat($MAPeriodInput.value);
let maThreshold = () => parseFloat($MAThresholdInput.value);
let bullishColor = '00FF00';
let bearishColor = 'FF0000';
let greyColor = '999999';
const EnumActionType = {
  VERTICAL_LINE: 'VERTICAL_LINE',
  DRAW_A_CIRCLE: 'DRAW_A_CIRCLE',
  TAKE_A_TRADE: 'TAKE_A_TRADE',
};
const EnumArrayOfSignalsIndex = {
  CSID: 0,
  TTR: 1,
  ATR: 2,
  MADirection: 3
}
const EnumMT5OHLC = {
  DATE: '<DATE>',
  TIME: '<TIME>',
  OPEN: '<OPEN>',
  HIGH: '<HIGH>',
  LOW: '<LOW>',
  CLOSE: '<CLOSE>',
};
const EnumStrategy = {
  CSID: 'CSID', // CSID price action breakout with Institutional candle move signal
  CSID_W_MA: 'CSID_W_MA', // CSID price action breakout with Institutional candle move signal with moving average
  CSID_W_MA_DynamicTS: 'CSID_W_MA_DynamicTS', // CSID price action breakout with Institutional candle move signal with moving average and dynamic trailing stop
};
let RRToolStyles = {
  strokeThickness: 0,
  opacity: '50',
};
let labels = [];
let pnlData = [];
const equityData = []; // in points
const ctx = myChart.getContext('2d');
const gradient = ctx.createLinearGradient(0, 25, 0, 300);
const datasets = [
  {
    type: 'line',
    label: 'Strategy Performance (Accumulated Points)',
    data: pnlData,
    borderColor: `#${bullishColor}`,
    backgroundColor: gradient,
    borderWidth: 1,
    order: 0,
    fill: true,
    yAxisID: 'pointsAxis',
  },
  {
    type: 'line',
    label: 'Portfolio Performance (Equity Curve)',
    data: equityData,
    borderColor: `#${bearishColor}`,
    borderWidth: 1,
    order: 1,
    fill: false,
    tension: 0.5,
    pointStyle: false,
    yAxisID: 'equityAxis',
  },
];

// Get candle direction from candle object:
const getCandleDirectionFromCandle = (candle) =>
  getCandleDirection(candle[EnumMT5OHLC.OPEN], candle[EnumMT5OHLC.CLOSE]);

// INSTITUTIONAL CANDLE DETECTION
// Only take trades on candles with large bodies (strong institutional moves)
const isInstitutionalCandle = (candle, minBodySize = 0.0003) => {
  if (!candle) return false;
  const bodySize = Math.abs(
    parseFloat(candle[EnumMT5OHLC.CLOSE]) - parseFloat(candle[EnumMT5OHLC.OPEN])
  );
  return bodySize >= minBodySize;
};

// Global getCandleDirection function
const getCandleDirection = (openPrice = 0, closePrice = 0) => {
  if (openPrice == 0 || closePrice == 0) return 'BULL';
  return closePrice > openPrice ? 'BULL' : 'BEAR';
};
window.getCandleDirection = getCandleDirection;

const getCandleChartAxisLocationFromDate = (date) =>
  new Date(date).getTime() / 1000;
window.getCandleChartAxisLocationFromDate = getCandleChartAxisLocationFromDate;

const formatDateFromUnix = (unixTime) => {
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // second: '2-digit',
    hour12: false,
  };
  return new Date(unixTime * 1000).toLocaleDateString('en-GB', options); // Multiply by 1000 to convert to milliseconds because JS Date works with milliseconds.
};

// Handy function to execute actions step by step:
const stepByStep = (step, actions) => actions[step - 1]();

const convertMT5DateToUnix = (candleTime) => {
  if (!candleTime) {
    // TODO: this seems to be infinitly called, need to fix it:
    // console.warn('No candleTime provided, returning current date.');
    return new Date(); // If candleTime is not provided, return current date
  }
  if (typeof candleTime.replaceAll !== 'function') {
    debugger;
  }
  const ct = candleTime.replaceAll('.', '-');
  return new Date(ct).getTime() / 1000; // - 3600 * 2; // divided by 1000 to convert from milliseconds to seconds as Unix time only accepts seconds, while JS Date is more precise as working with milliseconds.
};

let readingSpeed = 0; // Speed of reading the CSV file in milliseconds (0 = instant)
const strategy = $strategyInput.value || EnumStrategy.CSID_W_MA_DynamicTS; // Current strategy selected

// Speed control for backtesting
const $backtestSpeedInput = document.getElementById('backtestSpeedInput');
if ($backtestSpeedInput) {
  $backtestSpeedInput.addEventListener('change', (e) => {
    readingSpeed = parseInt(e.target.value);
    console.log(`Backtest speed set to: ${readingSpeed}ms per candle`);
  });
}

const csvData = [];
let CSIDLookbackCandleSerie = [];
let CSIDSignalTriggered = false;
let CSIDCoolddownSignal = 5;
let csvDataIndex = 0;
let numbDays = 0;
let processedDays = 0;
let totalCandles = 0;
let processedCandles = 0;
let ordersHistory = [];
let tradeSetId = 0; // Counter for trade sets (increments per signal, not per position)
let firstDate = new Date();
let lastDate = new Date();
let prevDate = null;
const now = new Date();
let backtestingDate = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`; // YYYY/MM/DD format
const trailingStopSeriesMap = new Map();
window.ordersHistory = ordersHistory;

// CRITICAL: Pending trade state for next-candle entry timing
// When CSID signal fires, store the trade here. Execute on NEXT candle's OPEN
let pendingTrade = null; // { direction, timestamp, confidence }
let tradeCount = 0; // Counter for trades within a signal wave
let currentATR = 0; // Store current ATR for dynamic SL calculation
let lastSignalConfidence = 1.0; // Store confidence for current signal

// ============================================
// SMART EDGE SYSTEM - Intelligent Trading Filters
// ============================================

// 1. MARKET REGIME DETECTION: Identify trending vs ranging markets
const detectMarketRegime = (candlesSeries, lookback = 20) => {
  if (candlesSeries.length < lookback) return 'NEUTRAL';

  const recent = candlesSeries.slice(-lookback);
  const highs = recent.map(c => Number(c[EnumMT5OHLC.HIGH]));
  const lows = recent.map(c => Number(c[EnumMT5OHLC.LOW]));

  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = maxHigh - minLow;

  // Calculate recent trend direction
  const startPrice = Number(recent[0][EnumMT5OHLC.CLOSE]);
  const endPrice = Number(recent[recent.length - 1][EnumMT5OHLC.CLOSE]);
  const trend = endPrice > startPrice ? 1 : -1;

  // Measure trend strength: if range is large and trend is clear, it's trending
  const avgCandle = recent.reduce((sum, c) => sum + (Number(c[EnumMT5OHLC.CLOSE]) - Number(c[EnumMT5OHLC.OPEN])), 0) / lookback;
  const trendStrength = Math.abs(avgCandle) > (range / lookback / 3) ? 'STRONG' : 'WEAK';

  if (trendStrength === 'STRONG') {
    return trend > 0 ? 'UPTREND' : 'DOWNTREND';
  }
  return 'RANGING';
};

// 2. SIGNAL CONFIRMATION: Require MA alignment + momentum
const confirmSignal = (candlesSeries, direction, maValue) => {
  if (candlesSeries.length < 2) return false;

  const current = Number(candlesSeries[candlesSeries.length - 1][EnumMT5OHLC.CLOSE]);
  const close = current;

  // MA confirmation: Price should be in direction of trade (BULL: above MA, BEAR: below MA)
  const maConfirms = direction === 'BULL'
    ? close > maValue
    : close < maValue;

  // Momentum confirmation: Recent candles should show directional bias
  const recent3 = candlesSeries.slice(-3);
  const closes = recent3.map(c => Number(c[EnumMT5OHLC.CLOSE]));

  let momentumConfirms = false;
  if (direction === 'BULL') {
    momentumConfirms = closes[1] > closes[0] || closes[2] > closes[1]; // Recent higher closes
  } else {
    momentumConfirms = closes[1] < closes[0] || closes[2] < closes[1]; // Recent lower closes
  }

  return maConfirms && momentumConfirms;
};

// 3. DYNAMIC STOP LOSS (ATR-based instead of fixed 1R)
const calculateDynamicSL = (entryPrice, direction, atrValue, riskMultiplier = 1.0) => {
  // Use ATR * 1.5 as dynamic SL instead of fixed 1R
  const dynamicSlSize = atrValue * riskMultiplier;

  if (direction === 'BULL') {
    return entryPrice - dynamicSlSize;
  } else {
    return entryPrice + dynamicSlSize;
  }
};

// 4. SMART POSITION SIZING: Size based on R:R ratio and equity drawdown
const calculateSmartLotSize = (baseLot, rewardRatio, currentEquity, initialEquity, maxDrawdownPercent = 20) => {
  // Reduce size if we're in significant drawdown
  const equityPercent = (currentEquity / initialEquity) * 100;
  const drawdownPercent = 100 - equityPercent;

  let sizeMultiplier = 1.0;

  // If in significant drawdown, reduce position size
  if (drawdownPercent > maxDrawdownPercent) {
    sizeMultiplier = Math.max(0.5, 1.0 - (drawdownPercent - maxDrawdownPercent) / 50);
  }

  // Increase size for better R:R setups (if reward >= 2R, take full size)
  if (rewardRatio >= 2.0) {
    sizeMultiplier *= 1.2; // 20% increase for excellent setups
  } else if (rewardRatio < 1.5) {
    sizeMultiplier *= 0.8; // 20% reduction for poor R:R
  }

  return baseLot * sizeMultiplier;
};

// 5. TRADE QUALITY FILTER: Skip weak setups + CONFIDENCE SCORING
const calculateSignalConfidence = (candlesSeries, direction, consecutiveLosses) => {
  let confidence = 1.0; // Base confidence

  // Penalty for consecutive losses
  if (consecutiveLosses > 0) {
    confidence -= (consecutiveLosses * 0.1); // 0.1 per loss
  }

  // Bonus for trending market
  if (candlesSeries.length >= 20) {
    const recent20 = candlesSeries.slice(-20);
    const closes = recent20.map(c => Number(c[EnumMT5OHLC.CLOSE]));

    // Check if candles are consistently moving in direction
    let trendStrength = 0;
    for (let i = 1; i < closes.length; i++) {
      if (direction === 'BULL' && closes[i] > closes[i-1]) trendStrength++;
      if (direction === 'BEAR' && closes[i] < closes[i-1]) trendStrength++;
    }

    // Bonus if >60% of candles move in direction
    if (trendStrength / closes.length > 0.6) {
      confidence += 0.3;
    }
  }

  return Math.max(0.5, Math.min(1.5, confidence)); // Range: 0.5 to 1.5
};

const isHighQualitySetup = (candlesSeries, direction, currentTradeCount, consecutiveLosses, isAfterStop = false) => {
  // Only hard reject on extreme market conditions
  if (consecutiveLosses > 7) {
    return false; // Only skip after many losses
  }

  return true; // Allow most setups, confidence scoring will size them
};

// Execute Pending Trade (Next Candle Entry): ========================================
// CRITICAL: This executes trades on the NEXT candle's OPEN after signal detection
// This ensures we're not entering on a candle that's already closed (realistic trading)
const executePendingTrade = (currentCandle, currentTime, isFastMode) => {
  if (!pendingTrade) return; // No pending trade

  // ============================================
  // CRITICAL: TTR VALIDATION AT EXECUTION TIME
  // Ensures trades only execute within trading window, accounting for next-candle entry
  // ============================================
  const validateExecutionTimeRange = (dateTimeStr) => {
    // Parse currentTime format: "YYYY.MM.DD HH:MM"
    const parts = dateTimeStr.split(' ');
    const dateFormatted = parts[0].replaceAll('.', '-'); // Convert YYYY.MM.DD to YYYY-MM-DD
    const timeStr = parts[1];

    const startRangeTime = new Date(`${dateFormatted} ${$sessionStartInput.value}`);
    const endRangeTime = new Date(`${dateFormatted} ${$sessionEndInput.value}`);
    const currentCheckTime = new Date(`${dateFormatted} ${timeStr}`);

    const isInWindow = currentCheckTime >= startRangeTime && currentCheckTime <= endRangeTime;

    // DEBUG: Log execution time validation
    console.log(`[TTR VALIDATION @ EXECUTION] Time: ${timeStr} | Range: ${$sessionStartInput.value}-${$sessionEndInput.value} | Valid: ${isInWindow}`);

    return isInWindow;
  };

  // Check if execution time is within trading window
  if (!validateExecutionTimeRange(currentTime)) {
    console.log(`[TRADE REJECTED] Pending signal triggered outside trading hours. Signal detected at: ${pendingTrade.detectedTime || 'unknown'}, Execution attempted at: ${currentTime}`);
    // Keep the pending trade alive - it may execute on a later candle within the window
    // OR clear it if you want to skip the trade completely
    pendingTrade = null; // Discard the pending trade if it misses the window
    return;
  }

  // Execute the trade at this candle's OPEN price
  const MULTI_POS_CONFIG = getMultiPositionConfig();
  const direction = pendingTrade.direction;
  const entryPrice = currentCandle[EnumMT5OHLC.OPEN];
  const tpDistance = tpSize();
  const entryTime = currentTime;

  console.log(`[NEXT CANDLE ENTRY] Direction: ${direction === EnumDirection.BULL ? 'LONG' : 'SHORT'} | Price: ${entryPrice.toFixed(6)} | Time: ${entryTime}`);

  if (MULTI_POS_CONFIG.enabled) {
    // Create multiple positions at once (each with per-position TP target)
    tradeSetId++;

    // ===== SMART FEATURES =====
    // 1. DYNAMIC SL: Use ATR-based SL instead of fixed 1R
    const dynamicSL = currentATR > 0
      ? calculateDynamicSL(entryPrice, direction, currentATR, 1.0)
      : (direction === EnumDirection.BULL
          ? entryPrice - slSize()    // Fallback to fixed SL
          : entryPrice + slSize());

    // 2. SMART POSITION SIZING: Adjust lot size based on equity and R:R
    const rewardInPips = Math.abs(tpDistance);
    const riskInPips = Math.abs(dynamicSL - entryPrice);
    const riskRewardRatio = rewardInPips > 0 ? rewardInPips / riskInPips : 1.0;

    const initialSL = dynamicSL;
    const confidence = pendingTrade.confidence || 1.0;
    console.log(`[SMART SL] ATR: ${currentATR.toFixed(6)} | Dynamic SL: ${initialSL.toFixed(6)} | R:R: ${riskRewardRatio.toFixed(2)} | Confidence: ${confidence.toFixed(2)}x`);

    // Handle variable number of positions (1 for c-only, 3 for multi-position)
    const positionLabels = MULTI_POS_CONFIG.positions.map((p, i) => `${p.name}:${p.lotMultiplier}`).join('/');
    console.log(`[ADAPTIVE LOTS] Base (${positionLabels}) → Scaled by ${confidence.toFixed(2)}x`);

    MULTI_POS_CONFIG.positions.forEach((posConfig, index) => {
      // Per-position TP: scale base TP by lot multiplier
      const positionTpDistance = (posConfig.tpMultiplier || 1.0) * tpDistance;
      const positionTP = direction === EnumDirection.BULL
        ? entryPrice + positionTpDistance   // BULL: TP above entry
        : entryPrice - positionTpDistance;  // BEAR: TP below entry

      // Adaptive lot sizing: Scale by confidence (0.5x to 3x)
      // High confidence = larger position, low confidence = smaller position
      const confidenceMultiplier = pendingTrade.confidence || 1.0;
      const adaptiveLot = posConfig.lotMultiplier * confidenceMultiplier;

      // Additional R:R based sizing
      const smartLot = calculateSmartLotSize(adaptiveLot, riskRewardRatio, 100, 100, 20);

      // Apply CSID breakout distance-based lot multiplier
      const csidBreakoutMultiplier = pendingTrade.csidBreakoutLotMultiplier || 1.0;
      const finalLot = smartLot * csidBreakoutMultiplier;

      ordersHistory.push({
        id: `${tradeSetId}`,
        posName: posConfig.name,
        lotMultiplier: finalLot,  // Use adaptive lot sizing × CSID breakout distance multiplier
        time: entryTime,
        price: entryPrice,
        sl: initialSL,
        initialSL: initialSL,
        tp: positionTP,
        direction: direction,
        slMoveStartR: posConfig.slMoveStartR,
        slMoveCount: 0,
        trailingStartR: posConfig.trailingStartR,
        runToTP: posConfig.runToTP || false,
        trailingActive: false,
        breakEvenMoved: false,
        closed: false,
        closedOrderType: EnumclosedOrderType.PENDING,
      });
    });
  } else {
    // Single position mode
    tradeSetId++;
    const singleSL = direction === EnumDirection.BULL
      ? entryPrice - slSize()
      : entryPrice + slSize();
    const singleTP = direction === EnumDirection.BULL
      ? entryPrice + tpSize()
      : entryPrice - tpSize();

    // Apply CSID breakout distance-based lot multiplier to single position
    const csidBreakoutMultiplier = pendingTrade.csidBreakoutLotMultiplier || 1.0;

    ordersHistory.push({
      id: tradeSetId,
      lotMultiplier: csidBreakoutMultiplier,  // Apply CSID breakout distance multiplier
      breakEvenMoved: false,
      time: entryTime,
      price: entryPrice,
      sl: singleSL,
      tp: singleTP,
      direction: direction,
      closed: false,
      closedOrderType: EnumclosedOrderType.PENDING,
    });
  }

  window.ordersHistory = ordersHistory;

  // Add chart annotation for entry (only if not in fast mode)
  if (!isFastMode && window.sciChartSurface && typeof timeToIndex !== 'undefined') {
    try {
      const { CustomAnnotation, EVerticalAnchorPoint, EHorizontalAnchorPoint } = SciChart;
      const entryUnix = convertMT5DateToUnix(entryTime);
      let candlePosition = timeToIndex.get(entryUnix);

      // If exact time not found, try to find closest match
      if (candlePosition === undefined) {
        console.warn(`[ANNOTATION] Exact time not found: ${entryTime}, searching for closest match...`);
        let closestPosition = undefined;
        let closestDiff = Infinity;
        timeToIndex.forEach((pos, unix) => {
          const diff = Math.abs(unix - entryUnix);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestPosition = pos;
          }
        });
        candlePosition = closestPosition;
        console.log(`[ANNOTATION] Found closest match at diff: ${closestDiff}ms`);
      }

      console.log(`[ANNOTATION] Entry Time: ${entryTime} | Unix: ${entryUnix} | Position: ${candlePosition} | Aligned: ${Math.round(candlePosition)}`);

      if (candlePosition !== undefined && window.signalAnnotation) {
        // Use exact position (don't round) - same as exit line positioning
        window.sciChartSurface.annotations.add(
          new CustomAnnotation({
            x1: candlePosition,
            y1: entryPrice,
            verticalAnchorPoint: EVerticalAnchorPoint.Center,
            horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
            svgString: direction === EnumDirection.BULL
              ? window.signalAnnotation.svgString.orderEntryBuy
              : window.signalAnnotation.svgString.orderEntrySell,
          })
        );
      } else {
        console.warn(`[ANNOTATION] Could not find position for time: ${entryTime}`);
      }
    } catch (err) {
      console.warn('Could not add entry annotation:', err);
    }
  }

  // Increment trade count for this signal wave
  tradeCount++;
  console.log(`[TRADE EXECUTED] Trade ${tradeCount} for current signal wave`);

  // Clear pending trade - this prevents multiple entries on the same signal
  // Only one trade set (A+B+C positions) per signal
  pendingTrade = null;
};
// End of Execute Pending Trade ========================================

const handleFileAndInitGraph = (file) => {
  if (file) {
    // Use reinitializeChart to properly reset
    if (typeof reinitializeChart === 'function') {
      reinitializeChart();
    }

    // Ensure chart section is visible
    const chartSection = document.querySelector('.chart-section');
    if (chartSection) {
      chartSection.classList.remove('chart-collapsed');
      chartSection.classList.add('chart-expanded');
    }

    // Clear orders history
    ordersHistory = [];
    numbDays = 0;
    processedDays = 0;
    processedCandles = 0;
    chartCandleIndex = 0;
    candleTimes = [];
    timeToIndex = new Map();

    // Reset portfolio graph and order history display
    $backTestingResult.value = '';
    document.getElementById('backtestingResultOrderHistory').innerHTML = '';

    // Hide Visualize button when starting new backtest
    hideVisualizeButton();

    // Add visible class to loading element
    const loadingEl = document.getElementById('loading-element');
    loadingEl.classList.add('visible');
    loadingEl.querySelector('.loading-text').textContent = 'Running backtest...';

    // Read the CSV file just to get the first and last dates and count total candles:
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);

      const firstLine = lines[1];
      const lastLine = lines[lines.length - 1];

      firstDate = firstLine.split('\t')[0];
      lastDate = lastLine.split('\t')[0];
      totalCandles = lines.length - 1; // Subtract header line

      $firstDate.textContent = firstDate;
      $lastDate.textContent = lastDate;
    };
    reader.readAsText(file);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      beforeFirstChunk: (chunk) => {
        // Update play/pause button to show pause state since backtesting is starting
        $backtestingPlayPause.classList.remove('play-btn');
        $backtestingPlayPause.classList.add('pause-btn');
        $backtestingPlayPauseIcon.classList.remove('fa-play');
        $backtestingPlayPauseIcon.classList.add('fa-pause');
        $backtestingPlayPause.title = 'Pause Backtesting (Running)';

        // Destroy previous chart if exists, TODO improve this (better to not use window):
        window.existingChart = Chart.getChart(myChart);
        if (window.existingChart) {
          window.existingChart.destroy();
          window.existingChart = null;
        }

        gradient.addColorStop(0, `#${bullishColor}${RRToolStyles.opacity}`);
        gradient.addColorStop(1, `#${bearishColor}${RRToolStyles.opacity}`);
        datasets[0].borderColor = `#${bullishColor}`
        datasets[0].backgroundColor = gradient;
        datasets[1].borderColor = `#${bearishColor}`
        datasets[1].backgroundColor = gradient;

        // Create new chart no matter what:
        window.existingChart = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            // animation: { duration: 500 },
            responsive: false,
            elements: { point: { radius: 1 } },
            scales: {
              pointsAxis: {
                type: 'linear',
                beginAtZero: false,
                position: 'left',
              },
              equityAxis: {
                type: 'linear',
                beginAtZero: false,
                position: 'right',
                grid: {
                  drawOnChartArea: false, // keep only left grid if you want
                },
              },
            },
          },
        });
      },
      step: (results, parser) => {
        // Store parser reference for external control
        currentParser = parser;

        if (backTestingPaused) {
          parser.pause();
          document
            .getElementById('loading-element')
            .classList.remove('visible');
          return;
        }

        const row = results.data;

        // Skip candles with no volatility (flat candles, often weekends)
        if (row[EnumMT5OHLC.OPEN] === row[EnumMT5OHLC.HIGH] &&
            row[EnumMT5OHLC.HIGH] === row[EnumMT5OHLC.LOW] &&
            row[EnumMT5OHLC.LOW] === row[EnumMT5OHLC.CLOSE]) {
          parser.resume();
          return;
        }

        csvDataIndex += 1;
        processedCandles += 1;

        const isFastMode = $fastBacktestMode?.checked;

        parser.pause();
        // Dynamic infos:
        updateDynamicInfos(results.data, csvDataIndex);

        // CRITICAL: Populate timeToIndex BEFORE calculating indicators
        // This ensures signal markers are placed at the correct chart position
        const unixTime = convertMT5DateToUnix(`${results.data[EnumMT5OHLC.DATE]} ${results.data[EnumMT5OHLC.TIME]}`);
        if (!timeToIndex.has(unixTime)) {
          timeToIndex.set(unixTime, chartCandleIndex);
          candleTimes.push(unixTime);
          chartCandleIndex++;
        }

        // CRITICAL: Execute any pending trade from PREVIOUS candle at THIS candle's OPEN
        // This ensures entries happen on next candle open, not current candle close (realistic trading)
        const currentTime = `${results.data[EnumMT5OHLC.DATE]} ${results.data[EnumMT5OHLC.TIME]}`;
        executePendingTrade(results.data, currentTime, isFastMode);

        // Only update chart if NOT in fast mode
        // CRITICAL: Calculate indicators ALWAYS (even in Fast Mode) - only skip chart rendering
        // Indicators must be calculated to generate signals for trading
        calculateIndicators(results.data, csvDataIndex);

        if (!isFastMode) {
          // Append data to the chart:
          appendDataToChart(results.data);
          // Backtesting date time logics (annotation on chart and select element population):
          addBacktestingDateTimeToChart(results.data, csvDataIndex);
          // Plot real-time indicators (chart visualization only):
          appendIndicatorsToChart(results.data, csvDataIndex);
        }

        // Run the Check for TP/SL hit function on every candle (always run this - it's the core logic)
        checkForTPSLHit(results.data, csvDataIndex, isFastMode);
        // Note: profitabilityCalculation() is now called only when trades close (in closeOrder function)

        // Handle single-step mode
        if (backTestingStepMode) {
          backTestingStepMode = false; // Reset step mode
          backTestingPaused = true; // Pause after this step
          document.getElementById('loading-element').classList.remove('visible');
          // Don't resume parser automatically
          return;
        }

        //audioSuccess.play();
        setTimeout(() => {
          parser.resume();
        }, readingSpeed);
      },
      complete: (results, file) => {
        // Clear parser reference
        currentParser = null;
        // Remove visible class from loading element
        document.getElementById('loading-element').classList.remove('visible');

        // CRITICAL: Calculate profitability once at end if in Fast Mode
        // In Fast Mode, we skipped profitabilityCalculation on every trade close
        const isFastMode = $fastBacktestMode?.checked;
        if (isFastMode) {
          // Auto-visualize results in Fast Mode - build chart automatically
          visualizeBacktestResults();
        }

        // Backtest summary
        const totalOrders = ordersHistory.length;
        const closedOrders = ordersHistory.filter(o => o.closed).length;
        const wins = ordersHistory.filter(o => o.closed && o.tradeResult === 'WIN').length;
        const losses = ordersHistory.filter(o => o.closed && o.tradeResult === 'LOSS').length;
        console.log('========== BACKTEST COMPLETE ==========');
        console.log('Total candles processed:', processedCandles);
        console.log('Total orders:', totalOrders);
        console.log('Closed orders:', closedOrders);
        console.log('Wins:', wins, '| Losses:', losses);
        if (ordersHistory.length > 0) {
          console.log('First 3 orders:', JSON.stringify(ordersHistory.slice(0, 3)));
        } else {
          console.log('No orders taken - check strategy signals and time range');
        }
        console.log('=========================================');

        // Populate trade history textarea
        populateTradeHistoryTextarea();

        // Show Visualize button in BRAlgo panel if we have trade results
        showVisualizeButton();

        // Cache the CSV data for optimized backtest
        cachedCSVData = results.data.filter(row => row && row[EnumMT5OHLC.OPEN]);
        cachedFile = file;
        cachedFileInfo = {
          name: file.name,
          firstDate: cachedCSVData[0]?.[EnumMT5OHLC.DATE],
          lastDate: cachedCSVData[cachedCSVData.length - 1]?.[EnumMT5OHLC.DATE],
          totalCandles: cachedCSVData.length,
        };

        console.log(`CSV cached: ${cachedCSVData.length} candles loaded`);

        audioSuccess.play();
      },
      error: (error) => {
        // Clear parser reference on error
        currentParser = null;
        console.error('Error parsing CSV:', error);
      },
    });

    $resultPanelToolbarContentTogglerAlgo?.click();
  }
};

$csvFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  handleFileAndInitGraph(file);
});

$csvRefresh.addEventListener('click', () => {
  const file = $csvFileInput.files[0];
  // Reset control states
  backTestingPaused = false;
  backTestingStepMode = false;
  $backtestingPlayPause.classList.remove('pause-btn');
  $backtestingPlayPause.classList.add('play-btn');
  handleFileAndInitGraph(file);
});

document.addEventListener('DOMContentLoaded', () => {
  // Initialize chart section state
  const $chartSection = document.querySelector('.chart-section');
  if ($chartSection) {
    $chartSection.classList.add('chart-expanded');
  }

  // Initially disable Google Sheets button since there's no data yet
  updateGoogleSheetsButtonState();
  
  // Load and display saved results from localStorage
  loadResultsFromStorage();
  if (backtestResults.length > 0) {
    updateSavedResultsComparison();
    renderComparisonChart();
  }

  // Extract URL parameters
  const urlParams = new URLSearchParams(window.location.search);

  // Get and parse "theme" param if exists
  const themeParams = new URLSearchParams(urlParams.get('theme') || '');

  // Extract colors with fallback to existing vars
  bullishColor = themeParams.get('bullishColor') || bullishColor;
  bearishColor = themeParams.get('bearishColor') || bearishColor;

  document.querySelectorAll("label[title]").forEach(label => {
    //const icon = document.createElement("i");
    const icon = document.createElement("span");
    icon.textContent = "*";
    icon.style.color = `#${bullishColor}`;
    icon.style.marginLeft = "5px";
    icon.title = label.getAttribute("title");
    label.appendChild(icon);
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+G: Run grid search
    if (e.ctrlKey && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      runGridSearch();
    }
  });
  
  // Comparison panel button handler
  const comparisonBtn = document.getElementById('result-panel-toolbar-content-toggler-comparison');
  if (comparisonBtn) {
    comparisonBtn.addEventListener('click', revealComparison);
  }
});

const initSciChart = (data) => {
  const {
    SciChartSurface,
    NumericAxis,
    FastCandlestickRenderableSeries,
    OhlcDataSeries,
    SciChartJsNavyTheme,
    SciChartJSDarkv2Theme,
    NumberRange,
    MouseWheelZoomModifier,
    ZoomPanModifier,
    ZoomExtentsModifier,
    YAxisDragModifier,
    XAxisDragModifier,
    DateTimeNumericAxis,
    DateLabelProvider,
    EDragMode,
    CursorModifier,
    BoxAnnotation,
    ECoordinateMode,
    getCanvasCoordinatesFromEvent,
    VerticalLineAnnotation,
    SolidColorBrush,
    Colors,
    ELabelPlacement,
    EAnnotationLayer,
    DateRange,
    EAutoRange,
    LineAnnotation,
    AxisMarkerAnnotation,
    CustomAnnotation,
    TextAnnotation,
    EVerticalAnchorPoint,
    EHorizontalAnchorPoint,
    ENumericFormat,
    EDateFormatter,
    Point,
    FastLineRenderableSeries,
    FastBandRenderableSeries,
    XyDataSeries,
    XyyDataSeries,
    EAxisAlignment,
    // GlowEffect,
    // ShadowEffect,
  } = SciChart;

  // Tell SciChart where to get webassembly files from.
  SciChartSurface.useWasmFromCDN();

  // Initialize SciChartSurface. Don't forget to await!
  if (window.sciChartSurface) {
    try {
      window.sciChartSurface.renderableSeries.clear();
      window.sciChartSurface = null;
      console.log('Destroyed old SciChartSurface');
    } catch (e) {
      console.warn('Error destroying old surface:', e);
    }
  }
  
  SciChartSurface.create('scichart-root', {
    //theme: new SciChartJsNavyTheme(),
  })
    .then(({ sciChartSurface, wasmContext }) => {
      // Create a custom theme by implementing all the properties from IThemeProvider
      const customTheme = {
        axisBorder: 'Transparent',
        axisTitleColor: '#111',
        annotationsGripsBackroundBrush: 'white',
        annotationsGripsBorderBrush: 'white',
        axis3DBandsFill: '#000', //'#1F3D6833', // Bands (Not sure if used)
        axisBandsFill: '#030300', // Bands
        axisPlaneBackgroundFill: 'Transparent',
        columnFillBrush: 'white',
        columnLineColor: 'Transparent',
        cursorLineBrush: '#111',
        downBandSeriesFillColor: '#52CC5490',
        downBandSeriesLineColor: '#E26565FF',
        downBodyBrush: bearishColor, // candle
        downWickColor: bearishColor, // candle
        gridBackgroundBrush: 'white',
        gridBorderBrush: 'white',
        labelForegroundBrush: '#EEEEEE',
        legendBackgroundBrush: '#1D2C35',
        lineSeriesColor: 'white',
        loadingAnimationBackground: '#111',
        loadingAnimationForeground: '#111',
        majorGridLineBrush: '#111', // Major grid lines color
        minorGridLineBrush: '#000', // Minor grid lines color
        mountainAreaBrush: 'white',
        mountainLineColor: 'white',
        overviewFillBrush: 'white',
        planeBorderColor: 'white',
        rolloverLineBrush: '#FD9F2533',
        rubberBandFillBrush: '#99999933',
        rubberBandStrokeBrush: '#99999977',
        sciChartBackground: '#000', // Chart background color
        scrollbarBackgroundBrush: 'white',
        scrollbarBorderBrush: 'white',
        scrollbarGripsBackgroundBrush: 'white',
        scrollbarViewportBackgroundBrush: 'white',
        scrollbarViewportBorderBrush: 'white',
        shadowEffectColor: 'white',
        textAnnotationBackground: '#333',
        textAnnotationForeground: '#EEEEEE',
        tickTextBrush: '#333',
        upBandSeriesFillColor: 'white',
        upBandSeriesLineColor: 'white',
        upBodyBrush: bullishColor, // candle
        upWickColor: bullishColor, // candle
      };
      sciChartSurface.applyTheme(customTheme);

      window.sciChartSurface = sciChartSurface;

      // Cursor labels:
      const growBy = new NumberRange(0.2, 0.2);
      const xAxis = new NumericAxis(wasmContext, {
        growBy,
        axisAlignment: EAxisAlignment.Bottom,
      });
      xAxis.labelProvider.formatCursorLabel = (dataValue) => {
        const index = Math.round(dataValue);
        const unixTime = candleTimes[index];
        return unixTime ? formatDateFromUnix(unixTime) : '';
      };
      xAxis.labelProvider.formatLabel = xAxis.labelProvider.formatCursorLabel;
      const yAxis = new NumericAxis(wasmContext, {
        growBy,
        labelPrecision: decimals,
        autoRange: EAutoRange.Once,
        // visibleRangeLimit: new NumberRange(1.02, 1.03),
        axisAlignment: EAxisAlignment.Right,
      });

      sciChartSurface.xAxes.add(xAxis);
      sciChartSurface.yAxes.add(yAxis);

      // Variables initialization =========================
      let annotations = [];
      let arrayOfSignals = [false, true, false, false]; // [CSID, TTR, ATR, boolean if ma has a strong direction]
      // NOTE: tradeCount is now declared at global scope
      // Variables initialization for CSID:
      let rollingHighestHighDataSeries = null;
      let rollingLowestLowDataSeries = null;
      const lookbackPeriod = 20; // 15
      const lookbackPeriodForCSIDHigh = lookbackPeriod;
      const lookbackPeriodForCSIDLow = 9;
      const highestHighLong = [];
      const lowestLowShort = [];
      // Variables initialization for ATR:
      let listeningATR = true; // Flag to check if we listening for ATR
      // End of Variables initialization =========================

      const signalOffset = 20;
      const signalAnnotation = {
        svgString: {
          orderEntryBuy: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#0000FF;" d="M 55,85 L 60,75 L 65,85 Z"/></g></svg>`,
          orderEntrySell: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#0000FF;" d="M 55,75 L 60,85 L 65,75 Z"/></g></svg>`,
          buy: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#0000FF;" d="M 55,85 L 60,75 L 65,85 Z"/></g></svg>`,
          bullish: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" transform="translate(0, ${signalOffset})"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#00FF00; opacity:0.3;" d="M 55,85 L 60,75 L 65,85 Z"/></g></svg>`,
          sell: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#FF0000;" d="M 55,75 L 60,85 L 65,75 Z"/></g></svg>`,
          bearish: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" transform="translate(0, -${signalOffset})"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#FF0000; opacity:0.3;" d="M 55,75 L 60,85 L 65,75 Z"/></g></svg>`,
          circle: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" style="fill:#${bullishColor};fill-opacity:0.34117647;stroke:#${bullishColor};stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></svg>`,
        },
      };
      // Make signalAnnotation globally available for next-candle entry
      window.signalAnnotation = signalAnnotation;

      RRToolStyles = {
        ...RRToolStyles,
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        annotationLayer: EAnnotationLayer.AboveChart,
      };

      // function ceilToDecimalPlaces(num, decimalPlaces) {
      //   const factor = Math.pow(10, decimalPlaces); // Calculate 10^decimalPlaces
      //   return Math.ceil(num * factor) / factor; // Ceil and then divide
      // }

      // Function to update Y-axis range dynamically
      // function updateYAxisRange() {
      //   const yMin = 1.034; // ohlcDataSeries.getNativeYMin();
      //   const yMax = 1.042; // ohlcDataSeries.getNativeYMax();

      //   sciChartSurface.yAxes.get(0).visibleRangeLimit = new NumberRange(
      //     yMin,
      //     yMax
      //   );
      // }

      // Take trades when signals are valid:
      const checkSignalsForTrade = (d, direction) => {
        // NOTE: Monthly max loss checking is only for grid search mode, not main backtest
        // Removed localMonthlyPnl check to avoid reference errors

        const takeTradeSignal =
          arrayOfSignals[EnumArrayOfSignalsIndex.CSID] == true &&
          arrayOfSignals[EnumArrayOfSignalsIndex.TTR] == true &&
          arrayOfSignals[EnumArrayOfSignalsIndex.ATR] == true &&
          arrayOfSignals[EnumArrayOfSignalsIndex.MADirection] == true;
        
        // FIX: Only take trade if we haven't reached max 3 trades for this signal
        if (takeTradeSignal && tradeCount < 3) {
          tradeCount++;
          AddActionOnChart(d, EnumActionType.TAKE_A_TRADE, direction);
          listeningATR = true;
          
          // Reset ATR signal after max 3 trades to prevent further triggers
          if (tradeCount >= 3) {
            arrayOfSignals[EnumArrayOfSignalsIndex.ATR] = false;
            arrayOfSignals[EnumArrayOfSignalsIndex.CSID] = false; // Also reset CSID to prevent new signals in same wave
            console.log(`Signal completed: ${tradeCount} trades taken`);
          }
        }
      };

      // TP/SL Validation: ========================================
      // Function to check all TP/SL hit:
      // OPTIMIZED: Only process active orders instead of filtering through all orders
      const checkForTPSLHit = (d, dataIndex, isFastMode = false) => {
        // Only check active (non-closed) orders to reduce processing overhead
        const activeOrders = ordersHistory.filter(order => !order.closed);
        activeOrders.forEach((order) => {

          const isBull = order.direction === EnumDirection.BULL;
          const isBear = order.direction === EnumDirection.BEAR;
          const high = d[EnumMT5OHLC.HIGH];
          const low = d[EnumMT5OHLC.LOW];
          const close = d[EnumMT5OHLC.CLOSE];
          const open = d[EnumMT5OHLC.OPEN];

          // break-even at SL distance (1R) — single-position only
          // Multi-position orders use progressive SL movement instead (below)
          const isMultiPosOrder = order.slMoveStartR !== undefined;
          if (!isMultiPosOrder && !order.breakEvenMoved) {
            const slDistance = slSize();
            if (
              (isBull && close >= order.price + slDistance) ||
              (isBear && close <= order.price - slDistance)
            ) {
              order.sl = order.price;
              order.breakEvenMoved = true;
            }
          }
          const currentTime = `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`;
          const orderOpenTime = convertMT5DateToUnix(order.time);
          
          // Skip trailing logic on the entry candle
          const isEntryCandle = order.time === currentTime;

          const tradeResult = () => {
            if (order.pnlPoints > 0) {
              return EnumTradeResult.WIN;
            } else if (order.pnlPoints < -0.0001) {
              return EnumTradeResult.LOSS;
            } else {
              return EnumTradeResult.BE;
            }
          };

          const tradeResultColor = () => {
            switch (order.tradeResult) {
              case EnumTradeResult.WIN:
                return bullishColor;
              case EnumTradeResult.LOSS:
                return bearishColor;
              case EnumTradeResult.BE:
                return 'FFFF00';
              default:
                return '666666';
            }
          };

          const closeOrder = (level, status) => {
            order.closed = true;
            order.closedPrice = level;
            order.closedTime = currentTime;
            order.closedOrderType = status;
            order.pnlPoints =
              order.direction == EnumDirection.BULL
                ? level - order.price
                : order.price - level;
            order.tradeResult = tradeResult();
            
            // Calculate money P&L
            const lotMult = order.lotMultiplier || 1;
            order.pnlMoney = order.pnlPoints * 100000 * lotMult; // Approx for EURUSD

            // NOTE: Monthly P&L tracking is only used in grid search mode, not in main backtest
            // Skipping monthly P&L update since localCurrentMonth is not defined in backtest scope

            // DEBUG: Skip logging in Fast Mode (expensive console operations)
            if (!isFastMode && order.slMoveStartR !== undefined) {
              const isTP = Math.abs(level - order.tp) < 0.00001;
              const isSL = Math.abs(level - order.sl) < 0.00001;
              console.log(`[MultiPos] ${order.id} closes at ${level.toFixed(6)} | Entry: ${order.price.toFixed(6)} | SL: ${order.sl.toFixed(6)} | TP: ${order.tp.toFixed(6)} | Type: ${isTP ? 'TP' : isSL ? 'SL' : '?'} | Status: ${status} | PnL: ${order.pnlPoints.toFixed(6)}`);
            }

            // CRITICAL OPTIMIZATION: Skip profitability calculation in Fast Mode
            // In Fast Mode, calculate only at the end, not on every trade close (O(n²) to O(1))
            if (!isFastMode) {
              profitabilityCalculation();
            }

            // OPTIMIZATION: Skip chart annotations in Fast Mode (expensive SciChart operations)
            if (!isFastMode) {
              // Clean up trailing stop visualization
              if (trailingStopSeriesMap.has(order.id)) {
                const series = trailingStopSeriesMap.get(order.id);
                if (series && sciChartSurface) {
                  sciChartSurface.renderableSeries.remove(series);
                }
                trailingStopSeriesMap.delete(order.id);
              }

              const orderCloseTime = convertMT5DateToUnix(order.closedTime);

              // Marker (close arrow)
              sciChartSurface.annotations.add(
                new CustomAnnotation({
                  x1: timeToIndex.get(orderCloseTime),
                  y1: level,
                  verticalAnchorPoint: EVerticalAnchorPoint.Center,
                  horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                  svgString: signalAnnotation.svgString.sell,
                })
              );

              // Text label
              sciChartSurface.annotations.add(
                new TextAnnotation({
                  text: order.id,
                  horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                  verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
                  x1: timeToIndex.get(orderCloseTime),
                  y1: level,
                })
              );

              // Line - trade entry to close
              const tradeResultedColor = tradeResultColor();
              sciChartSurface.annotations.add(
                new LineAnnotation({
                  stroke: `#${tradeResultedColor}`,
                  strokeThickness: 1,
                  strokeDashArray: [5, 5],
                  x1: timeToIndex.get(orderOpenTime),
                  x2: timeToIndex.get(orderCloseTime),
                  y1: order.price,
                  y2: level,
                })
              );
            }
          };

            // Modify SL (Trailing Stop) - Match Grid Search logic
            if (candlesFromBuffer.length < 2) return;

            // Calculate current R for this order (same as Grid Search)
            const currentR = isBull
              ? (close - order.price) / slSize()
              : (order.price - close) / slSize();

           const trailingStopSize =
             parseFloat($TSIncrementInput.value) || 0.0000;

           const previousCandle =
             candlesFromBuffer[candlesFromBuffer.length - 2];

           // Candle size calculation:
           let candleSize = Math.abs(previousCandle["<CLOSE>"] - previousCandle["<OPEN>"]); // Need to be the previous candle, as current candle is not closed yet at this time (in a real scenario).
           candleSize = Number(candleSize.toFixed(4)); // → 0.0005

           /*
             The following might only work for EURUSD like pairs, TODO: I'll need to generalize it later.
             As for EURUSD I hardcoded two thresholds for candle size:
             - 0.0005 (50 pips)
             - 0.0003 (30 pips)
           */
           const trailingSizeMultiplier = (candleSize) => {
             switch (strategy) {
               case EnumStrategy.CSID_W_MA_DynamicTS:
                 if (candleSize >= 0.0005) return trailingStopSize * 3;
                 else if (candleSize >= 0.0003) return trailingStopSize * 2;
                 else return trailingStopSize;
               case EnumStrategy.CSID_W_MA:
               case EnumStrategy.CSID:
               default:
                 return trailingStopSize;
             }
           }
           const trailingSize = trailingSizeMultiplier(candleSize);

            if (isMultiPosOrder && !isEntryCandle) {
              // === Multi-position SL management (matches fast mode) ===

              // Initialize trailingActive if not exists (for backward compatibility)
              if (order.trailingActive === undefined) {
                order.trailingActive = false;
              }

              // 1. Progressive SL movement (move SL every 0.5R) — per-position
              if (!order.trailingActive) {
               const slMoveThreshold = order.slMoveStartR + (order.slMoveCount * 0.5);
               if (currentR >= slMoveThreshold) {
                 // For BULL: SL starts at entry - 1R, moves up as profit increases
                 // For BEAR: SL starts at entry + 1R, moves down as profit increases
                 const slAdjustment = slMoveThreshold * slSize();
                 const newSL = isBull
                   ? order.price - slSize() + slAdjustment
                   : order.price + slSize() - slAdjustment;
                 const oldSL = order.sl;
                 order.sl = newSL;
                 order.slMoveCount++;

                 // DEBUG: Log SL moves for B and C
                 if (order.posName && order.posName !== 'A') {
                   console.log(`[SL MOVE] ${order.id} | currentR: ${currentR.toFixed(2)}R | threshold: ${slMoveThreshold.toFixed(2)}R | oldSL: ${oldSL.toFixed(6)} -> newSL: ${newSL.toFixed(6)} | count: ${order.slMoveCount}`);
                 }
               }
             }

             // 2. Activate trailing after per-position trailingStartR (skip for runToTP — they ride to TP)
             if (!order.runToTP && currentR >= order.trailingStartR && !order.trailingActive) {
               order.trailingActive = true;
             }

             // 3. Apply trailing stop with profit-lock (only improve SL)
             if (order.trailingActive && candlesFromBuffer.length >= 2) {
               const newTrailingSL = isBull
                 ? close - trailingSize
                 : close + trailingSize;

               const slImproved = isBull
                 ? newTrailingSL > order.sl
                 : newTrailingSL < order.sl;

               if (slImproved) {
                 order.sl = newTrailingSL;
               }
             }
            } else if (!isEntryCandle) {
              // === Single-position trailing (matches fast mode) ===
              if (isBull) {
                order.sl += trailingSize;
              } else {
                order.sl -= trailingSize;
              }
            }

          // Trailing Stop visual (skip in Fast Mode to avoid SciChart overhead):
          if (!isFastMode) {
          const updateTrailingStopVisual = (order, d) => {
            try {
              // Skip visual update if chart is not initialized
              if (!window.sciChartSurface) return;

              const time = new Date(`${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`);
            const localISO = time.getTime() / 1000;
            const xValue = timeToIndex.get(localISO);

            const yValue = order.sl;       // current trailing stop
            const y1Value = order.price;   // entry price (constant)

            let trailingStopUIOption = {};
            if (order.direction === EnumDirection.BULL) {
              trailingStopUIOption = {
                fill: "#FF000033",
                fillY1: "#00FF0033",
              };
            } else {
              trailingStopUIOption = {
                fill: "#00FF0033",
                fillY1: "#FF000033",
              };
            }

            if (trailingStopSeriesMap.has(order.id)) {
              // update existing series by appending new candle data
              const series = trailingStopSeriesMap.get(order.id);
              if (series && series.dataSeries) {
                series.dataSeries.append(xValue, yValue, y1Value);
              }
            } else {
              // first time -> create a new series with 1 point
              const dataSeries = new XyyDataSeries(wasmContext, {
                xValues: [xValue],
                yValues: [yValue],
                y1Values: [y1Value],
              });

              const newSeries = new FastBandRenderableSeries(wasmContext, {
                dataSeries,
                ...trailingStopUIOption,
                strokeThickness: 1,
                stroke: "#333",
                strokeY1: "#FFFFFF",
                isDigitalLine: true,
              });

              sciChartSurface.renderableSeries.add(newSeries);
              trailingStopSeriesMap.set(order.id, newSeries);
            }
            } catch (e) {
              // Silently skip visual update errors
            }
          };
          updateTrailingStopVisual(order, d);
          } // end if (!isFastMode)

          // Check TP (only if not already closed)
          if (!order.closed && ((isBull && high >= order.tp) || (!isBull && low <= order.tp))) {
            // DEBUG: Log TP hit
            if (order.slMoveStartR !== undefined) {
              console.log(`[TP HIT] ${order.id} at candle high/low | high: ${high.toFixed(6)}, TP: ${order.tp.toFixed(6)}, SL: ${order.sl.toFixed(6)}`);
            }
            closeOrder(order.tp, EnumclosedOrderType.CLOSED_BY_TP);
          }

          // Check SL (only if not already closed)
          if (!order.closed && ((isBull && low <= order.sl) || (!isBull && high >= order.sl))) {
            // DEBUG: Log SL hit
            if (order.slMoveStartR !== undefined) {
              console.log(`[SL HIT] ${order.id} at candle low | low: ${low.toFixed(6)}, SL: ${order.sl.toFixed(6)}, TP: ${order.tp.toFixed(6)}`);
            }
            closeOrder(order.sl, EnumclosedOrderType.CLOSED_BY_SL);
          }
        });
      };
      window.checkForTPSLHit = checkForTPSLHit;
      // End of TP/SL Validation ========================================

      // AddActionOnChart: ========================================
      // Function to create annotations or take actions on the chart, based on UI selected options:
      const AddActionOnChart = (
        candle,
        EnumActionType,
        tradeDirection = EnumDirection.BULL
      ) => {
        const candlePosition = timeToIndex.get(convertMT5DateToUnix(
          `${candle['<DATE>']} ${candle['<TIME>']}`
        ));
        switch (EnumActionType) {
          case 'VERTICAL_LINE':
            sciChartSurface.annotations.add(
              new VerticalLineAnnotation({
                x1: candlePosition,
                stroke: `#${bullishColor}`,
                strokeThickness: 1,
              })
            );
            break;
          case 'DRAW_A_CIRCLE':
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[EnumOHLC.CLOSE],
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.circle,
              })
            );
            break;
          case 'TAKE_A_TRADE':
            const definedCandleMoment = EnumMT5OHLC.OPEN;
            const MULTI_POS_CONFIG = getMultiPositionConfig();
            const tradeDirectionIsBull = tradeDirection == EnumDirection.BULL;
            const entryPrice = candle[definedCandleMoment];
            const tpDistance = tpSize();
            const direction = tradeDirectionIsBull ? EnumDirection.BULL : EnumDirection.BEAR;
            const entryTime = `${candle[EnumMT5OHLC.DATE]} ${candle[EnumMT5OHLC.TIME]}`;

            if (MULTI_POS_CONFIG.enabled) {
              // Create multiple positions at once (each with per-position TP target)
              // Increment tradeSetId for this new trade set (only once per signal)
              tradeSetId++;
              // Initial SL is 1R from entry (same for all positions)
              const initialSL = tradeDirectionIsBull
                ? entryPrice - slSize()    // BULL: SL below entry
                : entryPrice + slSize();    // BEAR: SL above entry

              MULTI_POS_CONFIG.positions.forEach(posConfig => {
                // Per-position TP: scale base TP by lot multiplier (e.g., if TP=3R, A gets 3.0R, B gets 2.1R, C gets 1.5R)
                const positionTpDistance = (posConfig.tpMultiplier || 1.0) * tpDistance;
                const positionTP = tradeDirectionIsBull
                  ? entryPrice + positionTpDistance   // BULL: TP above entry
                  : entryPrice - positionTpDistance;  // BEAR: TP below entry

                ordersHistory.push({
                  id: `${tradeSetId}-${posConfig.name}`,
                  posName: posConfig.name,
                  lotMultiplier: posConfig.lotMultiplier,
                  time: entryTime,
                  price: entryPrice,
                  sl: initialSL,
                  initialSL: initialSL,
                  tp: positionTP,
                  direction: direction,
                  slMoveStartR: posConfig.slMoveStartR,
                  slMoveCount: 0,
                  trailingStartR: posConfig.trailingStartR,
                  runToTP: posConfig.runToTP || false,
                  trailingActive: false,
                  breakEvenMoved: false,
                  closed: false,
                  closedOrderType: EnumclosedOrderType.PENDING,
                });
              });
            } else {
              // Single position mode (original) - use 1R SL
              tradeSetId++;
              const singleSL = tradeDirectionIsBull 
                ? entryPrice - slSize() 
                : entryPrice + slSize();
              const singleTP = tradeDirectionIsBull 
                ? entryPrice + tpSize() 
                : entryPrice - tpSize();
              ordersHistory.push({
                id: tradeSetId,
                breakEvenMoved: false,
                time: entryTime,
                price: entryPrice,
                sl: singleSL,
                tp: singleTP,
                direction: direction,
                closed: false,
                closedOrderType: EnumclosedOrderType.PENDING,
              });
            }
            window.ordersHistory = ordersHistory;

            // Add annotation for orders history:
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[definedCandleMoment],
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString:
                  tradeDirection == EnumDirection.BULL
                    ? signalAnnotation.svgString.orderEntryBuy
                    : signalAnnotation.svgString.orderEntrySell,
              })
            );
            break;
          case 'REVIEW_A_TRADE':
            const orderOptionsBasedDirection2 = (tradeDirection) => {
              if (tradeDirection == EnumDirection.BULL) {
                return {
                  sl: candle[definedCandleMoment],
                  tp: candle[definedCandleMoment],
                  direction: EnumDirection.BULL,
                };
              } else {
                return {
                  sl: candle[definedCandleMoment],
                  tp: candle[definedCandleMoment],
                  direction: EnumDirection.BEAR,
                };
              }
            };
            // Add order to history:
            ordersHistory.push({
              id: ordersHistory.length + 1,
              time: candle[EnumMT5OHLC.TIME],
              price: candle[definedCandleMoment],
              closedOrderType: EnumclosedOrderType.PENDING,
              ...orderOptionsBasedDirection2(tradeDirection),
            });

            window.ordersHistory = ordersHistory;

            // Add annotation from entry:
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[definedCandleMoment],
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.buy,
              })
            );
            break;
        }
      };
      // End of AddActionOnChart ========================================

      let canTakeATrade = true;
      let inRange = false;
      let savedTradeDirectionForNextCandleEntry = null;

      // NOTE: pendingTrade is now declared at global scope (before Papa.parse)
      // This allows both the main backtest loop and SciChart promise to access it

      let swingHighLowHistory = [];
      let fvgHistory = [];
      const offsetCandleDateTimeStamp = (candleDateTimeStamp) =>
        candleDateTimeStamp; // - 3600 * 1; // !! offseting candle position in X axis by -1h to match tradingView (The correct way would be to offset the axis labels, but dont know how to do it yet)

      // First function to be executed as soon as the data is loaded, you can do anything you want here:
      const onData = (ohlcData) => {
        // console.log('ohlcData:', ohlcData);
      };

      // Second function to be executed after the candle is drawn, you can add annotations here:
      /*
      const onCandleDrawn = (candle, index, candlesFromBuffer) => {
        const algoEditorTextareaMain0 = document.getElementById(
          'algoEditorTextareaMain0'
        );
        const algoEditorTextareaMain1 = document.getElementById(
          'algoEditorTextareaMain1'
        );
        const hourMinutes = () => candle[0].split(' ')[1].slice(0, 5);
        let arrayOfSignals = [];
        const candlePosition = convertMT5DateToUnix(candle[0]);

        // candle[0] === "2025.01.10 21:10:00" && AddActionOnChart(candle, EnumActionType.VERTICAL_LINE);

        // Swing High/Low Logic: ========================================
        let isSwingHigh = false;
        let isSwingLow = false;

        // Get 4 candles for swing analysis:
        // let candleBufferForAnalisis = candlesFromBuffer.slice(-4);
        const selectedIndexForSelectedCandleForAnalisis =
          candlesFromBuffer.length - 2;

        const swhlPrevCandle2 =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis - 2];
        const swhlPrevCandle =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis - 1];
        const selectedCandleForAnalisis =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis]; // selected candle for analysis is the 2nd last candle from the buffer, because the last candle is the current candle and we will analize the next candle
        const swhlNextCandle =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis + 1];

        const SignalSwingHighLow = () => {
          // if (index < 4 || index > candlesFromBuffer.length - 3)
          if (index < 4)
            return false;

          // For swing high, current candle high is less than or equal to the previous candle high and the previous candle high is greater than the previous candle open:
          isSwingHigh =
            selectedCandleForAnalisis[EnumMT5OHLC.HIGH] <=
              swhlPrevCandle[EnumMT5OHLC.HIGH] &&
            swhlPrevCandle2[EnumMT5OHLC.OPEN] <
              swhlPrevCandle[EnumMT5OHLC.OPEN] &&
            selectedCandleForAnalisis[EnumMT5OHLC.HIGH] >=
              swhlNextCandle[EnumMT5OHLC.HIGH] &&
            getCandleDirectionFromCandle(selectedCandleForAnalisis) ==
              EnumDirection.BEAR;
          // For swing low, current candle low is greater than or equal to the previous candle low and the previous candle low is less than the previous candle close:
          isSwingLow =
            selectedCandleForAnalisis[EnumMT5OHLC.LOW] >=
              swhlPrevCandle[EnumMT5OHLC.LOW] &&
            swhlPrevCandle2[EnumMT5OHLC.CLOSE] >
              swhlPrevCandle[EnumMT5OHLC.CLOSE] &&
            selectedCandleForAnalisis[EnumMT5OHLC.LOW] <=
              swhlNextCandle[EnumMT5OHLC.LOW] &&
            getCandleDirectionFromCandle(selectedCandleForAnalisis) ==
              EnumDirection.BULL;

          return isSwingLow || isSwingHigh;
        };

        if (SignalSwingHighLow()) {
          swingHighLowHistory.push({
            time: swhlPrevCandle[0],
            maxReachedPrice: isSwingHigh
              ? selectedCandleForAnalisis[EnumMT5OHLC.HIGH]
              : selectedCandleForAnalisis[EnumMT5OHLC.LOW], // Represents the highest/lowest price that was reached.
            type: isSwingHigh ? 'HIGH' : 'LOW', // Represents the type of the swing (HIGH or LOW) its the position and NOT the candle direction.
          });

          sciChartSurface.annotations.add(
            new CustomAnnotation({
              x1: convertMT5DateToUnix(
                selectedCandleForAnalisis[EnumMT5OHLC.TIME]
              ),
              y1: isSwingHigh
                ? selectedCandleForAnalisis[EnumMT5OHLC.HIGH]
                : selectedCandleForAnalisis[EnumMT5OHLC.LOW],
              verticalAnchorPoint: isSwingHigh
                ? EVerticalAnchorPoint.Bottom
                : EVerticalAnchorPoint.Top,
              horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
              svgString: isSwingHigh
                ? signalAnnotation.svgString.bearish
                : signalAnnotation.svgString.bullish,
            })
          );
        }
        // End of Swing High/Low Logic: ========================================

        eval(algoEditorTextareaMain1.value);
      };
      */

      const profitabilityCalculation = () => {
        let result = '';

        // Guard: If no closed orders, add placeholder data to prevent SciChart NaN errors
        if (ordersHistory.filter(o => o.closed).length === 0) {
          labels = ['No trades'];
          pnlData = [0];
          equityData = [0];
          return; // Skip further calculations
        }

        // Total profits in points (strategy)
        const profitsInPoints = ordersHistory.reduce((acc, order) => {
          if (order.closedOrderType === EnumclosedOrderType.CLOSED_BY_TP)
            return acc + tpSize();
          if (order.closedOrderType === EnumclosedOrderType.CLOSED_BY_SL)
            return acc - slSize();
          return acc;
        }, 0);

        // Win rates - two types
        const winRateTP = ordersHistory.length > 0
          ? (
              (ordersHistory.filter(
                (order) => order.closedOrderType === EnumclosedOrderType.CLOSED_BY_TP
              ).length /
                ordersHistory.length) *
              100
            ).toFixed(2)
          : 0;

        const winRatePositive = ordersHistory.length > 0
          ? (
              (ordersHistory.filter(
                (order) => order.tradeResult === EnumTradeResult.WIN
              ).length /
                ordersHistory.length) *
              100
            ).toFixed(2)
          : 0;

        // Use positive P/L winrate as the main winRate for backward compatibility
        const winRate = winRatePositive;

        // Profitability chart data
        let sum = 0;
        let equitySumPoints = 0;
        const commissionPoints = commissionSize() || 0.00005;

        let grossProfit = 0;
        let grossLoss = 0;

        const equityDataMoney = []; // in $
        // Reset labels, pnlData, and equityData:
        labels = [];
        pnlData = [];
        equityData.length = 0;

        for (const { id, pnlPoints, lotMultiplier } of ordersHistory) {
          labels.push(id);

          // Strategy cumulative (points)
          sum += +pnlPoints;
          pnlData.push(sum);

          // Equity in points
          equitySumPoints += +pnlPoints - commissionPoints;
          equityData.push(equitySumPoints);

          // Equity in $ (money equivalent, per trade)
          // Use lotMultiplier if available (multi-position mode), otherwise use default lotSize
          const actualLotSize = lotMultiplier ? lotMultiplier * lotSize() : lotSize();
          const tradeMoney = (+pnlPoints - commissionPoints) * 100000 * actualLotSize;
          equityDataMoney.push(
            (equityDataMoney.at(-1) || 0) + tradeMoney // cumulative series
          );

          if (tradeMoney > 0) {
            grossProfit += tradeMoney;
          } else if (tradeMoney < 0) {
            grossLoss += Math.abs(tradeMoney);
          }
        }

        // Profit factor
        let profitFactor;
        if (grossProfit === 0 && grossLoss === 0) {
          profitFactor = '0.00'; // no trades
        } else if (grossLoss === 0) {
          profitFactor = '∞'; // no losses
        } else {
          profitFactor = (grossProfit / grossLoss).toFixed(2);
        }

        // Total wins/losses and consecutive wins/losses
        let totalWins = 0;
        let totalLosses = 0;
        let consecutiveWins = 0;
        let consecutiveLosses = 0;
        let maxConsecutiveWins = 0;
        let maxConsecutiveLosses = 0;
        for (const order of ordersHistory) {
          if (order.tradeResult === EnumTradeResult.WIN) {
            totalWins++;
            consecutiveWins++;
            maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
            consecutiveLosses = 0;
          } else if (order.tradeResult === EnumTradeResult.LOSS) {
            totalLosses++;
            consecutiveLosses++;
            maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
            consecutiveWins = 0;
          }
        }
        consecutiveWins = maxConsecutiveWins;
        consecutiveLosses = maxConsecutiveLosses;

        // Drawdown and updraw calculation
        let maxDrawdown = 0;
        let maxUpdraw = 0;
        let peak = equityDataMoney[0] || 0;
        let trough = equityDataMoney[0] || 0;
        let recoveryStart = equityDataMoney[0] || 0;

        for (const value of equityDataMoney) {
          if (value > peak) {
            // New peak reached - calculate recovery from previous trough
            const recovery = value - trough;
            if (recovery > maxUpdraw) {
              maxUpdraw = recovery;
            }
            // Reset for next potential drawdown
            peak = value;
            trough = value;
            recoveryStart = value;
          } else if (value < trough) {
            // New trough reached - calculate drawdown from previous peak
            trough = value;
            const drawdown = peak - trough;
            if (drawdown > maxDrawdown) {
              maxDrawdown = drawdown;
            }
          }
        }

        // Lowest and Highest equity value
        const lowestEquity = Math.min(...equityDataMoney);
        const highestEquity = Math.max(...equityDataMoney);

        // Money equivalent = last equity value
        const moneyEquivalent =
          equityDataMoney[equityDataMoney.length - 1] || 0;

        //console.table([profitsInPoints, moneyEquivalent]);

          // CSV builder
          const resultToCSV = () => {
            // Handle case when CSV is loaded from URL parameter (no file input)
            let csvFileName = '';
            if ($csvFileInput && $csvFileInput.value) {
              csvFileName = $csvFileInput.value.split('\\')[2]?.split('.')[0] || 'unknown';
            } else if (cachedFileInfo && cachedFileInfo.name) {
              csvFileName = cachedFileInfo.name.replace('.csv', '');
            } else if (window.location.search.includes('csv=')) {
              const urlParams = new URLSearchParams(window.location.search);
              const csvParam = urlParams.get('csv');
              csvFileName = csvParam ? csvParam.replace('.csv', '') : 'unknown';
            } else {
              csvFileName = 'unknown';
            }
            
            // Safely parse filename
            const parts = csvFileName.split('_');
            const timeframe = parts[1] || 'M5';
            const sd = parts[2] || '20250101';
            const ed = parts[3] || '20251231';
            
            const sdt = `${sd.slice(0, 4)}/${sd.slice(4, 6)}/${sd.slice(6, 8)}`;
            const edt = `${ed.slice(0, 4)}/${ed.slice(4, 6)}/${ed.slice(6, 8)}`;

          return [
            `\t`,
            `${backtestingDate}\t`,
            `${csvFileName}\t`,
            `${timeframe}\t`,
            `${strategy}\t`,
            `${sdt}\t`,
            `${edt}\t`,
            `${numbDays}\t`,
            `${$sessionStartInput.value}\t`,
            `${$sessionEndInput.value}\t`,
            `${tradeCount}\t`,
            `${winRate}%\t`,
            `${moneyEquivalent.toFixed(2)}\t`,
            `${profitsInPoints}\t`,
            `${lotSize()}\t`,
            `${slSize()}\t`,
            `${tpSize()}\t`,
            `${tsSize()}\t`,
            `${maPeriod()}\t`,
            `${maThreshold()}\t`,
            `${profitFactor}\t`,
            `${commissionSize()}\t`,
          ].join('');
        };

        // Display textual result
        // result += `Check console for orders history\n`;
        // CRITICAL: Use processedDays instead of numbDays (processedDays is incremented in both Fast and Normal mode)
        const months = (processedDays / 30).toFixed(1);
        result += `Trade Taken: ${ordersHistory.length} (in ${processedDays} days / ${months} months)`;
        result += `\nWin Rate (Positive P/L): ${winRatePositive}%`;
        result += `\nWin Rate (TP Hits): ${winRateTP}%\n`;
        result += `\nProfits: `;
        result += `\n Money: ${moneyEquivalent.toFixed(2)}$`;
        // result += `\n Points: ${profitsInPoints.toFixed(5)}`;
        // result += `\n Pips: ${(profitsInPoints / 0.0001).toFixed(2)}`;
        // result += `\n Ticks: ${(profitsInPoints / 0.01).toFixed(2)}`;
        result += `\n Profit Factor: ${profitFactor}`;
        result += `\n Total Wins: ${totalWins}`;
        result += `\n Total Losses: ${totalLosses}`;
        result += `\n Consecutive Wins: ${consecutiveWins}`;
        result += `\n Consecutive Losses: ${consecutiveLosses}`;
        result += `\n Max Drawdown: ${maxDrawdown.toFixed(2)}$`;
        result += `\n Max Updraw: ${maxUpdraw.toFixed(2)}$`;
        result += `\n Lowest Equity: ${lowestEquity.toFixed(2)}$`;
        result += `\n Highest Equity: ${highestEquity.toFixed(2)}$`;

        $backTestingResult.value = result;
        $exportableCSVField.value = resultToCSV();

        // Update Google Sheets button state after setting CSV field value
        updateGoogleSheetsButtonState();

        // Update Profitability Chart ========================================
        /*
          window.existingChart.data.datasets[0].data.pop();
          window.existingChart.data.datasets[1].data.pop();
        */
        // Guard: Ensure we have valid chart data
        if (labels.length > 0 && pnlData.length > 0 && equityDataMoney.length > 0) {
          window.existingChart.data.labels = labels;
          window.existingChart.data.datasets[0].data = pnlData;
          window.existingChart.data.datasets[1].data = equityDataMoney;
          window.existingChart.update('none');
        } else {
          // No valid trade data
          window.existingChart.data.labels = ['No trades generated'];
          window.existingChart.data.datasets[0].data = [0];
          window.existingChart.data.datasets[1].data = [0];
          window.existingChart.update('none');
        }

        // Historical Orders Table with clickable rows for chart navigation
        document.getElementById('backtestingResultOrderHistory').innerHTML = `
    <table>
      <thead>
        <tr class="historical-order-table-header">
          <th>ID</th>
          <th>Size</th>
          <th>Time</th>
          <th>Direction</th>
          <th>Price</th>
          <th>SL</th>
          <th>TP</th>
          <th>Closed Price</th>
          <th title="Closed Order Type">Closed Order Type</th>
          <th>Closed Time</th>
          <th>P/L (Points)</th>
        </tr>
      </thead>
      <tbody>
        ${ordersHistory
          .map(
            (order) => `
          <tr class="historical-order-line clickable-row" data-trade-time="${order.time}" title="Click to navigate to this trade on chart">
            <td>${order.id}</td>
            <td>${(order.lotMultiplier || 1.0).toFixed(1)}</td>
            <td>${order.time}</td>
            <td>${order.direction}</td>
            <td>${order.price.toFixed(5)}</td>
            <td>${order.sl.toFixed(5)}</td>
            <td>${order.tp.toFixed(5)}</td>
            <td>${parseFloat(order.closedPrice).toFixed(5) || ''}</td>
            <td
              title="${order.closedOrderType}"
              class="order-status-${order.closedOrderType}"
            >${
              order.closedOrderType
            }</td>
            <td>${order.closedTime || ''}</td>
            <td class="trade-result-${order.tradeResult}" title="${
              order.tradeResult
            }">${
              order.pnlPoints !== undefined ? order.pnlPoints.toFixed(5) : ''
            }</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;

        // Add click event listeners to table rows for chart navigation
        setTimeout(() => {
          document.querySelectorAll('.clickable-row').forEach(row => {
            row.addEventListener('click', (event) => {
              const tradeTime = event.currentTarget.getAttribute('data-trade-time');
              if (tradeTime && window.sciChartSurface) {
                const unixTime = convertMT5DateToUnix(tradeTime);
                const index = timeToIndex.get(unixTime);
                // Improved zoom: show more candles for better context (25 total instead of 10)
                const candlesToShow = 25; // Total candles to display
                const candlesBefore = Math.floor(candlesToShow / 2); // 12 candles before
                const candlesAfter = candlesToShow - candlesBefore - 1; // 12 candles after
                
                const rangeMinIndex = Math.max(0, index - candlesBefore);
                const rangeMaxIndex = Math.min(chartCandleIndex - 1, index + candlesAfter);
                const xAxis = window.sciChartSurface.xAxes.get(0);
                const yAxis = window.sciChartSurface.yAxes.get(0);

                // Zoom to the trade index with better horizontal range
                xAxis.visibleRange = new NumberRange(rangeMinIndex, rangeMaxIndex);

                // Adjust Y-axis to show price range around the trade
                // Get candles in the visible range to calculate price bounds
                const visibleCandles = candlesFromBuffer.slice(-Math.min(candlesFromBuffer.length, candlesToShow));
                if (visibleCandles.length > 0) {
                  const prices = visibleCandles.flatMap(candle => [
                    candle[EnumMT5OHLC.OPEN],
                    candle[EnumMT5OHLC.HIGH], 
                    candle[EnumMT5OHLC.LOW],
                    candle[EnumMT5OHLC.CLOSE]
                  ]);
                  
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const priceRange = maxPrice - minPrice;
                  
                  // Add 10% padding to the price range for better visibility
                  const padding = priceRange * 0.1;
                  const yMin = minPrice - padding;
                  const yMax = maxPrice + padding;
                  
                  yAxis.visibleRange = new NumberRange(yMin, yMax);
                }
                // Zoom to the trade index
                xAxis.visibleRange = new NumberRange(rangeMinIndex, rangeMaxIndex);

                // Optional: Highlight the clicked row
                document.querySelectorAll('.clickable-row').forEach(r => r.classList.remove('selected-row'));
                event.currentTarget.classList.add('selected-row');
              }
            });
          });
        }, 100); // Small delay to ensure DOM is updated
      };

      window.profitabilityCalculation = profitabilityCalculation;

      // Visualize Results from Fast Mode backtest (without re-running)
      const visualizeBacktestResults = () => {
        if (ordersHistory.length === 0) {
          alert('No backtest results to visualize. Please run a backtest first.');
          return;
        }

        // Calculate and display profitability
        profitabilityCalculation();

        // Ensure chart section is visible
        const chartSection = document.querySelector('.chart-section');
        if (chartSection) {
          chartSection.classList.remove('chart-collapsed');
          chartSection.classList.add('chart-expanded');
        }

        // Scroll to results panel
        const resultPanel = document.getElementById('result-panel');
        if (resultPanel) {
          resultPanel.classList.add('active');
          resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        console.log('✅ Backtest results visualized:', {
          totalOrders: ordersHistory.length,
          closedOrders: ordersHistory.filter(o => o.closed).length,
          wins: ordersHistory.filter(o => o.closed && o.tradeResult === 'WIN').length,
          losses: ordersHistory.filter(o => o.closed && o.tradeResult === 'LOSS').length,
        });
      };

      window.visualizeBacktestResults = visualizeBacktestResults;

      const ohlcDataSeries = new OhlcDataSeries(wasmContext);

      // Create an OHLC series
      const FCRS = new FastCandlestickRenderableSeries(wasmContext, {
        dataSeries: ohlcDataSeries,
        strokeThickness: 1,
      });
      sciChartSurface.renderableSeries.add(FCRS);

      // Start of Window assigned custom scichart functions: ========================
      const addNewCandleToChart = (d) => {
        if (candlesFromBuffer.length >= MAX_BUFFER_SIZE) {
          candlesFromBuffer.shift(); // Remove the oldest element if the buffer is full to save memory
        }
        candlesFromBuffer.push(d);

        const unixTime = convertMT5DateToUnix(`${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`);
        candleTimes.push(unixTime);
        timeToIndex.set(unixTime, chartCandleIndex);

        ohlcDataSeries.append(
          chartCandleIndex,
          d[EnumMT5OHLC.OPEN],
          d[EnumMT5OHLC.HIGH],
          d[EnumMT5OHLC.LOW],
          d[EnumMT5OHLC.CLOSE]
        );
        chartCandleIndex++;
      };
      window.addNewCandleToChart = addNewCandleToChart;

      // Create a vertical line annotation for the first time
      /*const verticalAnnotation = new VerticalLineAnnotation({
            x1: convertMT5DateToUnix("2025-07-10 05:00"),
            stroke: `#0000FF`,
            opacity: 0.4,
            strokeThickness: 3,
          })*/
      //sciChartSurface.annotations.insert(0, verticalAnnotation); // Insert at index 0 to ensure it appears first

      // Create a vertical line annotation for backtesting date time:
      const bttVerticalLineAnnotation = (btt) => {
        const bttLine = new VerticalLineAnnotation({
          labelPlacement: ELabelPlacement.TopRight,
          showLabel: true,
          stroke: '#666666',
          strokeThickness: 2,
          x1: timeToIndex.get(btt),
          axisLabelFill: '#666666',
          axisLabelStroke: '#333',
        });
        sciChartSurface.annotations.add(bttLine);
        animateActiveClass(document.getElementById('ntd-notify'));
      };
      window.bttVerticalLineAnnotation = bttVerticalLineAnnotation;

      // Simple Moving Average Calculations. TODO might be expensive in memory:
      const simpleMA = (vl, period) => {
        let sma = [];

        for (let i = 0; i < vl.length; i++) {
          if (i < period - 1) {
            sma.push(vl[EnumMT5OHLC.CLOSE]); // not enough data yet
          } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
              sum += vl[i - j][EnumMT5OHLC.CLOSE]; // take close directly
            }
            sma.push(sum / period);
          }
        }

        return sma;
      };

      // ATR Indicator: ========================================
      const calcATR = (d, dataIndex) => {
        const ATRLength = 20; // ATR period (number of candles for average calculation)
        const atrMultiplierThreshold = 1.2; // ATR multiplier threshold

        if (dataIndex < ATRLength || !listeningATR || !arrayOfSignals[1])
          return; // Ensure we have enough data for ATR calculation and we are in the trading time range only

        //console.log('candlesFromBuffer:', candlesFromBuffer); // candlesFromBuffer

        // Calculate True Range (TR) for each candle
        const tr = candlesFromBuffer.map((c, i) => {
          if (i === 0) return 0; // No TR for the first candle
          const prevCandle = candlesFromBuffer[i - 1];
          return Math.max(
            c[EnumMT5OHLC.HIGH] - c[EnumMT5OHLC.LOW],
            Math.abs(c[EnumMT5OHLC.HIGH] - prevCandle[EnumMT5OHLC.CLOSE]),
            Math.abs(c[EnumMT5OHLC.LOW] - prevCandle[EnumMT5OHLC.CLOSE])
          );
        });

        const atr = tr.reduce((acc, val) => acc + val, 0) / ATRLength;
        currentATR = atr; // Store for dynamic SL calculation

        // Calculate True Range (TR) for the last candle
        const lastIndex = candlesFromBuffer.length - 1;
        const currCandle = candlesFromBuffer[lastIndex];
        const prevCandle = candlesFromBuffer[lastIndex - 1];

        const currTR = Math.max(
          currCandle[EnumMT5OHLC.HIGH] - currCandle[EnumMT5OHLC.LOW],
          Math.abs(
            currCandle[EnumMT5OHLC.HIGH] - prevCandle[EnumMT5OHLC.CLOSE]
          ),
          Math.abs(currCandle[EnumMT5OHLC.LOW] - prevCandle[EnumMT5OHLC.CLOSE])
        );

        const atrAboveThreshold = currTR > atr * atrMultiplierThreshold;

        // console.log('Listening for ATR:', atr, atrAboveThreshold);
        // console.log('ArrayOfSignals ATR:', arrayOfSignals[2]);

        // As soon we have the first ATR signal we stop listening for it until we take a trade
        if (atrAboveThreshold) {
          // console.log('Stop listening for ATR:', atr, atrAboveThreshold);

          // Create a vertical line annotation for ATR:
          const atrLine = new VerticalLineAnnotation({
            labelPlacement: ELabelPlacement.TopRight,
            showLabel: true,
            stroke: '#FF000022',
            strokeThickness: 2,
            x1: timeToIndex.get(convertMT5DateToUnix(
              `${currCandle[EnumMT5OHLC.DATE]} ${currCandle[EnumMT5OHLC.TIME]}`
            )),
            axisLabelFill: '#FF0000',
            axisLabelStroke: '#333',
          });
          sciChartSurface.annotations.add(atrLine);

          listeningATR = false;
          arrayOfSignals[2] = true;
          return;
        }
      };
      window.calcATR = calcATR;
      // End of ATR Indicator: ========================================

      // TTR Indicator: ========================================
      const inTradingTimeRange = (d) => {
        // Convert MT5 date format (YYYY.MM.DD) to JS format (YYYY-MM-DD)
        const dateFormatted = d[EnumMT5OHLC.DATE].replaceAll('.', '-');
        const startRangeTime = new Date(
          `${dateFormatted} ${$sessionStartInput.value}`
        );
        const endRangeTime = new Date(
          `${dateFormatted} ${$sessionEndInput.value}`
        );
        const currentTime = new Date(
          `${dateFormatted} ${d[EnumMT5OHLC.TIME]}`
        );
        const inTradingTimeRange =
          currentTime >= startRangeTime && currentTime <= endRangeTime;

        // DEBUG: Log TTR checks (comment out after verification)
        // Uncomment to verify trading hours filter is working
        // const time = d[EnumMT5OHLC.TIME];
        // if (time && (time.includes('09:50') || time.includes('11:00') || time.includes('11:05'))) {
        //   console.log(`TTR Check @ ${time}: ${inTradingTimeRange} (range: ${$sessionStartInput.value}-${$sessionEndInput.value})`);
        // }

        arrayOfSignals[1] = inTradingTimeRange;
      };
      window.inTradingTimeRange = inTradingTimeRange;
      // End of TTR Indicator: ========================================

      // CSID Indicator: ========================================
      const CSIDDataSerieFromHighs = new XyDataSeries(wasmContext);
      const CSIDDataSerieFromLows = new XyDataSeries(wasmContext);
      const maDataSeries = new XyDataSeries(wasmContext);

      const CSIDHighline = new FastLineRenderableSeries(wasmContext, {
        stroke: '#FFF',
        strokeThickness: 2,
        dataSeries: CSIDDataSerieFromHighs,
        opacity: 0.5,
      });
      const CSIDLowline = new FastLineRenderableSeries(wasmContext, {
        stroke: '#FFF',
        strokeThickness: 2,
        dataSeries: CSIDDataSerieFromLows,
        opacity: 0.5,
      });
      
      class SlopePaletteProvider {
        constructor() {
          this.upColor = `#${bullishColor}`;
          this.downColor = `#${bearishColor}`;
          this.parentSeries = null;
        }

        onAttached(parentSeries) {
          this.parentSeries = parentSeries;
        }

        onDetached() {
          this.parentSeries = null;
        }

        overrideStrokeArgb(xValue, yValue, index) {
          if (!this.parentSeries || index === 0) return undefined;

          // Get Y values from the series
          const yValues = this.parentSeries.dataSeries.getNativeYValues();
          const prevY = yValues.get(index - 1);
          const slope = yValue - prevY;

          const color = slope >= 0 ? this.upColor : this.downColor;
          return parseInt("FF" + color.slice(1), 16); // hex → ARGB
        }
      }

      const maLine = new FastLineRenderableSeries(wasmContext, {
        stroke: `#${bearishColor}`,
        strokeThickness: 2,
        dataSeries: maDataSeries,
        opacity: 0.8,
        paletteProvider: new SlopePaletteProvider()
      });

      sciChartSurface.renderableSeries.add(CSIDHighline);
      sciChartSurface.renderableSeries.add(CSIDLowline);
      sciChartSurface.renderableSeries.add(maLine);

      const updateCSIDLineAnnotation = (d, dataIndex) => {
        const index = dataIndex || 0;

        // NOTE: Trade execution (executePendingTrade) is now handled in the main backtest loop
        // This ensures entries happen on next candle's OPEN, not current candle's close
        // arrayOfSignals[0] is no longer used for trade execution timing

        if (index < lookbackPeriod) return; // Ensure we have enough data for CSID calculation

        // store lookback candles:
        CSIDLookbackCandleSerie.push(d);

        // Calculate highest high and lowest low in the lookback period except the current candle:
        const highPrices = CSIDLookbackCandleSerie.slice(
          CSIDLookbackCandleSerie.length - 1 - lookbackPeriod
        ).map((candle) =>
          getCandleDirectionFromCandle(candle) == EnumDirection.BULL
            ? candle[EnumMT5OHLC.CLOSE]
            : candle[EnumMT5OHLC.OPEN]
        );
        highestHighLong.push(Math.max(...highPrices));

        const lowPrices = CSIDLookbackCandleSerie.slice(
          CSIDLookbackCandleSerie.length - 1 - lookbackPeriod
        ).map((candle) =>
          getCandleDirectionFromCandle(candle) == EnumDirection.BULL
            ? candle[EnumMT5OHLC.OPEN]
            : candle[EnumMT5OHLC.CLOSE]
        );
        lowestLowShort.push(Math.min(...lowPrices));

        /*
          // Calculate slope:
          const slopeHighestHighLong =
            (highestHighLong[highestHighLong.length - 1] - highestHighLong[0]) /
            lookbackPeriod;
          const slopeLowestLowShort =
            (lowestLowShort[lowestLowShort.length - 1] - lowestLowShort[0]) /
            lookbackPeriod;
        */

        /*
          // Flat line detection, mostly for UI styling:
            flatThreshold = 0.00001 // Adjust this value depending on how flat the line is
            isFlatHigh = Math.abs(highestHighLong - highestHighLong[1]) < flatThreshold
            isFlatLow = Math.abs(lowestLowShort - lowestLowShort[1]) < flatThreshold

            if (isFlatHigh || isFlatLow) {
              debugger
            }
        */

        // Check for CSID breakout conditions (breakout of the highest high or lowest low && slope is less than threshold (consistency))
        const bullishCSID =
          d[EnumMT5OHLC.CLOSE] > highestHighLong[highestHighLong.length - 2]; // && Math.abs(slopeHighestHighLong) < slopeThreshold
        const bearishCSID =
          d[EnumMT5OHLC.CLOSE] < lowestLowShort[lowestLowShort.length - 2]; // && Math.abs(slopeLowestLowShort) < slopeThreshold
        
        // Check if MA is trending in direction of planned trade, otherwise it will be always null (TODO check chatGPT)
        if (CSIDLookbackCandleSerie.length < lookbackPeriod) return; // Ensure we have enough at least 2 candles for MA acceleration calculation

        const maLookBackAccelToEnumDirection = (value, threshold = maThreshold()) => {
          if (value > threshold) return EnumDirection.BEAR;
          if (value < -threshold) return EnumDirection.BULL;
          return null;
        }

        const maCandlesLookback = CSIDLookbackCandleSerie.slice(
          CSIDLookbackCandleSerie.length - lookbackPeriod, CSIDLookbackCandleSerie.length
        );
        const maCandlesLookbackValues = maCandlesLookback.map((candle) => candle[EnumMT5OHLC.CLOSE]); // TODO we might match the MA line (not sure if i use close, open or calculate middle of candle for MALine)
        const maCandlesLookbackDiff = maCandlesLookbackValues[maCandlesLookbackValues.length - lookbackPeriod] - maCandlesLookbackValues[maCandlesLookbackValues.length - 1];
        const maTrending = maLookBackAccelToEnumDirection(maCandlesLookbackDiff)
        
        // Compute MA acceleration and set signal flag:
        const maArray = simpleMA(CSIDLookbackCandleSerie, MA_PERIOD);
        const accel = computeMAAccel(maArray);
        arrayOfSignals[EnumArrayOfSignalsIndex.MADirection] = Math.abs(accel) > ACCEL_THRESHOLD;

        // CSID Graph Related Annotations: ========================================
        // Skip chart rendering in Fast Mode - only append to chart if NOT in fast mode
        const isFastMode = $fastBacktestMode?.checked;
        if (!isFastMode) {
          // Add a new CSID Data for our line annotations:
          const currentUnixTime = convertMT5DateToUnix(d[EnumMT5OHLC.DATE] + ' ' + d[EnumMT5OHLC.TIME]);
          const xIndex = timeToIndex.get(currentUnixTime);

          // Guard: Only append valid data (not NaN, Infinity, or undefined)
          if (xIndex !== undefined && highestHighLong.length > 0) {
            const highValue = highestHighLong[highestHighLong.length - 1];
            if (Number.isFinite(highValue)) {
              CSIDDataSerieFromHighs.append(xIndex, highValue);
            }
          }

          if (xIndex !== undefined && lowestLowShort.length > 0) {
            const lowValue = lowestLowShort[lowestLowShort.length - 1];
            if (Number.isFinite(lowValue)) {
              CSIDDataSerieFromLows.append(xIndex, lowValue);
            }
          }

          if (xIndex !== undefined && CSIDLookbackCandleSerie.length > 0) {
            const maValues = simpleMA(CSIDLookbackCandleSerie, maPeriod());
            const maValue = maValues[maValues.length - 1];
            if (Number.isFinite(maValue)) {
              maDataSeries.append(xIndex, maValue);
            }
          }
        }

        // If previous candle was a breakout candle, we will not draw this new annotation,
        // I m gonna use a cooldown system rather than checking and modifying CSIDLookbackCandleSerie, for code simplicity (for now):
        if (CSIDSignalTriggered) {
          CSIDCoolddownSignal--;
          if (CSIDCoolddownSignal > 0) {
            return; // Skip drawing the annotation if we are in cooldown period
          } else {
            CSIDSignalTriggered = false; // Reset the cooldown signal
            CSIDCoolddownSignal = 5; // Reset the cooldown signal to 5 candles
          }
        }

        // MOMENTUM CONFIRMATION: Only take signals with MA momentum accelerating in trade direction
        const momentumAligned = (bullishCSID && accel > 0) || (bearishCSID && accel < 0);
        const momentumAggressive = (bullishCSID && accel > ACCEL_THRESHOLD) || (bearishCSID && accel < -ACCEL_THRESHOLD);

        // INSTITUTIONAL CANDLE CONFIRMATION: Check for candles 3x larger than average volatility
        // This adapts dynamically to market conditions like ATR
        const avgCandleBody = CSIDLookbackCandleSerie.reduce((sum, candle) => {
          const body = Math.abs(parseFloat(candle[EnumMT5OHLC.CLOSE]) - parseFloat(candle[EnumMT5OHLC.OPEN]));
          return sum + body;
        }, 0) / Math.max(CSIDLookbackCandleSerie.length, 1);

        const institutionalMultiplier = parseFloat($InstitutionalMultiplierInput?.value || 3.0);

        // If multiplier is 0, disable the institutional candle filter (always pass)
        let hasInstitutionalCandleInTTR;
        if (institutionalMultiplier === 0) {
          hasInstitutionalCandleInTTR = true; // Disabled - all signals pass
        } else {
          const institutionalThreshold = avgCandleBody * institutionalMultiplier; // Dynamic multiplier = institutional move

          hasInstitutionalCandleInTTR = CSIDLookbackCandleSerie.some(candle => {
            const candleTime = candle[EnumMT5OHLC.TIME];
            const [hour, minute] = candleTime.split(':').map(Number);
            const candleMinutes = hour * 60 + minute;

            const [startHour, startMin] = $sessionStartInput.value.split(':').map(Number);
            const [endHour, endMin] = $sessionEndInput.value.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            // Check if candle is within TTR
            const isInTTR = candleMinutes >= startMinutes && candleMinutes <= endMinutes;

            // Check if candle has institutional body (ATR-style dynamic threshold)
            const candleBody = Math.abs(parseFloat(candle[EnumMT5OHLC.CLOSE]) - parseFloat(candle[EnumMT5OHLC.OPEN]));
            const isInstitutional = candleBody >= institutionalThreshold;

            return isInTTR && isInstitutional;
          });
        }

        // ===== ENTRY ZONE SIGNAL: Enter BEFORE breakout, not after =====
        // NEW LOGIC: Check which breakout level price is approaching + validate with momentum
        const entryZoneDistance = parseFloat($EntryZoneDistanceInput?.value || 0.0050);
        const currentPrice = parseFloat(d[EnumMT5OHLC.CLOSE]);
        let entryZoneSignalTriggered = false;
        let entryZoneDirection = null;
        let distanceToBreakout = 0;

        // Calculate distances to BOTH breakout levels
        let bullDistance = null;
        let bearDistance = null;

        if (highestHighLong.length > 1) {
          const bullBreakoutLevel = highestHighLong[highestHighLong.length - 2];
          bullDistance = bullBreakoutLevel - currentPrice; // How far below highest high
        }

        if (lowestLowShort.length > 1) {
          const bearBreakoutLevel = lowestLowShort[lowestLowShort.length - 2];
          bearDistance = currentPrice - bearBreakoutLevel; // How far above lowest low
        }

        // Determine which direction is valid: must be within zone AND price moving in that direction
        // Get previous candle close for direction check
        const prevCandle = CSIDLookbackCandleSerie.length > 1
          ? CSIDLookbackCandleSerie[CSIDLookbackCandleSerie.length - 2]
          : null;
        const prevClose = prevCandle ? parseFloat(prevCandle[EnumMT5OHLC.CLOSE]) : currentPrice;
        const priceMovement = currentPrice - prevClose; // Positive = up, negative = down

        // BULL: price within zone of highest high AND price is moving UP
        if (bullDistance !== null && bullDistance > 0 && bullDistance <= entryZoneDistance && priceMovement >= 0) {
          // Price is approaching highest high from below = BULL signal
          entryZoneSignalTriggered = true;
          entryZoneDirection = EnumDirection.BULL;
          distanceToBreakout = bullDistance;
          console.log(`[ENTRY ZONE ${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}] ✓ BULL SIGNAL: distance=${bullDistance.toFixed(6)}, accel=${accel.toFixed(6)}, priceMovement=${priceMovement.toFixed(6)}`);
        }
        // BEAR: price within zone of lowest low AND price is moving DOWN
        else if (bearDistance !== null && bearDistance > 0 && bearDistance <= entryZoneDistance && priceMovement <= 0) {
          // Price is approaching lowest low from above = BEAR signal
          entryZoneSignalTriggered = true;
          entryZoneDirection = EnumDirection.BEAR;
          distanceToBreakout = bearDistance;
          console.log(`[ENTRY ZONE ${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}] ✓ BEAR SIGNAL: distance=${bearDistance.toFixed(6)}, accel=${accel.toFixed(6)}, priceMovement=${priceMovement.toFixed(6)}`);
        }

        // Calculate lot multiplier based on TWO factors:
        // 1. MOMENTUM ALIGNMENT: accel direction matches trade direction
        // 2. DISTANCE TO BREAKOUT: how close price is to actual breakout
        let csidBreakoutLotMultiplier = 1.0;
        if (entryZoneSignalTriggered) {
          // 1. Momentum-based multiplier
          const momentumAligned = (entryZoneDirection === EnumDirection.BULL && accel > 0) ||
                                  (entryZoneDirection === EnumDirection.BEAR && accel < 0);
          const momentumMultiplier = momentumAligned ? 1.0 : 0.5; // Aligned = 1.0, Against = 0.5

          // 2. Distance-based multiplier
          const midpoint = entryZoneDistance * 0.5;
          const distanceMultiplier = distanceToBreakout < midpoint ? 0.5 : 1.0; // Close = 0.5, Far = 1.0

          // Final lot = momentum confidence × distance confidence
          csidBreakoutLotMultiplier = momentumMultiplier * distanceMultiplier;

          const distanceInPips = distanceToBreakout / 0.0001; // EURUSD: 1 pip = 0.0001
          console.log(`[LOT SIZING] Momentum: ${momentumAligned ? 'ALIGNED' : 'AGAINST'} (${momentumMultiplier.toFixed(1)}x) | Distance: ${distanceToBreakout < midpoint ? 'CLOSE' : 'FAR'} (${distanceMultiplier.toFixed(1)}x) | Final: ${csidBreakoutLotMultiplier.toFixed(2)}x | Distance: ${distanceInPips.toFixed(1)} pips`);
        }

        if (entryZoneSignalTriggered && arrayOfSignals[EnumArrayOfSignalsIndex.TTR] && hasInstitutionalCandleInTTR) {
          // CRITICAL: Only process signal if within trading hours AND institutional candle confirms
          // NEW: Don't wait for CSID breakout - enter when approaching with all confirmations

          const direction = entryZoneDirection;
          const momentumQuality = momentumAggressive ? 'AGGRESSIVE' : 'ALIGNED';
          console.log(`[ENTRY ZONE SIGNAL] ${direction} | Distance to breakout: ${(distanceToBreakout * 100000).toFixed(0)} pips | ${momentumQuality} MA + Institutional activity in TTR | Lot Multiplier: ${csidBreakoutLotMultiplier}`);

          // ===== SMART EDGE FILTERS (MINIMAL - MAXIMUM FLEXIBILITY) =====
          // Only hard reject on extreme market crisis, accept everything else

          // ONLY HARD STOP: Skip after many consecutive losses (market in crisis)
          const consecutiveLosses = ordersHistory.filter(o => o.closed && o.tradeResult === 'LOSS').slice(-10).length;
          if (consecutiveLosses > 10) {
            console.log(`[SIGNAL REJECTED - CRISIS] ${consecutiveLosses} consecutive losses - extreme market crisis - SKIP`);
            return;
          }

          // Calculate confidence score for adaptive lot sizing
          const regime = detectMarketRegime(CSIDLookbackCandleSerie, 20);
          const confidence = calculateSignalConfidence(
            CSIDLookbackCandleSerie,
            direction === EnumDirection.BULL ? 'BULL' : 'BEAR',
            consecutiveLosses
          );

          // ===== SIGNAL ACCEPTED (ENTER BEFORE BREAKOUT) =====
          CSIDSignalTriggered = true;

          // CRITICAL: Store pending trade for NEXT candle execution
          // Entry on NEXT candle ensures we catch the breakout move
          const detectionTime = `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`;
          pendingTrade = { direction, confidence, detectedTime: detectionTime, csidBreakoutLotMultiplier };
          lastSignalConfidence = confidence;
          tradeCount = 0; // Reset trade count for this new signal wave
          console.log(`[SIGNAL ACCEPTED] ${direction === EnumDirection.BULL ? 'BULLISH' : 'BEARISH'} Entry Zone | Confidence: ${confidence.toFixed(2)}x | Regime: ${regime} | Price ${(distanceToBreakout * 100000).toFixed(0)} pips before breakout | Entry on NEXT candle`);

          // Signal detected - actual entry annotation will be drawn on the entry candle in executePendingTrade()
          // No need to draw annotation here since entry happens on next candle anyway
        }
        // End of CSID Graph Related Annotations ========================================
      };
      window.updateCSIDLineAnnotation = updateCSIDLineAnnotation;
      // End of CSID Indicator: ========================================

      const reinitializeChart = () => {
        // Clear the select element:
        $navigateTroughtDates.innerHTML = '';
        sciChartSurface.annotations.clear();
        //sciChartSurface.renderableSeries.clear() // Clear the series, like chart and indicators
        sciChartSurface.renderableSeries.remove(CSIDHighline);
        sciChartSurface.renderableSeries.remove(CSIDLowline);
        //console.log('RS: Chart cleared');
        initSciChart();
        //initializeCSIDIndicator();
      };
      window.reinitializeChart = reinitializeChart;

      // Add CursorModifier for crosshair
      sciChartSurface.chartModifiers.add(
        new CursorModifier({
          // Optional properties to configure what parts are shown
          // showTooltip: true,
          showAxisLabels: true,
          showXLine: true,
          showYLine: true,
          // How close to a datapoint to show the tooltip? 10 = 10 pixels. 0 means always
          // hitTestRadius: 10,
          // Optional properties to configure the axis labels
          axisLabelFill: '#555',
          axisLabelStroke: '#ccc',
          // Optional properties to configure line and tooltip style
          crosshairStroke: '#555',
          crosshairStrokeThickness: 1,
          tooltipContainerBackground: '#000',
          // tooltipTextStroke: "#ff6600",
        }),
        new MouseWheelZoomModifier(),
        new ZoomPanModifier(),
        new ZoomExtentsModifier(),
        new YAxisDragModifier({ dragMode: EDragMode.Scaling }),
        new XAxisDragModifier({ dragMode: EDragMode.Scaling })
      );

      // Navigate Trought Dates: ========================================
      $navigateTroughtDates.addEventListener('change', (event) => {
        const selectedIndex = parseInt(event.target.value);
        const rangeMinIndex = selectedIndex - 5; // Show 5 candles before
        const rangeMaxIndex = selectedIndex + 5; // Show 5 candles after
        const xAxis = sciChartSurface.xAxes.get(0);

        // Graph Zooming:
        xAxis.visibleRange = new NumberRange(rangeMinIndex, rangeMaxIndex);
      });
      // End of Navigate Trought Dates ========================================
    })
    .catch((error) => {
      console.error('Error initializing SciChart:', error);
    });
};
initSciChart();

const animateActiveClass = (element) => {
  audioNotify.play();
  element.classList.add('active');
  setTimeout(() => {
    element.classList.remove('active');
  }, 3000);
};

const updateFileReadingProgression = (valueInPercentage) => {
  const progressionBar = document.querySelector(
    '#fileReadingProgression .progression'
  );
  progressionBar.style.width = `${valueInPercentage}%`;
};
window.updateFileReadingProgression = updateFileReadingProgression;

const updateDynamicInfos = (d) => {
  const isFastMode = $fastBacktestMode?.checked;

  if (prevDate !== d[EnumMT5OHLC.DATE]) {
    if (!isFastMode) {
      console.log(d[EnumMT5OHLC.DATE]);
    }
    processedDays++;

    if (!isFastMode) {
      $currentReadingDate.innerText = d[EnumMT5OHLC.DATE];
      animateActiveClass($currentReadingDate);
    }

    // Update loading text with current date for progress visibility
    const loadingTextEl = document.querySelector('.loading-text');
    if (loadingTextEl) {
      loadingTextEl.textContent = `Running backtest... ${d[EnumMT5OHLC.DATE]}`;
    }

    prevDate = d[EnumMT5OHLC.DATE];
  }

  // Update progression bar only every 100 candles in fast mode, every time in normal mode
  if (totalCandles > 0) {
    const shouldUpdateProgress = isFastMode ? (processedCandles % 100 === 0) : true;
    if (shouldUpdateProgress) {
      updateFileReadingProgression((processedCandles * 100) / totalCandles);
    }
  }
};

const appendDataToChart = (d) => {
  //$csvDataField.value += JSON.stringify(d);
  addNewCandleToChart(d);
};

const addBacktestingDateTimeToChart = (d) => {
  // Backtesting dates ====================================
  let candleDateTime = `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`; // excepted format: "1970.01.01 00:00:00"
  let unixTime = convertMT5DateToUnix(candleDateTime); // format: 1624982400 for 2021-06-29 00:00:00
  let candleTime = candleDateTime.split(' ')[1]; // get the time from the date string (00:00:00)
  let backTestTime = getCandleChartAxisLocationFromDate(candleDateTime); // + 3600; // Actually the same as above (candleDateTimeStamp)

  // NOTE: Day counting is now handled in updateDynamicInfos() which increments processedDays
  // This works in both Fast Mode and Normal Mode

  var selectedTime = document.getElementById('backtesting-hour').value;

  if (candleTime == selectedTime) {
    let btt = backTestTime; // * 1000;
    //let formatedDate = formatDateFromUnix(btt);

    bttVerticalLineAnnotation(btt);
    // Display Backtesting dates on the select element:
    $navigateTroughtDates.innerHTML += `<option value="${timeToIndex.get(unixTime)}">${candleDateTime}</option>`;
  }
  // End of Backtesting dates ====================================
};

const CSIDIndicator = (d, dataIndex) => {
  updateCSIDLineAnnotation(d, dataIndex);
};

// CRITICAL: Indicator calculations only (no chart rendering)
// This MUST run in both normal and Fast Mode to generate trade signals
const calculateIndicators = (d, dataIndex) => {
  // Populate candlesFromBuffer needed by calcATR (usually done in addNewCandleToChart)
  if (candlesFromBuffer.length >= MAX_BUFFER_SIZE) {
    candlesFromBuffer.shift(); // Remove oldest if buffer full
  }
  candlesFromBuffer.push(d);

  // NOTE: timeToIndex is now populated BEFORE calculateIndicators is called
  // This ensures signal markers are positioned correctly on the chart

  // CRITICAL: Check trading time range BEFORE updating CSID signals
  // This ensures TTR signal is fresh for the current candle, not stale from previous
  inTradingTimeRange(d);

  // Update CSID signals and MA direction (required for trade logic)
  // Now checks the current candle's TTR value (just calculated above)
  updateCSIDLineAnnotation(d, dataIndex);

  // Calculate ATR signal (required for trade logic)
  calcATR(d, dataIndex);
};

const appendIndicatorsToChart = (d, dataIndex) => {
  // Chart rendering only - calculations are now in calculateIndicators()
  // This function is skipped in Fast Mode to improve performance
  CSIDIndicator(d, dataIndex);
  inTradingTimeRange(d);
  calcATR(d, dataIndex);
};

$textareaHistoricalTradesLines?.addEventListener('change', (event) => {
  const tradesData = event.target.value;
  const rows = tradesData.split('\n');

  // Clear previous chart data
  chartData = [];

  // Parse trades data
  rows.forEach((row) => {
    if (row.trim()) {
      // Split by tab for myfxbook format
      const trade = row.split('\t');

      // Validate trade data
      if (trade.length >= 10) {
        const tradeObj = {
          timestamp: trade[0] ? trade[0].trim() : '',
          // Assuming the format is: Date Time, Symbol, Type, Lot Size, Open Price, -, Close Price, -, Profit, ...
          symbol: trade[2] ? trade[2].trim() : '',
          type: trade[3] ? trade[3].trim() : '',
          lotSize: trade[4] ? parseFloat(trade[4].trim()) : 0,
          openPrice: trade[5] ? parseFloat(trade[5].trim()) : 0,
          closePrice: trade[7] ? parseFloat(trade[7].trim()) : 0,
          profit: trade[9] ? parseFloat(trade[9].trim()) : 0,
        };

        // Add trade to chart data
        chartData.push(tradeObj);
      } else {
        console.warn('Invalid trade data:', row);
      }
    }
  });

  // Attempt to update chart if possible
  try {
    // Check for custom chart update function
    if (typeof updateChartWithTrades === 'function') {
      updateChartWithTrades(chartData);
    }
    // Fallback to global chart update methods
    else if (window.updateChart) {
      window.updateChart(chartData);
    }
    // If no update method, log warning
    else {
      console.warn('No chart update method available');
    }
  } catch (error) {
    console.error('Error updating chart:', error);
  }
});

// Google Sheets Export Logic
// TODO: Find the Web App URL from your deployed Google Apps Script and paste it below:
const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDEObfonrbxUde5-43OeqploBFxI8eIqrjfxLpj9WJlDq-f5lzrzjFVK5qB-3nwX0e/exec'; 

const sendToGoogleSheets = async () => {
  const url = GOOGLE_SHEET_WEB_APP_URL;
  
  const csvContent = document.getElementById('exportableCSVField').value;
  if (!csvContent) {
    alert('No results to export. Please run a backtest first.');
    return;
  }

  const dataRow = csvContent.split('\t').map(s => s.trim());
  
  const btn = document.getElementById('googleSendToSheetsBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  btn.disabled = true;

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow', // ADD THIS LINE - allows following the 302 redirect
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataRow),
    });

    const result = await response.text();
    
    try {
      const jsonResult = JSON.parse(result);
      if (jsonResult.result === 'success') {
        alert('✅ Export successful! Row ' + jsonResult.row + ' added to Google Sheets.');
      } else {
        alert('⚠️ ' + (jsonResult.error || 'Unknown error occurred'));
      }
    } catch (e) {
      alert('Export sent! Server response: ' + result);
    }

  } catch (error) {
    console.error('Export failed:', error);
    alert('❌ Export failed: ' + error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};

$googleSendToSheetsBtn.addEventListener('click', sendToGoogleSheets);

// Continuously update button state when CSV field content changes
$exportableCSVField.addEventListener('input', updateGoogleSheetsButtonState);

// ==================== OPTIMIZED BACKTEST & PARAMETER COMPARISON ====================

// Get current parameters from inputs
const getCurrentParams = () => ({
  strategy: $strategyInput?.value || 'CSID_W_MA_DynamicTS',
  preset: getMultiPositionConfig().presetName,
  sessionStart: $sessionStartInput?.value || '09:50:00',
  sessionEnd: $sessionEndInput?.value || '11:00:00',
  slSize: parseFloat($SLPointsInput?.value) || 0.0001,
  tpSize: parseFloat($TPPointsInput?.value) || 0.0003,
  lotSize: parseFloat($LotSizeInput?.value) || 1.0,
  commissionSize: parseFloat($CommissionSizeInput?.value) || 0.00005,
  tsSize: parseFloat($TSIncrementInput?.value) || 0.0001,
  maPeriod: parseFloat($MAPeriodInput?.value) || 200,
  maThreshold: parseFloat($MAThresholdInput?.value) || 0.003,
  monthlyMaxLossPercent: parseFloat(document.getElementById('MonthlyMaxLoss')?.value) || 5,
});

// Load parameters and run backtest (with chart)
const loadParamsAndRun = (params) => {
  // Clean up trailing stop series from previous backtest
  if (window.sciChartSurface && trailingStopSeriesMap.size > 0) {
    trailingStopSeriesMap.forEach((series, orderId) => {
      try {
        if (series && window.sciChartSurface.renderableSeries.contains(series)) {
          window.sciChartSurface.renderableSeries.remove(series);
        }
      } catch (e) {
        // Silently skip cleanup errors
      }
    });
    trailingStopSeriesMap.clear();
    console.log('Cleaned up trailing stop series');
  }
  
  // Set values to inputs
  if ($strategyInput) $strategyInput.value = params.strategy;
  const presetDropdown = document.getElementById('multiPositionPreset');
  if (presetDropdown && params.preset) presetDropdown.value = params.preset;
  if ($sessionStartInput) $sessionStartInput.value = params.sessionStart;
  if ($sessionEndInput) $sessionEndInput.value = params.sessionEnd;
  if ($SLPointsInput) $SLPointsInput.value = params.slSize;
  if ($TPPointsInput) $TPPointsInput.value = params.tpSize;
  if ($LotSizeInput) $LotSizeInput.value = params.lotSize;
  if ($CommissionSizeInput) $CommissionSizeInput.value = params.commissionSize;
  if ($TSIncrementInput) $TSIncrementInput.value = params.tsSize;
  if ($MAPeriodInput) $MAPeriodInput.value = params.maPeriod;
  if ($MAThresholdInput) $MAThresholdInput.value = params.maThreshold;
  
  if (!cachedFile && cachedCSVData.length === 0) {
    alert('Please load a CSV file first!');
    return;
  }
  
  // Collapse result panel to show chart
  const resultPanel = document.getElementById('result-panel');
  if (resultPanel) resultPanel.classList.remove('active');
  
  // If we have cached data from URL load (no file object), create a blob and run chart
  if (!cachedFile && cachedCSVData.length > 0) {
    // Convert cached data back to CSV string
    const headers = Object.keys(cachedCSVData[0]);
    const csvRows = cachedCSVData.map(row => headers.map(h => row[h]).join('\t'));
    const csvString = [headers.join('\t'), ...csvRows].join('\n');
    
    // Create a blob and treat as file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const mockFile = new File([blob], 'cached.csv', { type: 'text/csv' });
    
    // Use the existing file handling
    handleFileAndInitGraph(mockFile);
    return;
  }
  
  // Run the full backtest with chart - reuse the file that was uploaded
  handleFileAndInitGraph(cachedFile);
};

// Load CSV and cache it
const loadAndCacheCSV = (file) => new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        cachedCSVData = results.data.filter(row => row[EnumMT5OHLC.OPEN]);
        cachedFile = file;
        cachedFileInfo = {
          name: file.name,
          firstDate: cachedCSVData[0]?.[EnumMT5OHLC.DATE],
          lastDate: cachedCSVData[cachedCSVData.length - 1]?.[EnumMT5OHLC.DATE],
          totalCandles: cachedCSVData.length,
        };
        $firstDate.textContent = cachedFileInfo.firstDate;
        $lastDate.textContent = cachedFileInfo.lastDate;
        resolve(cachedCSVData);
      },
      error: reject,
    });
  });

// Run optimized backtest (no chart rendering)

// Monte Carlo simulation for equity curves
const runMonteCarloSimulation = (orders, params, numSimulations = 50) => {
  const closedTrades = orders.filter(o => o.closed && o.pnlPoints !== undefined);
  if (closedTrades.length < 5) return null;
  
  const tradeReturns = closedTrades.map(t => (t.pnlPoints - params.commissionSize) * 100000 * params.lotSize);
  const simulations = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const equityCurve = [0];
    let equity = 0;
    
    // Randomly resample trades with replacement
    for (let i = 0; i < closedTrades.length; i++) {
      const randomTrade = tradeReturns[Math.floor(Math.random() * tradeReturns.length)];
      equity += randomTrade;
      equityCurve.push(equity);
    }
    simulations.push(equityCurve);
  }
  
  // Calculate statistics
  const finalEquities = simulations.map(s => s[s.length - 1]);
  finalEquities.sort((a, b) => a - b);
  
  const median = finalEquities[Math.floor(finalEquities.length / 2)];
  const p10 = finalEquities[Math.floor(finalEquities.length * 0.1)];
  const p90 = finalEquities[Math.floor(finalEquities.length * 0.9)];
  const best = finalEquities[finalEquities.length - 1];
  const worst = finalEquities[0];
  
  return {
    simulations,
    median,
    p10,
    p90,
    best,
    worst,
    finalEquities,
  };
};

// Render comparison results chart (equity curves for all saved results)
const renderComparisonChart = () => {
  const canvas = document.getElementById('monteCarloChart');
  if (!canvas) return;
  
  if (backtestResults.length === 0) {
    document.getElementById('monteCarloStats').innerHTML = '<p style="color: #666;">Run some backtests to see comparison.</p>';
    return;
  }
  
  // Destroy existing chart if any
  if (window.monteCarloChartInstance) {
    window.monteCarloChartInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Get equity curves from each result
  const resultsWithEquity = backtestResults.map((r, idx) => {
    const equityCurve = [0];
    let equity = 0;
    const commission = r.params.commissionSize || 0.00005;
    
    r.orders.filter(o => o.closed).forEach(order => {
      const tradeMoney = (order.pnlPoints - commission) * 100000 * r.params.lotSize;
      equity += tradeMoney;
      equityCurve.push(equity);
    });
    
    return {
      name: r.params.name || `Run ${idx + 1}`,
      equity: equityCurve,
      money: parseFloat(r.moneyEquivalent),
      winRate: parseFloat(r.winRate),
    };
  }).filter(r => r.equity.length > 1);
  
  // Sort by final profit
  resultsWithEquity.sort((a, b) => b.money - a.money);
  
  const maxLength = Math.max(...resultsWithEquity.map(r => r.equity.length));
  const labels = Array.from({ length: maxLength }, (_, i) => i);
  
  // Color gradient from best (green) to worst (red)
  const colors = resultsWithEquity.map((r, i, arr) => {
    const ratio = i / Math.max(arr.length - 1, 1);
    const rVal = Math.round(255 * ratio);
    const gVal = Math.round(255 * (1 - ratio));
    return `rgba(${rVal}, ${gVal}, 0, 0.7)`;
  });
  
  const datasets = resultsWithEquity.map((r, idx) => ({
    label: r.name,
    data: r.equity,
    borderColor: colors[idx],
    borderWidth: idx === 0 ? 2 : 1,
    fill: false,
    pointRadius: 0,
    tension: 0.1,
  }));
  
  window.monteCarloChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: false,
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#aaa',
            font: { size: 11, weight: 'normal' },
            boxWidth: 15,
            padding: 15,
            usePointStyle: false,
          },
          align: 'center'
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#ddd',
          borderColor: '#555',
          borderWidth: 1,
          padding: 8,
          font: { size: 10 }
        },
      },
      scales: {
        x: {
          display: false,
          grid: { display: false }
        },
        y: {
          ticks: {
            color: '#888',
            font: { size: 10 },
            stepSize: 'auto',
            callback: function(value) {
              return '$' + Math.round(value);
            }
          },
          grid: {
            color: 'rgba(100, 100, 100, 0.2)',
            drawBorder: false,
          },
          beginAtZero: true,
        },
      },
    },
  });
  
  // Update stats
  const best = resultsWithEquity[0];
  const worst = resultsWithEquity[resultsWithEquity.length - 1];
  document.getElementById('monteCarloStats').innerHTML = `
    <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 12px; padding: 10px 0; border-top: 1px solid #333;">
      ${best && worst ? `
        <div>
          <span style="color: #888;">Best Run:</span>
          <span style="color: #6f6; font-weight: 500; margin-left: 8px;">${best.name} ($${best.money.toFixed(0)})</span>
        </div>
        <div>
          <span style="color: #888;">Worst Run:</span>
          <span style="color: #f77; font-weight: 500; margin-left: 8px;">${worst.name} ($${worst.money.toFixed(0)})</span>
        </div>
      ` : '<span style="color: #666;">No equity curves to compare</span>'}
      <div style="margin-left: auto;">
        <span style="color: #888;">Total Runs:</span>
        <span style="color: #aaa; font-weight: 500; margin-left: 8px;">${resultsWithEquity.length}</span>
      </div>
    </div>
  `;
};

// Display backtest result
const displayBacktestResult = (result) => {
  ordersHistory = result.orders;
  window.ordersHistory = ordersHistory;
  
  // Update result text
  let text = `Trade Taken: ${result.totalTrades} (in ${result.tradeCount} signals)`;
  text += `\nWin Rate: ${result.winRate}%`;
  text += `\nProfits: `;
  text += `\n Money: ${result.moneyEquivalent}$`;
  text += `\n Profit Factor: ${result.profitFactor}`;
  text += `\n Max Drawdown: ${result.maxDrawdown}$`;
  
  $backTestingResult.value = text;
  
  // Auto-generate MQL from the backtest parameters
  const mqlText = generateMQLFromParams(result.params);
  const textarea = document.getElementById('algoEditorTextareaMain1');
  if (textarea) textarea.value = mqlText;
  
  // Update order history table
  document.getElementById('backtestingResultOrderHistory').innerHTML = `
    <table>
      <thead>
        <tr class="historical-order-table-header">
          <th>ID</th><th>Time</th><th>Price</th><th>SL</th><th>TP</th><th>Direction</th><th>Closed Type</th><th>Closed Price</th><th>P/L (Points)</th>
        </tr>
      </thead>
      <tbody>
        ${result.orders.filter(o => o.closed).map(order => `
          <tr class="historical-order-line">
            <td>${order.id}</td>
            <td>${order.time}</td>
            <td>${order.price.toFixed(5)}</td>
            <td>${order.sl.toFixed(5)}</td>
            <td>${order.tp.toFixed(5)}</td>
            <td>${order.direction}</td>
            <td class="order-status-${order.closedOrderType}">${order.closedOrderType}</td>
            <td>${parseFloat(order.closedPrice).toFixed(5) || ''}</td>
            <td class="trade-result-${order.tradeResult}">${order.pnlPoints?.toFixed(5) || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Generate exportable CSV
  const csvFileName = cachedFile?.name?.split('.')[0] || 'backtest';
  const resultToCSV = [
    `\t`,
    `${backtestingDate}\t`,
    `${csvFileName}\t`,
    `${result.params.preset || result.params.strategy}\t`,
    `${result.params.sessionStart}\t`,
    `${result.params.sessionEnd}\t`,
    `${result.totalTrades}\t`,
    `${result.winRate}%\t`,
    `${result.moneyEquivalent}\t`,
    `${result.params.lotSize}\t`,
    `${result.params.slSize}\t`,
    `${result.params.tpSize}\t`,
    `${result.params.tsSize}\t`,
    `${result.params.maPeriod}\t`,
    `${result.profitFactor}\t`,
  ].join('');
  
  $exportableCSVField.value = resultToCSV;
  updateGoogleSheetsButtonState();
  
  // Render comparison chart with all saved results
  renderComparisonChart();
};

// Save results to localStorage
const saveResultsToStorage = () => {
  try {
    localStorage.setItem('backtestResults', JSON.stringify(backtestResults));
  } catch (e) { console.warn('Could not save to localStorage:', e); }
};

// Load results from localStorage
const loadResultsFromStorage = () => {
  try {
    const saved = localStorage.getItem('backtestResults');
    if (saved) {
      backtestResults = JSON.parse(saved);
      window.backtestResults = backtestResults;
    }
  } catch (e) { console.warn('Could not load from localStorage:', e); }
};

// Load on startup
loadResultsFromStorage();

// Save results to localStorage whenever they change
const saveResultForComparison = (result) => {
  backtestResults.push(result);
  window.backtestResults = backtestResults;
  saveResultsToStorage();
  updateSavedResultsComparison();
};

// Sort preset for comparison table
let comparisonSortPreset = 'highestProfit';

// Normalize a value array to 0-1 range (higher = better)
const normalize = (values) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map(v => (v - min) / (max - min));
};

// Sort presets: each defines how to compute a composite score (higher = better)
const SORT_PRESETS = {
  highestProfit: {
    label: 'Highest Profit',
    score: (results) => results.map(r => parseFloat(r.moneyEquivalent)),
  },
  bestOverall: {
    label: 'Best Overall',
    score: (results) => {
      const pnl = normalize(results.map(r => parseFloat(r.moneyEquivalent)));
      const pf  = normalize(results.map(r => parseFloat(r.profitFactor)));
      const wr  = normalize(results.map(r => parseFloat(r.winRate)));
      const dd  = normalize(results.map(r => -Math.abs(parseFloat(r.maxDrawdown)))); // lower DD = better
      return results.map((_, i) => pnl[i] * 0.40 + pf[i] * 0.25 + wr[i] * 0.20 + dd[i] * 0.15);
    },
  },
  bestRiskReward: {
    label: 'Best Risk/Reward',
    score: (results) => {
      const pf = normalize(results.map(r => parseFloat(r.profitFactor)));
      const dd = normalize(results.map(r => -Math.abs(parseFloat(r.maxDrawdown))));
      const pnl = normalize(results.map(r => parseFloat(r.moneyEquivalent)));
      return results.map((_, i) => pf[i] * 0.45 + dd[i] * 0.35 + pnl[i] * 0.20);
    },
  },
  mostConsistent: {
    label: 'Most Consistent',
    score: (results) => {
      const wr = normalize(results.map(r => parseFloat(r.winRate)));
      const dd = normalize(results.map(r => -Math.abs(parseFloat(r.maxDrawdown))));
      const pf = normalize(results.map(r => parseFloat(r.profitFactor)));
      return results.map((_, i) => wr[i] * 0.45 + dd[i] * 0.35 + pf[i] * 0.20);
    },
  },
};

// Update the comparison table
const updateSavedResultsComparison = () => {
  const container = document.getElementById('savedResultsComparison');

  if (backtestResults.length === 0) {
    container.innerHTML = '<p style="color: #666; font-style: italic;">No saved results yet. Run a backtest and save parameters to compare.</p>';
    return;
  }

  // Compute composite scores and sort
  const preset = SORT_PRESETS[comparisonSortPreset] || SORT_PRESETS.highestProfit;
  const scores = preset.score(backtestResults);
  const indexed = backtestResults.map((r, i) => ({ result: r, score: scores[i] }));
  indexed.sort((a, b) => b.score - a.score);

  container.innerHTML = `
    <div class="sort-preset-bar">
      <label for="comparisonSortPreset">Sort by:</label>
      <select id="comparisonSortPreset" class="h-input-effects">
        ${Object.entries(SORT_PRESETS).map(([key, p]) =>
          `<option value="${key}" ${key === comparisonSortPreset ? 'selected' : ''}>${p.label}</option>`
        ).join('')}
      </select>
    </div>
    <table class="comparison-results-table">
      <thead>
        <tr class="comparison-table-header">
          <th>#</th>
          <th>Name</th>
          <th>Preset</th>
          <th>SL</th>
          <th>TP</th>
          <th>TS</th>
          <th>Trades</th>
          <th>Win%</th>
          <th>P/F</th>
          <th>P/L ($)</th>
          <th>DD ($)</th>
          <th>Score</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${indexed.map(({ result: r, score }, idx) => `
          <tr class="comparison-row ${idx === 0 ? 'best-result' : ''} ${idx === indexed.length - 1 && indexed.length > 1 ? 'worst-result' : ''}">
            <td>${idx + 1}</td>
            <td>${r.params.name || '-'}</td>
            <td>${r.params.preset || r.params.strategy}</td>
            <td>${r.params.slSize}</td>
            <td>${r.params.tpSize}</td>
            <td>${r.params.tsSize}</td>
            <td>${r.totalTrades}</td>
            <td class="${parseFloat(r.winRate) >= 50 ? 'text-profit' : 'text-loss'}">${r.winRate}%</td>
            <td>${r.profitFactor}</td>
            <td class="${parseFloat(r.moneyEquivalent) >= 0 ? 'text-profit' : 'text-loss'}">${r.moneyEquivalent}$</td>
            <td class="text-drawdown">${r.maxDrawdown}$</td>
            <td>${score.toFixed(2)}</td>
            <td>
              <button class="btn-load-params" data-params='${JSON.stringify(r.params)}' title="Load params & run backtest">▶</button>
              <button class="btn-load-mql" data-params='${JSON.stringify(r.params)}' title="Generate MQL Expert Advisor">MQL</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Sort preset change handler
  document.getElementById('comparisonSortPreset')?.addEventListener('change', (e) => {
    comparisonSortPreset = e.target.value;
    updateSavedResultsComparison();
  });

  // Load params button handlers
  container.querySelectorAll('.btn-load-params').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const params = JSON.parse(e.target.dataset.params);
      loadParamsAndRun(params);
    });
  });

  container.querySelectorAll('.btn-load-mql').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const params = JSON.parse(e.target.dataset.params);
      loadParamsAsMQL(params);
    });
  });

  // Render comparison chart
  renderComparisonChart();
};

// Save current parameters

// Generate MQL from parameters
const generateMQLFromParams = (params) => {
  const template = `//+------------------------------------------------------------------+
//|                     HYTEK TRADING SYSTEM                         |
//|                    9/21 EMA CROSSOVER EA                         |
//|                   MQL5 Version - MetaTrader 5                     |
//|                 Optimized Parameters v1.0                        |
//+------------------------------------------------------------------+

#property copyright "HYTEK"
#property version   "1.00"
#property description "9/21 EMA Crossover with optimized SL/TP/TS"
#property strict

#include <Trade\\Trade.mqh>

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+

input double SL_Pips = 50;               // Stop Loss: 50 pips (broker minimum safe)
input double TP_Pips = 100;              // Take Profit: 100 pips (2:1 risk/reward)
input double TS_Pips = 0;                // Trailing Stop: 0 (disabled)
input double LotSize = 1.0;              // Fixed lot size
input double RiskPercent = 2.0;          // Alternative: risk % per trade
input int EMA_Fast = 9;                  // Fast EMA period
input int EMA_Slow = 21;                 // Slow EMA period
input string TradeStartHour = "${params.sessionStart || '09:50'}";   // Trade start time HH:MM
input string TradeEndHour = "${params.sessionEnd || '11:00'}";     // Trade end time HH:MM
input bool TradeAllHours = false;        // If true, ignore time filter
input int MaxTradesPerDay = 10;          // Maximum trades per day
input double MaxDailyLoss = 500;         // Max loss in $ per day
input bool CloseAllOnMaxLoss = false;    // Close all if max loss hit

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+

CTrade trade;
int handleEMA9 = INVALID_HANDLE;
int handleEMA21 = INVALID_HANDLE;
int tradesToday = 0;
double dailyPnL = 0;
datetime lastTradeDay = 0;
const int MAGIC_NUMBER = 12345;

//+------------------------------------------------------------------+
//| EXPERT INITIALIZATION                                            |
//+------------------------------------------------------------------+

int OnInit()
{
    handleEMA9 = iMA(_Symbol, _Period, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE);
    handleEMA21 = iMA(_Symbol, _Period, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE);

    if(handleEMA9 == INVALID_HANDLE || handleEMA21 == INVALID_HANDLE)
    {
        Alert("Failed to create indicator handles");
        return INIT_FAILED;
    }

    trade.SetExpertMagicNumber(MAGIC_NUMBER);
    trade.SetDeviationInPoints(30);

    Print("HYTEK EA Initialized");
    Print("Entry: 9/21 EMA Crossover");
    Print("SL: ", SL_Pips, " pips | TP: ", TP_Pips, " pips");

    // Check broker's minimum stop distance requirement
    int minStopsPoints = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
    if(minStopsPoints > 0)
    {
        int minStopsPips = minStopsPoints / 10;  // Convert points to pips (for 5-digit broker)
        Print("=== BROKER INFO ===");
        Print("Broker minimum stop distance: ", minStopsPoints, " points (", minStopsPips, " pips)");
        Print("Your configured SL: ", SL_Pips, " pips");
        if(SL_Pips < minStopsPips)
        {
            Print("WARNING: SL_Pips (", SL_Pips, ") is less than broker minimum (", minStopsPips, ")");
            Print("Trades may be rejected. Consider increasing SL_Pips to at least ", minStopsPips);
        }
    }

    lastTradeDay = 0;
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| EXPERT DEINITIALIZATION                                          |
//+------------------------------------------------------------------+

void OnDeinit(const int reason)
{
    if(handleEMA9 != INVALID_HANDLE) IndicatorRelease(handleEMA9);
    if(handleEMA21 != INVALID_HANDLE) IndicatorRelease(handleEMA21);
    Print("HYTEK EA Deinitialized");
}

//+------------------------------------------------------------------+
//| EXPERT TICK FUNCTION                                             |
//+------------------------------------------------------------------+

void OnTick()
{
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);

    if(dt.day_of_week == 0 || dt.day_of_week == 6)
        return;

    MqlDateTime lastDt;
    TimeToStruct(lastTradeDay, lastDt);

    if(dt.day != lastDt.day)
    {
        tradesToday = 0;
        dailyPnL = 0;
        lastTradeDay = TimeCurrent();
    }

    UpdateDailyPnL();

    if(MaxDailyLoss > 0 && dailyPnL < -MaxDailyLoss)
    {
        if(CloseAllOnMaxLoss) CloseAllPositions();
        return;
    }

    if(!TradeAllHours && !IsInTradingHours())
        return;

    if(tradesToday >= MaxTradesPerDay)
        return;

    double ema9Array[2], ema21Array[2];

    if(CopyBuffer(handleEMA9, 0, 0, 2, ema9Array) != 2)
        return;
    if(CopyBuffer(handleEMA21, 0, 0, 2, ema21Array) != 2)
        return;

    double ema9Prev = ema9Array[1];
    double ema9Curr = ema9Array[0];
    double ema21Prev = ema21Array[1];
    double ema21Curr = ema21Array[0];

    bool bullishCrossover = (ema9Prev <= ema21Prev) && (ema9Curr > ema21Curr);
    bool bearishCrossover = (ema9Prev >= ema21Prev) && (ema9Curr < ema21Curr);

    if(bullishCrossover && HasOpenShorts())
        ClosePositionsByType(POSITION_TYPE_SELL);

    if(bearishCrossover && HasOpenLongs())
        ClosePositionsByType(POSITION_TYPE_BUY);

    if(bullishCrossover && !HasOpenTrade())
        OpenBuyOrder();

    if(bearishCrossover && !HasOpenTrade())
        OpenSellOrder();

    if(TS_Pips > 0)
        ManageTrailingStop();
}

//+------------------------------------------------------------------+
//| OPEN BUY ORDER                                                    |
//+------------------------------------------------------------------+

void OpenBuyOrder()
{
    double lotSize = CalculateLotSize(LotSize, RiskPercent);

    // Execute at market price without SL/TP
    if(trade.Buy(lotSize, _Symbol, 0, 0, 0, "HYTEK_BUY"))
    {
        ulong ticket = trade.ResultOrder();
        Print("BUY executed: Ticket=", ticket);

        // Small delay for position to settle
        Sleep(100);

        // Get actual fill price from the position
        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice - (SL_Pips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice + (TP_Pips * _Point), _Digits);

            Print("BUY Fill Price: ", fillPrice, " SL calc: ", stopLoss, " TP calc: ", takeProfit);
            Print("BUY SL distance: ", (fillPrice - stopLoss) / _Point, " pips, TP distance: ", (takeProfit - fillPrice) / _Point, " pips");

            // Modify with calculated stops based on actual fill
            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("BUY Order Opened: Ticket=", ticket, " Fill=", fillPrice, " SL=", stopLoss, " TP=", takeProfit);
                tradesToday++;
            }
            else
            {
                Print("BUY Modify Failed: Ticket=", ticket, " Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
            }
        }
        else
        {
            Print("BUY Position select failed: Ticket=", ticket);
        }
    }
    else
    {
        Print("BUY Order Failed: Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
    }
}

//+------------------------------------------------------------------+
//| OPEN SELL ORDER                                                   |
//+------------------------------------------------------------------+

void OpenSellOrder()
{
    double lotSize = CalculateLotSize(LotSize, RiskPercent);

    // Execute at market price without SL/TP
    if(trade.Sell(lotSize, _Symbol, 0, 0, 0, "HYTEK_SELL"))
    {
        ulong ticket = trade.ResultOrder();
        Print("SELL executed: Ticket=", ticket);

        // Small delay for position to settle
        Sleep(100);

        // Get actual fill price from the position
        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice + (SL_Pips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice - (TP_Pips * _Point), _Digits);

            Print("SELL Fill Price: ", fillPrice, " SL calc: ", stopLoss, " TP calc: ", takeProfit);
            Print("SELL SL distance: ", (stopLoss - fillPrice) / _Point, " pips, TP distance: ", (fillPrice - takeProfit) / _Point, " pips");

            // Modify with calculated stops based on actual fill
            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("SELL Order Opened: Ticket=", ticket, " Fill=", fillPrice, " SL=", stopLoss, " TP=", takeProfit);
                tradesToday++;
            }
            else
            {
                Print("SELL Modify Failed: Ticket=", ticket, " Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
            }
        }
        else
        {
            Print("SELL Position select failed: Ticket=", ticket);
        }
    }
    else
    {
        Print("SELL Order Failed: Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
    }
}

//+------------------------------------------------------------------+
//| CLOSE POSITIONS BY TYPE                                          |
//+------------------------------------------------------------------+

void ClosePositionsByType(ENUM_POSITION_TYPE posType)
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) != MAGIC_NUMBER) continue;
        if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
        if(PositionGetInteger(POSITION_TYPE) != posType) continue;

        if(!trade.PositionClose(ticket))
            Print("Position Close Failed: Ticket=", ticket, " Error=", GetLastError());
        else
            Print("Position Closed: Ticket=", ticket);
    }
}

//+------------------------------------------------------------------+
//| CLOSE ALL POSITIONS                                              |
//+------------------------------------------------------------------+

void CloseAllPositions()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) != MAGIC_NUMBER) continue;
        if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

        trade.PositionClose(ticket);
    }
}

//+------------------------------------------------------------------+
//| MANAGE TRAILING STOP                                             |
//+------------------------------------------------------------------+

void ManageTrailingStop()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) != MAGIC_NUMBER) continue;
        if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

        int posType = (int)PositionGetInteger(POSITION_TYPE);
        double stopLoss = PositionGetDouble(POSITION_SL);
        double trailingStop = TS_Pips * _Point;
        double newSL = 0;
        bool modify = false;

        if(posType == POSITION_TYPE_BUY)
        {
            newSL = SymbolInfoDouble(_Symbol, SYMBOL_BID) - trailingStop;
            if(newSL > stopLoss)
                modify = true;
        }
        else if(posType == POSITION_TYPE_SELL)
        {
            newSL = SymbolInfoDouble(_Symbol, SYMBOL_ASK) + trailingStop;
            if(newSL < stopLoss)
                modify = true;
        }

        if(modify)
        {
            double currentTP = PositionGetDouble(POSITION_TP);
            trade.PositionModify(ticket, newSL, currentTP);
        }
    }
}

//+------------------------------------------------------------------+
//| CALCULATE LOT SIZE                                               |
//+------------------------------------------------------------------+

double CalculateLotSize(double fixedLot, double riskPercent)
{
    if(fixedLot > 0)
        return NormalizeDouble(fixedLot, 2);

    if(riskPercent <= 0)
        return 0.1;

    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = balance * (riskPercent / 100);
    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);

    double pipValue = tickValue / tickSize;
    double lotSize = NormalizeDouble(riskAmount / (SL_Pips * pipValue), 2);

    double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);

    lotSize = MathMax(lotSize, minLot);
    lotSize = MathMin(lotSize, maxLot);

    return lotSize;
}

//+------------------------------------------------------------------+
//| CHECK TRADING HOURS                                              |
//+------------------------------------------------------------------+

bool IsInTradingHours()
{
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);

    int hour = dt.hour;
    int minute = dt.min;

    int startHour = (int)StringToInteger(StringSubstr(TradeStartHour, 0, 2));
    int startMin = (int)StringToInteger(StringSubstr(TradeStartHour, 3, 2));
    int endHour = (int)StringToInteger(StringSubstr(TradeEndHour, 0, 2));
    int endMin = (int)StringToInteger(StringSubstr(TradeEndHour, 3, 2));

    int currentTime = hour * 60 + minute;
    int startTime = startHour * 60 + startMin;
    int endTime = endHour * 60 + endMin;

    return (currentTime >= startTime && currentTime <= endTime);
}

//+------------------------------------------------------------------+
//| UPDATE DAILY P&L                                                  |
//+------------------------------------------------------------------+

void UpdateDailyPnL()
{
    dailyPnL = 0;

    MqlDateTime currentDt;
    TimeToStruct(TimeCurrent(), currentDt);

    for(int i = 0; i < HistoryDealsTotal(); i++)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket == 0) continue;

        datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
        MqlDateTime dealDt;
        TimeToStruct(dealTime, dealDt);

        if(dealDt.day != currentDt.day) continue;

        if(HistoryDealGetInteger(ticket, DEAL_MAGIC) != MAGIC_NUMBER) continue;
        if(HistoryDealGetString(ticket, DEAL_SYMBOL) != _Symbol) continue;

        int dealEntry = (int)HistoryDealGetInteger(ticket, DEAL_ENTRY);
        if(dealEntry != DEAL_ENTRY_OUT) continue;

        double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
        double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
        double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);

        dailyPnL += profit + commission + swap;
    }
}

//+------------------------------------------------------------------+
//| CHECK POSITION STATUS                                            |
//+------------------------------------------------------------------+

bool HasOpenTrade()
{
    for(int i = 0; i < PositionsTotal(); i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER && PositionGetString(POSITION_SYMBOL) == _Symbol)
            return true;
    }
    return false;
}

bool HasOpenLongs()
{
    for(int i = 0; i < PositionsTotal(); i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER &&
           PositionGetString(POSITION_SYMBOL) == _Symbol &&
           PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
            return true;
    }
    return false;
}

bool HasOpenShorts()
{
    for(int i = 0; i < PositionsTotal(); i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER &&
           PositionGetString(POSITION_SYMBOL) == _Symbol &&
           PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
            return true;
    }
    return false;
}

//+------------------------------------------------------------------+
//| END OF EA                                                         |
//+------------------------------------------------------------------+
`;
  return template;
};

// Show MQL in Expert Advisor Generator panel
const showMQLExpertAdvisor = (mqlText) => {
  const textarea = document.getElementById('algoEditorTextareaMain1');
  if (textarea) {
    textarea.value = mqlText;
    // Switch to MQL panel
    document.getElementById('result-panel-toolbar-content-toggler-algo-editor').click();
  }
};

// Load params as MQL generation via button in the results table
const loadParamsAsMQL = (params) => {
  const mqlText = generateMQLFromParams(params);
  showMQLExpertAdvisor(mqlText);
};

// Download MQL5 file
const downloadMQL5 = () => {
  const textarea = document.getElementById('algoEditorTextareaMain1');
  if (!textarea || !textarea.value) {
    alert('No MQL5 code to download');
    return;
  }
  
  const blob = new Blob([textarea.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GeneratedEA.mq5';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Attach download button listener
document.getElementById('downloadMQL5Btn')?.addEventListener('click', downloadMQL5);

// Regenerate MQL from form parameters
document.getElementById('regenerateMQLBtn')?.addEventListener('click', () => {
  const params = getCurrentParams();
  const mqlText = generateMQLFromParams(params);
  const textarea = document.getElementById('algoEditorTextareaMain1');
  if (textarea) textarea.value = mqlText;
});

// Run backtest from MQL panel
const runBacktestFromMQL = () => {
  if (cachedCSVData.length === 0) {
    alert('Please load a CSV file first!');
    return;
  }
  const params = getCurrentParams();
  loadParamsAndRun(params);
};
document.getElementById('runBacktestFromMQLBtn')?.addEventListener('click', runBacktestFromMQL);

// Simple optimized backtest to cache CSV data for Grid Search
const runOptimized = async () => {
  let csvData = cachedCSVData;

  if (csvData.length === 0) {
    const file = $csvFileInput?.files?.[0];
    if (!file) {
      alert('Please load a CSV file first!');
      return;
    }

    console.log('Parsing file for optimized backtest...');
    const results = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: resolve,
        error: reject,
      });
    });
    csvData = results.data.filter(row => row && row[EnumMT5OHLC.OPEN]);
    cachedCSVData = csvData;
    console.log(`Parsed ${csvData.length} candles from file`);
  }

  const params = getCurrentParams();
  console.log(`Running optimized backtest with ${csvData.length} candles...`);

  document.getElementById('loading-element').classList.add('visible');
  document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Running optimized backtest...';

  await new Promise(resolve => {
    setTimeout(() => {
      const result = runOptimizedBacktest(params, csvData);
      document.getElementById('loading-element').classList.remove('visible');
      displayBacktestResult(result);
      saveResultForComparison(result);
      resolve();
    }, 50);
  });
};

// Intelligent parameter optimization using random search + hill climbing
const runGridSearch = async () => {
  // If CSV data not cached yet, run optimized backtest first to cache it
  if (cachedCSVData.length === 0) {
    console.log('CSV not cached yet, running optimized backtest first...');
    await runOptimized();
    // If still no data after runOptimized, abort
    if (cachedCSVData.length === 0) {
      return;
    }
  }

  const baseParams = getCurrentParams();
  
  if (!confirm('Run automatic parameter optimization? This will find the most profitable parameters.')) {
    return;
  }
  
  document.getElementById('loading-element').classList.add('visible');
  document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Optimizing parameters...';
  
  backtestResults = [];
  
  // Define search ranges
  const ranges = {
    slSize: { min: 0.0005, max: 0.003, step: 0.0005 },
    tpSize: { min: 0.001, max: 0.01, step: 0.001 },
    tsSize: { min: 0.00001, max: 0.0002, step: 0.00005 },
  };

  // Get all preset names for testing
  const allPresets = Object.keys(MULTI_POSITION_PRESETS);

  // Helper: generate random parameter set (including random preset)
  const randomParams = () => ({
    slSize: Math.round((ranges.slSize.min + Math.random() * (ranges.slSize.max - ranges.slSize.min)) / ranges.slSize.step) * ranges.slSize.step,
    tpSize: Math.round((ranges.tpSize.min + Math.random() * (ranges.tpSize.max - ranges.tpSize.min)) / ranges.tpSize.step) * ranges.tpSize.step,
    tsSize: Math.round((ranges.tsSize.min + Math.random() * (ranges.tsSize.max - ranges.tsSize.min)) / ranges.tsSize.step) * ranges.tsSize.step,
    preset: allPresets[Math.floor(Math.random() * allPresets.length)],
  });
  
  // Phase 1: Random Search (broad exploration)
  const randomIterations = 50;
  let bestResult = null;
  let bestProfit = -Infinity;
  
  for (let i = 0; i < randomIterations; i++) {
    const params = { ...baseParams, ...randomParams(), name: `Random_${i+1}` };
    const result = runOptimizedBacktest(params, cachedCSVData);
    backtestResults.push(result);
    
    const profit = parseFloat(result.moneyEquivalent);
    if (profit > bestProfit) {
      bestProfit = profit;
      bestResult = result;
    }
    
    document.getElementById('loading-element').querySelector('.loading-text').textContent = 
      `Phase 1: Random search ${i+1}/${randomIterations} - Best: ${bestProfit.toFixed(2)}$`;
    
    if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  if (!bestResult) {
    alert('No valid results found.');
    document.getElementById('loading-element').classList.remove('visible');
    return;
  }
  
  // Phase 2: Hill Climbing from best found
  document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Phase 2: Fine-tuning...';
  
  let currentBest = { ...bestResult.params };
  let currentProfit = bestProfit;
  let neighborsTested = 0;
  const maxNeighbors = 30;
  const improvementThreshold = 0.001;
  
  for (let iter = 0; iter < maxNeighbors; iter++) {
    let foundBetter = false;
    
    // Test neighbors around current best (including preset variations)
    const neighborTests = [
      { param: 'slSize', delta: ranges.slSize.step },
      { param: 'slSize', delta: -ranges.slSize.step },
      { param: 'tpSize', delta: ranges.tpSize.step },
      { param: 'tpSize', delta: -ranges.tpSize.step },
      { param: 'tsSize', delta: ranges.tsSize.step },
      { param: 'tsSize', delta: -ranges.tsSize.step },
    ];

    // Also test other presets if current preset isn't tested yet in this iteration
    const currentPreset = currentBest.preset || baseParams.preset;
    const otherPresets = allPresets.filter(p => p !== currentPreset);
    for (const preset of otherPresets) {
      neighborTests.push({ param: 'preset', preset: preset });
    }
    
    for (const test of neighborTests) {
      let newParams;
      let testName;

      if (test.preset) {
        // Test preset change
        newParams = {
          ...baseParams,
          ...currentBest,
          preset: test.preset,
          name: `Hill_${iter}_preset_${test.preset}`
        };
        testName = `preset_${test.preset}`;
      } else {
        // Test parameter adjustment
        newParams = {
          ...baseParams,
          ...currentBest,
          [test.param]: Math.max(ranges[test.param].min, Math.min(ranges[test.param].max, currentBest[test.param] + test.delta)),
          name: `Hill_${iter}_${test.param}_${test.delta > 0 ? 'up' : 'down'}`
        };
        testName = `${test.param}_${test.delta > 0 ? 'up' : 'down'}`;
      }

      const result = runOptimizedBacktest(newParams, cachedCSVData);
      backtestResults.push(result);

      const profit = parseFloat(result.moneyEquivalent);
      neighborsTested++;

      if (profit > currentProfit + improvementThreshold) {
        currentBest = { ...newParams };
        currentProfit = profit;
        foundBetter = true;
        break;
      }
    }
    
    document.getElementById('loading-element').querySelector('.loading-text').textContent = 
      `Phase 2: Fine-tuning ${iter+1}/${maxNeighbors} - Best: ${currentProfit.toFixed(2)}$`;
    
    if (!foundBetter) break;
    if (iter % 3 === 0) await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  // Phase 3: Verify best params
  document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Phase 3: Verifying best parameters...';
  
  const finalParams = { ...baseParams, ...currentBest, name: 'OPTIMIZED_BEST' };
  const finalResult = runOptimizedBacktest(finalParams, cachedCSVData);
  backtestResults.push(finalResult);
  
  updateSavedResultsComparison();
  
  // Show best result
  const sortedResults = [...backtestResults].sort((a, b) => parseFloat(b.moneyEquivalent) - parseFloat(a.moneyEquivalent));
  displayBacktestResult(sortedResults[0]);

  // Hide loading before showing results
  document.getElementById('loading-element').classList.remove('visible');

  const best = sortedResults[0];
  alert(`Optimization complete!\n\nBest Profit: ${best.moneyEquivalent}$\nWin Rate: ${best.winRate}%\nTrades: ${best.totalTrades}\n\nParameters:\nSL: ${best.params.slSize}\nTP: ${best.params.tpSize}\nTS: ${best.params.tsSize}\nPreset: ${best.params.preset || '-'}`);

  audioSuccess.play();
};


// Event listeners
document.getElementById('runGridSearch')?.addEventListener('click', runGridSearch);
