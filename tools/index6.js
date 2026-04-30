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
  balanced: {
    enabled: true,
    positions: [
      { lot: 1.0, name: 'A', slMoveStartR: 0.5, trailingStartR: 2.0, lotMultiplier: 1.0 },
      { lot: 0.7, name: 'B', slMoveStartR: 1.0, trailingStartR: 3.0, lotMultiplier: 0.7 },
      { lot: 0.5, name: 'C', slMoveStartR: 1.5, trailingStartR: 4.0, lotMultiplier: 0.5 }
    ]
  },
  equal: {
    enabled: true,
    positions: [
      { lot: 1.0, name: 'A', slMoveStartR: 0.5, trailingStartR: 2.0, lotMultiplier: 1.0 },
      { lot: 1.0, name: 'B', slMoveStartR: 1.0, trailingStartR: 3.0, lotMultiplier: 1.0 },
      { lot: 1.0, name: 'C', slMoveStartR: 1.5, trailingStartR: 4.0, lotMultiplier: 1.0 }
    ]
  },
  aggressive: {
    enabled: true,
    positions: [
      { lot: 1.5, name: 'A', slMoveStartR: 0.5, trailingStartR: 2.0, lotMultiplier: 1.5 },
      { lot: 0.7, name: 'B', slMoveStartR: 1.0, trailingStartR: 3.0, lotMultiplier: 0.7 },
      { lot: 0.3, name: 'C', slMoveStartR: 1.5, trailingStartR: 4.0, lotMultiplier: 0.3 }
    ]
  },
  conservative: {
    enabled: true,
    positions: [
      { lot: 0.5, name: 'A', slMoveStartR: 0.5, trailingStartR: 1.5, lotMultiplier: 0.5 },
      { lot: 0.5, name: 'B', slMoveStartR: 1.0, trailingStartR: 2.5, lotMultiplier: 0.5 },
      { lot: 0.5, name: 'C', slMoveStartR: 1.5, trailingStartR: 3.5, lotMultiplier: 0.5 }
    ]
  }
};

// Get preset from dropdown, URL, or default to 'balanced'
const getMultiPositionConfig = () => {
  // First check dropdown value
  const dropdown = document.getElementById('multiPositionPreset');
  if (dropdown && dropdown.value) {
    return MULTI_POSITION_PRESETS[dropdown.value] || MULTI_POSITION_PRESETS.balanced;
  }
  // Fall back to URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const preset = urlParams.get('multipreset') || 'balanced';
  return MULTI_POSITION_PRESETS[preset] || MULTI_POSITION_PRESETS.balanced;
};

// Run optimized backtest (no chart rendering)
const runOptimizedBacktest = (params, csvRows) => {
  // Get multi-position config based on URL preset
  const MULTI_POSITION_CONFIG = getMultiPositionConfig();
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
    const startRangeTime = new Date(`${d[EnumMT5OHLC.DATE]} ${localSessionStart}`);
    const endRangeTime = new Date(`${d[EnumMT5OHLC.DATE]} ${localSessionEnd}`);
    const currentTime = new Date(`${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`);
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
            // Create 3 positions at once
            MULTI_POSITION_CONFIG.positions.forEach(posConfig => {
              localOrdersHistory.push({
                id: `${localTradeCount + 1}-${posConfig.name}`,
                posName: posConfig.name,
                lotMultiplier: posConfig.lotMultiplier,
                time: candleDateTime,
                price: entryPrice,
                sl: direction === 'BULL' ? entryPrice - localSlSize() : entryPrice + localSlSize(),
                initialSL: direction === 'BULL' ? entryPrice - localSlSize() : entryPrice + localSlSize(),
                tp: direction === 'BULL' ? entryPrice + localTpSize() : entryPrice - localTpSize(),
                direction: direction,
                slMoveStartR: posConfig.slMoveStartR,
                slMoveCount: 0,
                trailingStartR: posConfig.trailingStartR,
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
        
        // 1. Progressive SL movement (move SL every 0.5R)
        if (!order.trailingActive) {
          const slMoveThreshold = order.slMoveStartR + (order.slMoveCount * 0.5);
          if (currentR >= slMoveThreshold) {
            const newSL = order.direction === 'BULL'
              ? order.price + (slMoveThreshold * localSlSize())
              : order.price - (slMoveThreshold * localSlSize());
            order.sl = newSL;
            order.slMoveCount++;
          }
        }
        
        // 2. Activate trailing after trailingStartR
        if (currentR >= order.trailingStartR && !order.trailingActive) {
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
        }
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
$strategyInput?.addEventListener('change', () => animateActiveClass($csvRefresh));
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

const readingSpeed = 0; // Speed of reading the CSV file in milliseconds
const strategy = $strategyInput.value || EnumStrategy.CSID_W_MA_DynamicTS; // Current strategy selected

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
let firstDate = new Date();
let lastDate = new Date();
let prevDate = null;
const now = new Date();
let backtestingDate = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`; // YYYY/MM/DD format
const trailingStopSeriesMap = new Map();
window.ordersHistory = ordersHistory;

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
        
        // Only update chart if NOT in fast mode
        if (!isFastMode) {
          // Append data to the chart:
          appendDataToChart(results.data);
          // Backtesting date time logics (annotation on chart and select element population):
          addBacktestingDateTimeToChart(results.data, csvDataIndex);
          // Plot real-time indicators:
          appendIndicatorsToChart(results.data, csvDataIndex);
        }
        
        // Run the Check for TP/SL hit function on every candle (always run this - it's the core logic)
        checkForTPSLHit(results.data, csvDataIndex);
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
    // Ctrl+Enter: Run optimized backtest
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runOptimizedBacktestUI();
    }
    // Ctrl+S: Save current params
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveCurrentParams();
    }
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
      let tradeCount = 0;
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
        const takeTradeSignal =
          arrayOfSignals[EnumArrayOfSignalsIndex.CSID] == true &&
          arrayOfSignals[EnumArrayOfSignalsIndex.TTR] == true &&
          arrayOfSignals[EnumArrayOfSignalsIndex.ATR] == true &&
          arrayOfSignals[EnumArrayOfSignalsIndex.MADirection] == true;
        if (takeTradeSignal) {
          tradeCount++;
          AddActionOnChart(d, EnumActionType.TAKE_A_TRADE, direction);
          listeningATR = true; // Start listening for ATR again once we open position
          //if (tradeCount >= 3) {
          // console.log('Reached 3 trades max');
          arrayOfSignals[EnumArrayOfSignalsIndex.ATR] = false; // Reset ATR signal after 3 trades max
          //}
        }
      };

      // TP/SL Validation: ========================================
      // Function to check all TP/SL hit:
      // OPTIMIZED: Only process active orders instead of filtering through all orders
      const checkForTPSLHit = (d, dataIndex) => {
        // Only check active (non-closed) orders to reduce processing overhead
        const activeOrders = ordersHistory.filter(order => !order.closed);
        activeOrders.forEach((order) => {

          // break-even at SL distance (1R)
          if (!order.breakEvenMoved) {
            const closePrice = d[EnumMT5OHLC.CLOSE];
            const slDistance = slSize();
            if (
              (order.direction === EnumDirection.BULL && closePrice >= order.price + slDistance) ||
              (order.direction === EnumDirection.BEAR && closePrice <= order.price - slDistance)
            ) {
              order.sl = order.price;
              order.breakEvenMoved = true;
            }
          }

          const isBull = order.direction === EnumDirection.BULL;
          const isBear = order.direction === EnumDirection.BEAR;
          const high = d[EnumMT5OHLC.HIGH];
          const low = d[EnumMT5OHLC.LOW];
          const close = d[EnumMT5OHLC.CLOSE];
          const open = d[EnumMT5OHLC.OPEN];
          const currentTime = `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`;
          const orderOpenTime = convertMT5DateToUnix(order.time);

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

            // OPTIMIZED: Calculate profitability only when trades close, not every candle
            profitabilityCalculation();

            const orderCloseTime = convertMT5DateToUnix(order.closedTime);

            // Marker + Label
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: timeToIndex.get(orderCloseTime),
                y1: level,
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.sell,
              }),
              new TextAnnotation({
                text: order.id,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
                x1: timeToIndex.get(orderCloseTime),
                y1: level,
              })
            );

            // Line
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
          };

          // Modify SL (Trailing Stop)
          if (candlesFromBuffer.length < 2) return;

          const trailingStopSize =
            parseFloat($TSIncrementInput.value) || 0.0000;

          const previousCandle =
            candlesFromBuffer[candlesFromBuffer.length - 2];

          /*if (isBull) {
            if (
              getCandleDirectionFromCandle(previousCandle) == EnumDirection.BULL
            ) {
              console.log('Moving SL of ', order.id, ' from ', order.sl, ' to ',  order.sl + trailingStopSize);
              debugger
              order.sl = order.sl + trailingStopSize; // Move SL by trailingStopSize (up side)
            //}
          //} else if (isBear) {
            if (
              getCandleDirectionFromCandle(previousCandle) == EnumDirection.BEAR
            ) {
              order.sl = order.sl - trailingStopSize; // Move SL by trailingStopSize (down side)
            //}
          //}*/

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

          if (order.direction == EnumDirection.BULL) {
            //console.log('Moving SL of ', order.id, ' from ', order.sl, ' to ',  order.sl + trailingStopSize);
            /*order.sl < order.price && d[EnumMT5OHLC.OPEN] > order.price ? order.sl = order.price : */
            order.sl += trailingSizeMultiplier(candleSize);
            // order.sl = order.sl + trailingStopSize; // Move SL by trailingStopSize (up side)
          } else if (order.direction == EnumDirection.BEAR) {
            //console.log('Moving SL of ', order.id, ' from ', order.sl, ' to ',  order.sl - trailingStopSize);
            // order.sl = order.sl - trailingStopSize; // Move SL by trailingStopSize (down side)
            /*order.sl > order.price && d[EnumMT5OHLC.OPEN] < order.price ? order.sl = order.price : */
            order.sl -= trailingSizeMultiplier(candleSize);
          }

          // Trailing Stop visual:
          const _isFast = window.location.search.includes('fastmode') ||
            (document.getElementById('fastBacktestMode') && document.getElementById('fastBacktestMode').checked);
          if (!_isFast) {
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
          } // end if (!_isFast)

          // Check TP
          if ((isBull && high >= order.tp) || (!isBull && low <= order.tp)) {
            closeOrder(order.tp, EnumclosedOrderType.CLOSED_BY_TP);
          }

          // Check SL
          if ((isBull && low <= order.sl) || (!isBull && high >= order.sl)) {
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
            const orderOptionsBasedDirection = (tradeDirection) => {
              if (tradeDirection == EnumDirection.BULL) {
                return {
                  sl: candle[definedCandleMoment] - slSize(),
                  tp: candle[definedCandleMoment] + tpSize(),
                  direction: EnumDirection.BULL,
                };
              } else {
                return {
                  sl: candle[definedCandleMoment] + slSize(),
                  tp: candle[definedCandleMoment] - tpSize(),
                  direction: EnumDirection.BEAR,
                };
              }
            };

            // Add order to history:
ordersHistory.push({
          id: ordersHistory.length + 1,
          breakEvenMoved: false,
          time: `${candle[EnumMT5OHLC.DATE]} ${candle[EnumMT5OHLC.TIME]}`,
          price: candle[definedCandleMoment],
          closedOrderType: EnumclosedOrderType.PENDING,
              ...orderOptionsBasedDirection(tradeDirection),
            });
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

        for (const { id, pnlPoints } of ordersHistory) {
          labels.push(id);

          // Strategy cumulative (points)
          sum += +pnlPoints;
          pnlData.push(sum);

          // Equity in points
          equitySumPoints += +pnlPoints - commissionPoints;
          equityData.push(equitySumPoints);

          // Equity in $ (money equivalent, per trade)
          const tradeMoney = (+pnlPoints - commissionPoints) * 100000 * lotSize();
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
          const csvFileName = $csvFileInput.value.split('\\')[2].split('.')[0];
          const [_, timeframe, sd, ed] = csvFileName.split('_');
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
        result += `Trade Taken: ${ordersHistory.length} (in ${numbDays} days)`;
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
        window.existingChart.data.labels = labels;
        window.existingChart.data.datasets[0].data = pnlData;
        window.existingChart.data.datasets[1].data = equityDataMoney;
        window.existingChart.update('none');

        // Historical Orders Table with clickable rows for chart navigation
        document.getElementById('backtestingResultOrderHistory').innerHTML = `
    <table>
      <thead>
        <tr class="historical-order-table-header">
          <th>ID</th>
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
        const startRangeTime = new Date(
          `${d[EnumMT5OHLC.DATE]} ${$sessionStartInput.value}`
        );
        const endRangeTime = new Date(
          `${d[EnumMT5OHLC.DATE]} ${$sessionEndInput.value}`
        );
        const currentTime = new Date(
          `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`
        );
        const inTradingTimeRange =
          currentTime >= startRangeTime && currentTime <= endRangeTime;
        //console.table([startRangeTime, currentTime, endRangeTime, currentTime >= startRangeTime && currentTime <= endRangeTime, inTradingTimeRange, arrayOfSignals]);
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
        // This validation to fake next candle:
        if (arrayOfSignals[0] == true) {
          checkSignalsForTrade(d, savedTradeDirectionForNextCandleEntry);
          arrayOfSignals[0] = false;
        } else {
          arrayOfSignals[0] = false;
        }

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
        // Add a new CSID Data for our line annotations:
        const currentUnixTime = convertMT5DateToUnix(d[EnumMT5OHLC.DATE] + ' ' + d[EnumMT5OHLC.TIME]);
        CSIDDataSerieFromHighs.append(
          timeToIndex.get(currentUnixTime),
          highestHighLong[highestHighLong.length - 1]
        );
        CSIDDataSerieFromLows.append(
          timeToIndex.get(currentUnixTime),
          lowestLowShort[lowestLowShort.length - 1]
        );
        maDataSeries.append(
          timeToIndex.get(currentUnixTime),
          simpleMA(CSIDLookbackCandleSerie, maPeriod())[CSIDLookbackCandleSerie.length - 1]
        );

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

        if (bullishCSID || bearishCSID) {
          CSIDSignalTriggered = true;

          const isBull = bullishCSID;
          const svgString = isBull
            ? signalAnnotation.svgString.bullish
            : signalAnnotation.svgString.bearish;
          const svgCandleLocation = isBull ? EnumMT5OHLC.LOW : EnumMT5OHLC.HIGH;
          const direction = isBull ? EnumDirection.BULL : EnumDirection.BEAR;

          const signal = new CustomAnnotation({
            x1: timeToIndex.get(convertMT5DateToUnix(
              d[EnumMT5OHLC.DATE] + ' ' + d[EnumMT5OHLC.TIME]
            )),
            y1: d[svgCandleLocation],
            verticalAnchorPoint: EVerticalAnchorPoint.Center,
            horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
            svgString,
          });
          sciChartSurface.annotations.add(signal);

          // Update first signal then check signals validation:
          arrayOfSignals[0] = true;
          savedTradeDirectionForNextCandleEntry = direction;
          //checkSignalsForTrade(d, direction);
          //AddActionOnChart(d, EnumActionType.TAKE_A_TRADE, direction);
        }
        // End of CSID Graph Related Annotations ========================================
      };
      window.updateCSIDLineAnnotation = updateCSIDLineAnnotation;
      // End of CSID Indicator: ========================================

      const reinitializeChart = () => {
        // Clear the select element:
        $navigateTroughtDates.innerHTML = '';
        //sciChartSurface.annotations.clear();
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
  if (prevDate !== d[EnumMT5OHLC.DATE]) {
    console.log(d[EnumMT5OHLC.DATE]);
    processedDays++;
    $currentReadingDate.innerText = d[EnumMT5OHLC.DATE];

    animateActiveClass($currentReadingDate);
    prevDate = d[EnumMT5OHLC.DATE];
  }

  // Update progression bar for each candle processed:
  if (totalCandles > 0) {
    updateFileReadingProgression((processedCandles * 100) / totalCandles);
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

  var selectedTime = document.getElementById('backtesting-hour').value;

  if (candleTime == selectedTime) {
    numbDays = numbDays + 1;
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

const appendIndicatorsToChart = (d, dataIndex) => {
  // Example of appending indicators to the chart
  // This is a placeholder function, you can implement your own logic
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
  sessionStart: $sessionStartInput?.value || '09:50:00',
  sessionEnd: $sessionEndInput?.value || '11:00:00',
  slSize: parseFloat($SLPointsInput?.value) || 0.0001,
  tpSize: parseFloat($TPPointsInput?.value) || 0.0003,
  lotSize: parseFloat($LotSizeInput?.value) || 1.0,
  commissionSize: parseFloat($CommissionSizeInput?.value) || 0.00005,
  tsSize: parseFloat($TSIncrementInput?.value) || 0.0001,
  maPeriod: parseFloat($MAPeriodInput?.value) || 200,
  maThreshold: parseFloat($MAThresholdInput?.value) || 0.003,
});

// Load parameters and run backtest (with chart)
const loadParamsAndRun = (params) => {
  // Set values to inputs
  if ($strategyInput) $strategyInput.value = params.strategy;
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
const runOptimizedBacktestUI = async () => {
  // Check if we have cached data or if there's a file in the input
  let csvData = cachedCSVData;
  
  // If no cached data, try to get from file input
  if (csvData.length === 0) {
    const file = $csvFileInput?.files?.[0];
    if (file) {
      // Parse the file directly for optimized backtest
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
  }
  
  if (csvData.length === 0) {
    alert('Please load a CSV file first! The data will be cached for fast backtesting.');
    return;
  }
  
  const params = getCurrentParams();
  
  console.log(`Running optimized backtest with ${csvData.length} candles...`);
  
  // Show loading
  document.getElementById('loading-element').classList.add('visible');
  document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Running optimized backtest...';
  
  // Use setTimeout to allow UI to update
  setTimeout(() => {
    const result = runOptimizedBacktest(params, csvData);
    
    // Hide loading
    document.getElementById('loading-element').classList.remove('visible');
    document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Backtesting is running ...';
    
    // Display results
    displayBacktestResult(result);
    
    // Auto-save to comparison
    saveResultForComparison(result);
    
    audioSuccess.play();
  }, 50);
};

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
      plugins: {
        legend: { 
          display: true,
          position: 'right',
          labels: { color: '#888', font: { size: 9 }, boxWidth: 1 }
        },
      },
      scales: {
        x: { display: false },
        y: {
          ticks: { color: '#888', font: { size: 10 } },
          grid: { color: '#333' },
        },
      },
    },
  });
  
  // Update stats
  const best = resultsWithEquity[0];
  const worst = resultsWithEquity[resultsWithEquity.length - 1];
  document.getElementById('monteCarloStats').innerHTML = `
    <div style="display: flex; gap: 15px; flex-wrap: wrap; font-size: 11px;">
      ${best && worst ? `
        <span style="color: #5f5;">Best: ${best.name} (${best.money}$)</span>
        <span style="color: #f55;">Worst: ${worst.name} (${worst.money}$)</span>
      ` : '<span style="color: #666;">No equity curves to compare</span>'}
      <span style="color: #fff;">Runs: ${resultsWithEquity.length}</span>
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
    `${result.params.strategy}\t`,
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

// Update the comparison table
const updateSavedResultsComparison = () => {
  const container = document.getElementById('savedResultsComparison');
  
  if (backtestResults.length === 0) {
    container.innerHTML = '<p style="color: #666; font-style: italic;">No saved results yet. Run a backtest and save parameters to compare.</p>';
    return;
  }
  
  // Sort by money equivalent (best first)
  const sorted = [...backtestResults].sort((a, b) => parseFloat(b.moneyEquivalent) - parseFloat(a.moneyEquivalent));
  
  container.innerHTML = `
    <table class="comparison-results-table">
      <thead>
        <tr class="comparison-table-header">
          <th>#</th>
          <th>Name</th>
          <th>Strategy</th>
          <th>SL</th>
          <th>TP</th>
          <th>TS</th>
          <th>Trades</th>
          <th>Win%</th>
          <th>P/F</th>
          <th>P/L ($)</th>
          <th>DD ($)</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map((r, idx) => `
          <tr class="comparison-row ${idx === 0 ? 'best-result' : ''} ${idx === sorted.length - 1 && sorted.length > 1 ? 'worst-result' : ''}">
            <td>${idx + 1}</td>
            <td>${r.params.name || '-'}</td>
            <td>${r.params.strategy}</td>
            <td>${r.params.slSize}</td>
            <td>${r.params.tpSize}</td>
            <td>${r.params.tsSize}</td>
            <td>${r.totalTrades}</td>
            <td class="${parseFloat(r.winRate) >= 50 ? 'text-profit' : 'text-loss'}">${r.winRate}%</td>
            <td>${r.profitFactor}</td>
            <td class="${parseFloat(r.moneyEquivalent) >= 0 ? 'text-profit' : 'text-loss'}">${r.moneyEquivalent}$</td>
            <td class="text-drawdown">${r.maxDrawdown}$</td>
            <td>
              <button class="btn-load-params" data-params='${JSON.stringify(r.params)}' title="Load params & run backtest">▶</button>
              <button class="btn-load-mql" data-params='${JSON.stringify(r.params)}' title="Generate MQL Expert Advisor">MQL</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Add event listeners to load buttons
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
const saveCurrentParams = () => {
  const params = getCurrentParams();
  params.id = Date.now();
  params.timestamp = new Date().toISOString();
  params.name = document.getElementById('paramSetName')?.value || `Config ${savedParamSets.length + 1}`;
  savedParamSets.push(params);
  window.savedParamSets = savedParamSets;
  alert(`Parameters "${params.name}" saved! Total saved: ${savedParamSets.length}`);
};

// Generate MQL from parameters
const generateMQLFromParams = (params) => {
  const template = `//+------------------------------------------------------------------+
//|                   CSID + TTR + MADirection EA                    |
//+------------------------------------------------------------------+
#property strict
#property version   "1.00"

// Hardcoded parameters - no inputs to avoid MT5 cache issues
const int LOOKBACK_PERIOD = 20;
const string SESSION_START = "${params.sessionStart || '09:50:00'}";
const string SESSION_END = "${params.sessionEnd || '11:00:00'}";
const int MA_PERIOD = ${Math.floor(params.maPeriod)};
const double MA_THRESHOLD = ${params.maThreshold ? params.maThreshold.toFixed(6) : 0.003};
const int ATR_PERIOD = 20;
const double ATR_MULTIPLIER = 1.2;
const double LOT_SIZE = ${params.lotSize.toFixed(2)};
const double SL_PRICE = ${params.slSize ? params.slSize.toFixed(6) : 0.0003};
const double TP_PRICE = ${params.tpSize ? params.tpSize.toFixed(6) : 0.0009};

#include <Trade/Trade.mqh>

string csid_high_name = "CSID_High";
string csid_low_name = "CSID_Low";
string ttr_start_name = "TTR_Start";
string ttr_end_name = "TTR_End";

int ma_handle = INVALID_HANDLE;
int atr_handle = INVALID_HANDLE;
CTrade trade;
bool atr_triggered = false;
double prev_highest = 0;
double prev_lowest = 0;

int OnInit()
{
   Print("=== CSID EA Started ===");
   Print("MA_Period: ", MA_PERIOD, ", MA_Threshold: ", MA_THRESHOLD);
   Print("SL: ", SL_PRICE, ", TP: ", TP_PRICE, ", Lot: ", LOT_SIZE);
   Print("Session: ", SESSION_START, " - ", SESSION_END);
   
   ma_handle = iMA(_Symbol, _Period, MA_PERIOD, 0, MODE_SMA, PRICE_CLOSE);
   if(ma_handle == INVALID_HANDLE) { Print("Failed to create MA"); return(INIT_FAILED); }
   atr_handle = iATR(_Symbol, _Period, ATR_PERIOD);
   if(atr_handle == INVALID_HANDLE) { Print("Failed to create ATR"); return(INIT_FAILED); }
   trade.SetExpertMagicNumber(12345);
   trade.SetDeviationInPoints(10);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   if(ma_handle != INVALID_HANDLE) IndicatorRelease(ma_handle);
   if(atr_handle != INVALID_HANDLE) IndicatorRelease(atr_handle);
   ObjectDelete(0, csid_high_name);
   ObjectDelete(0, csid_low_name);
   ObjectDelete(0, ttr_start_name);
   ObjectDelete(0, ttr_end_name);
}

bool IsBullish(double o, double c) { return(c > o); }

bool IsInTradingTime()
{
   datetime t = TimeCurrent();
   MqlDateTime dt; TimeToStruct(t, dt);
   int current_min = dt.hour * 60 + dt.min;
   int sh = (int)StringSubstr(SESSION_START, 0, 2);
   int sm = (int)StringSubstr(SESSION_START, 3, 2);
   int eh = (int)StringSubstr(SESSION_END, 0, 2);
   int em = (int)StringSubstr(SESSION_END, 3, 2);
   return(current_min >= sh * 60 + sm && current_min <= eh * 60 + em);
}

double GetHighestHigh(int lb)
{
   int total = Bars(_Symbol, _Period);
   if(total < lb + 1) return(0);
   double highest = 0;
   for(int i = 1; i <= lb; i++)
   {
      double o = iOpen(_Symbol, _Period, i);
      double c = iClose(_Symbol, _Period, i);
      if(o <= 0 || c <= 0) continue;
      double price = IsBullish(o, c) ? c : o;
      if(price > highest || highest == 0) highest = price;
   }
   return(highest);
}

double GetLowestLow(int lb)
{
   int total = Bars(_Symbol, _Period);
   if(total < lb + 1) return(0);
   double lowest = 0;
   for(int i = 1; i <= lb; i++)
   {
      double o = iOpen(_Symbol, _Period, i);
      double c = iClose(_Symbol, _Period, i);
      if(o <= 0 || c <= 0) continue;
      double price = IsBullish(o, c) ? o : c;
      if(price < lowest || lowest == 0) lowest = price;
   }
   return(lowest);
}

void UpdatePreviousCSIDLevels()
{
   double current_high = GetHighestHigh(LOOKBACK_PERIOD);
   double current_low = GetLowestLow(LOOKBACK_PERIOD);
   if(current_high > 0) prev_highest = current_high;
   if(current_low > 0) prev_lowest = current_low;
}

double GetMA()
{
   if(ma_handle == INVALID_HANDLE) return(0);
   double ma[];
   if(CopyBuffer(ma_handle, 0, 0, 2, ma) < 2) return(0);
   return(ma[0]);
}

int GetMADirection()
{
   int total = Bars(_Symbol, _Period);
   if(total < LOOKBACK_PERIOD + 3) return(0);
   double ma_now = 0, ma_past = 0, ma_past2 = 0;
   for(int j = 0; j < LOOKBACK_PERIOD; j++) ma_now += iClose(_Symbol, _Period, j);
   ma_now /= LOOKBACK_PERIOD;
   for(int j = LOOKBACK_PERIOD; j < LOOKBACK_PERIOD * 2; j++) ma_past += iClose(_Symbol, _Period, j);
   ma_past /= LOOKBACK_PERIOD;
   for(int j = LOOKBACK_PERIOD * 2; j < LOOKBACK_PERIOD * 3; j++) ma_past2 += iClose(_Symbol, _Period, j);
   ma_past2 /= LOOKBACK_PERIOD;
   if(ma_now <= 0 || ma_past <= 0 || ma_past2 <= 0) return(0);
   double accel = ma_now - 2 * ma_past + ma_past2;
   if(accel > MA_THRESHOLD) return(1);
   if(accel < -MA_THRESHOLD) return(-1);
   return(0);
}

bool CheckCSIDSignal(double &direction)
{
   int total = Bars(_Symbol, _Period);
   if(total < LOOKBACK_PERIOD + 2) return(false);
   double current_close = iClose(_Symbol, _Period, 0);
   double highest = prev_highest;
   double lowest = prev_lowest;
   if(highest <= 0 || lowest <= 0) return(false);
   if(current_close > highest) { direction = 1; return(true); }
   if(current_close < lowest) { direction = -1; return(true); }
   return(false);
}

bool CheckATRSignal()
{
   if(atr_handle == INVALID_HANDLE) return(false);
   double atr[];
   if(CopyBuffer(atr_handle, 0, 0, 1, atr) < 1) return(false);
   double current_atr = atr[0];
   if(current_atr <= 0) return(false);
   
   // Use previous closed candle (index 1) - index 0 is current incomplete candle
   double high = iHigh(_Symbol, _Period, 1);
   double low = iLow(_Symbol, _Period, 1);
   double prev_close = iClose(_Symbol, _Period, 2);
   
   double tr = MathMax(high - low, MathMax(MathAbs(high - prev_close), MathAbs(low - prev_close)));
   
   // Match BT: TR must exceed ATR (not ATR * 1.2)
   return(tr > current_atr);
}

void ExecuteTrade(double direction)
{
   double price = NormalizeDouble(iClose(_Symbol, _Period, 0), _Digits);
   double sl = 0, tp = 0;
   Print("ExecuteTrade - price: ", price, " direction: ", direction);
   
   if(direction > 0) { 
      sl = NormalizeDouble(price - SL_PRICE, _Digits); 
      tp = NormalizeDouble(price + TP_PRICE, _Digits); 
   }
   else { 
      sl = NormalizeDouble(price + SL_PRICE, _Digits); 
      tp = NormalizeDouble(price - TP_PRICE, _Digits); 
   }
   Print("ExecuteTrade - SL_PRICE: ", SL_PRICE, " TP_PRICE: ", TP_PRICE, " sl: ", sl, " tp: ", tp);
   if(direction > 0) { trade.Buy(LOT_SIZE, _Symbol, price, sl, tp); }
   else { trade.Sell(LOT_SIZE, _Symbol, price, sl, tp); }
}

void OnTick()
{
   static datetime last_bar = 0;
   datetime current_bar = iTime(_Symbol, _Period, 0);
   if(current_bar == last_bar) return;
   last_bar = current_bar;
   
   int total = Bars(_Symbol, _Period);
   if(total < LOOKBACK_PERIOD + 2 || total < ATR_PERIOD + 2) return;
   
   // Check CSID first using previous candle's levels (like backtest)
   double direction = 0;
   bool csid_signal = CheckCSIDSignal(direction);
   
   // Then update levels for next candle's comparison
   UpdatePreviousCSIDLevels();
   
   bool in_session = IsInTradingTime();
   static bool was_in_session = false;
   if(!was_in_session && in_session) atr_triggered = false;
   was_in_session = in_session;
   
   int ma_dir = GetMADirection();
   bool atr_signal = CheckATRSignal();
   
   if(in_session && !atr_triggered && atr_signal) atr_triggered = true;
   
   //bool ma_ok = (direction > 0 && ma_dir > 0) || (direction < 0 && ma_dir < 0);
   bool ma_ok = true; // Disable MA check for now
   
   bool all_signals = in_session && csid_signal && atr_triggered;
   Print("in_session | csid_signal | atr_triggered: ", in_session, " ", csid_signal, " ", atr_triggered);
   Print("ma_dir: ", ma_dir, " direction: ", direction, " ma_ok: ", ma_ok);
   
   if(all_signals && ma_ok) {
      Print(">>> EXECUTING TRADE >>> direction: ", direction);
      ExecuteTrade(direction);
      atr_triggered = false;
   }
}
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

// Run all saved parameter sets
const runAllSavedParams = async () => {
  if (cachedCSVData.length === 0) {
    alert('Please load a CSV file first!');
    return;
  }
  
  if (savedParamSets.length === 0) {
    alert('No saved parameter sets! Save some parameters first.');
    return;
  }
  
  // Show loading
  document.getElementById('loading-element').classList.add('visible');
  document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Running multiple backtests...';
  
  // Clear previous results
  backtestResults = [];
  
  setTimeout(() => {
    savedParamSets.forEach((params, idx) => {
      const result = runOptimizedBacktest(params, cachedCSVData);
      result.params.name = params.name || `Config ${idx + 1}`;
      backtestResults.push(result);
    });
    
    // Update comparison
    updateSavedResultsComparison();
    
    // Show best result
    const best = [...backtestResults].sort((a, b) => parseFloat(b.moneyEquivalent) - parseFloat(a.moneyEquivalent))[0];
    displayBacktestResult(best);
    
    // Hide loading
    document.getElementById('loading-element').classList.remove('visible');
    document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Backtesting is running ...';
    
    audioSuccess.play();
    alert(`Completed ${savedParamSets.length} backtests! Best result: ${best.moneyEquivalent}$`);
  }, 50);
};

// Clear saved results
const clearSavedResults = () => {
  if (confirm('Clear all saved results?')) {
    backtestResults = [];
    savedParamSets = [];
    window.backtestResults = backtestResults;
    window.savedParamSets = savedParamSets;
    localStorage.removeItem('backtestResults');
    updateSavedResultsComparison();
    renderComparisonChart();
  }
};

// Intelligent parameter optimization using random search + hill climbing
const runGridSearch = async () => {
  if (cachedCSVData.length === 0) {
    alert('Please load a CSV file first!');
    return;
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
  
  // Helper: generate random parameter set
  const randomParams = () => ({
    slSize: Math.round((ranges.slSize.min + Math.random() * (ranges.slSize.max - ranges.slSize.min)) / ranges.slSize.step) * ranges.slSize.step,
    tpSize: Math.round((ranges.tpSize.min + Math.random() * (ranges.tpSize.max - ranges.tpSize.min)) / ranges.tpSize.step) * ranges.tpSize.step,
    tsSize: Math.round((ranges.tsSize.min + Math.random() * (ranges.tsSize.max - ranges.tsSize.min)) / ranges.tsSize.step) * ranges.tsSize.step,
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
    
    // Test neighbors around current best
    const neighborTests = [
      { param: 'slSize', delta: ranges.slSize.step },
      { param: 'slSize', delta: -ranges.slSize.step },
      { param: 'tpSize', delta: ranges.tpSize.step },
      { param: 'tpSize', delta: -ranges.tpSize.step },
      { param: 'tsSize', delta: ranges.tsSize.step },
      { param: 'tsSize', delta: -ranges.tsSize.step },
    ];
    
    for (const test of neighborTests) {
      const newParams = { 
        ...baseParams, 
        ...currentBest,
        [test.param]: Math.max(ranges[test.param].min, Math.min(ranges[test.param].max, currentBest[test.param] + test.delta)),
        name: `Hill_${iter}_${test.param}_${test.delta > 0 ? 'up' : 'down'}`
      };
      
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
  
  document.getElementById('loading-element').classList.remove('visible');
  
  audioSuccess.play();
  
  const best = sortedResults[0];
  alert(`Optimization complete!\n\nBest Profit: ${best.moneyEquivalent}$\nWin Rate: ${best.winRate}%\nTrades: ${best.totalTrades}\n\nParameters:\nSL: ${best.params.slSize}\nTP: ${best.params.tpSize}\nTS: ${best.params.tsSize}`);
};

// Export parameters
const exportParams = () => {
  const data = {
    paramSets: savedParamSets,
    results: backtestResults,
    exportedAt: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backtest_params_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Import parameters
const importParams = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.paramSets) {
        savedParamSets = data.paramSets;
        window.savedParamSets = savedParamSets;
      }
      if (data.results) {
        backtestResults = data.results;
        window.backtestResults = backtestResults;
        updateSavedResultsComparison();
      }
      alert(`Imported ${savedParamSets.length} parameter sets and ${backtestResults.length} results!`);
    } catch (err) {
      alert('Error importing file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
};

// Event listeners
document.getElementById('runOptimizedBacktest')?.addEventListener('click', runOptimizedBacktestUI);
document.getElementById('saveParamSet')?.addEventListener('click', saveCurrentParams);
document.getElementById('runAllSavedParams')?.addEventListener('click', runAllSavedParams);
document.getElementById('clearSavedResults')?.addEventListener('click', clearSavedResults);
document.getElementById('runGridSearch')?.addEventListener('click', runGridSearch);
document.getElementById('exportParams')?.addEventListener('click', exportParams);
document.getElementById('importParams')?.addEventListener('click', () => document.getElementById('importParamsInput').click());
document.getElementById('importParamsInput')?.addEventListener('change', importParams);
