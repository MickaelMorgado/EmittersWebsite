// ========================================
// HYTEK TRADING SYSTEM - SIMPLIFIED VERSION
// Entry: 9/21 EMA Crossover
// Grid Search: SL, TP, TS only
// ========================================

// ===== GLOBAL STATE =====
let cachedCSVData = [];
let cachedFileInfo = null;
let cachedFile = null;
let backtestResults = [];
window.backtestResults = backtestResults;

// ===== ENUMS =====
const EnumMT5OHLC = { DATE: 0, TIME: 1, OPEN: 2, HIGH: 3, LOW: 4, CLOSE: 5, TICK_VOLUME: 6 };
const EnumDirection = { BULL: 'BULL', BEAR: 'BEAR' };
const EnumTradeResult = { WIN: 'WIN', LOSS: 'LOSS', BE: 'BE' };
const EnumclosedOrderType = { PENDING: 'PENDING', CLOSED_BY_TP: 'CLOSED_BY_TP', CLOSED_BY_SL: 'CLOSED_BY_SL' };

// ===== DOM REFERENCES =====
const $csvFileInput = document.getElementById('csvFileInput');
const $csvRefresh = document.getElementById('csvRefresh');
const $SLPointsInput = document.getElementById('SLPoints');
const $TPPointsInput = document.getElementById('TPPoints');
const $TSIncrementInput = document.getElementById('TSIncrement');
const $CommissionSizeInput = document.getElementById('CommissionSize');
const $backtestingPlayPause = document.getElementById('backtestingPlayPause');
const $backtestingNext = document.getElementById('backtestingNext');
const $backtestingStop = document.getElementById('backtestingStop');
const $fastBacktestMode = document.getElementById('fastBacktestMode');
const $firstDate = document.getElementById('firstDate');
const $lastDate = document.getElementById('lastDate');
const $textareaHistoricalTradesLines = document.getElementById('textareaHistoricalTradesLines');
const $backTestingResult = document.getElementById('backtestingResult');
const $resultPanel = document.getElementById('result-panel');
const $toolbarToggler = document.getElementById('toolbar-toggler');
const $resultPanelToolbarContentTogglerAlgo = document.getElementById('result-panel-toolbar-content-toggler-algo');
const $resultPanelToolbarContentTogglerAlgoEditor = document.getElementById('result-panel-toolbar-content-toggler-algo-editor');
const $resultPanelCollapseBtn = document.getElementById('result-panel-collapse-btn');

// ===== PARAMETERS =====
const getCurrentParams = () => ({
  slSize: parseFloat($SLPointsInput?.value) || 0.0005,
  tpSize: parseFloat($TPPointsInput?.value) || 0.008,
  tsSize: parseFloat($TSIncrementInput?.value) || 0,
  commissionSize: parseFloat($CommissionSizeInput?.value) || 0.00003,
});

// ===== EMA CALCULATION =====
const calcEMA = (closes, period, prevEma = null) => {
  if (closes.length < period) return prevEma || closes[closes.length - 1];

  const multiplier = 2 / (period + 1);
  let ema;

  if (prevEma === null) {
    let sum = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      sum += closes[i];
    }
    ema = sum / period;
  } else {
    const currentClose = closes[closes.length - 1];
    ema = currentClose * multiplier + prevEma * (1 - multiplier);
  }
  return ema;
};

// ===== CROSSOVER DETECTION =====
const checkEmaCrossover = (ema9Buffer, ema21Buffer) => {
  if (ema9Buffer.length < 2 || ema21Buffer.length < 2) return null;

  const curr9 = ema9Buffer[ema9Buffer.length - 1];
  const curr21 = ema21Buffer[ema21Buffer.length - 1];
  const prev9 = ema9Buffer[ema9Buffer.length - 2];
  const prev21 = ema21Buffer[ema21Buffer.length - 2];

  const currAbove = curr9 > curr21;
  const prevAbove = prev9 > prev21;

  if (!prevAbove && currAbove) return 'BULL';
  if (prevAbove && !currAbove) return 'BEAR';
  return null;
};

// ===== SIMPLIFIED BACKTEST ENGINE =====
const runOptimizedBacktest = (params, csvRows) => {
  const ordersHistory = [];
  let candlesFromBuffer = [];
  let ema9Buffer = [];
  let ema21Buffer = [];
  let tradeCount = 0;

  const slSize = params.slSize;
  const tpSize = params.tpSize;
  const tsSize = params.tsSize;

  // Main loop: process each candle
  csvRows.forEach((row, idx) => {
    if (!row[EnumMT5OHLC.OPEN]) return;

    // Skip flat candles
    if (row[EnumMT5OHLC.OPEN] === row[EnumMT5OHLC.HIGH] &&
        row[EnumMT5OHLC.HIGH] === row[EnumMT5OHLC.LOW] &&
        row[EnumMT5OHLC.LOW] === row[EnumMT5OHLC.CLOSE]) return;

    // Keep buffer of last 100 candles
    if (candlesFromBuffer.length >= 100) candlesFromBuffer.shift();
    candlesFromBuffer.push(row);

    // Calculate EMAs
    if (candlesFromBuffer.length >= 21) {
      const closes = candlesFromBuffer.map(c => Number(c[EnumMT5OHLC.CLOSE]));

      const prevEma9 = ema9Buffer.length > 0 ? ema9Buffer[ema9Buffer.length - 1] : null;
      const ema9 = calcEMA(closes, 9, prevEma9);
      ema9Buffer.push(ema9);

      const prevEma21 = ema21Buffer.length > 0 ? ema21Buffer[ema21Buffer.length - 1] : null;
      const ema21 = calcEMA(closes, 21, prevEma21);
      ema21Buffer.push(ema21);

      // Check for crossover
      const crossoverDir = checkEmaCrossover(ema9Buffer, ema21Buffer);
      if (crossoverDir) {
        const entryPrice = Number(row[EnumMT5OHLC.OPEN]);
        ordersHistory.push({
          id: tradeCount + 1,
          time: `${row[EnumMT5OHLC.DATE]} ${row[EnumMT5OHLC.TIME]}`,
          price: entryPrice,
          direction: crossoverDir,
          sl: crossoverDir === 'BULL' ? entryPrice - slSize : entryPrice + slSize,
          tp: crossoverDir === 'BULL' ? entryPrice + tpSize : entryPrice - tpSize,
          trailingStop: false,
          closed: false,
          closedOrderType: 'PENDING',
          tradeResult: null,
        });
        tradeCount++;
      }
    }

    // Check active orders for TP/SL
    ordersHistory.filter(o => !o.closed).forEach(order => {
      const high = Number(row[EnumMT5OHLC.HIGH]);
      const low = Number(row[EnumMT5OHLC.LOW]);
      const close = Number(row[EnumMT5OHLC.CLOSE]);

      let hitTP = false, hitSL = false;

      if (order.direction === 'BULL') {
        hitTP = high >= order.tp;
        hitSL = low <= order.sl;
      } else {
        hitTP = low <= order.tp;
        hitSL = high >= order.sl;
      }

      // Trailing stop
      if (tsSize > 0 && !order.trailingStop) {
        const currentR = order.direction === 'BULL'
          ? (close - order.price) / slSize
          : (order.price - close) / slSize;
        if (currentR >= 1.0) order.trailingStop = true;
      }

      if (order.trailingStop && tsSize > 0) {
        if (order.direction === 'BULL') {
          const newSL = close - tsSize;
          if (newSL > order.sl) order.sl = newSL;
        } else {
          const newSL = close + tsSize;
          if (newSL < order.sl) order.sl = newSL;
        }
      }

      // Close order
      if (hitTP) {
        order.closed = true;
        order.closedOrderType = 'CLOSED_BY_TP';
        order.tradeResult = 'WIN';
        order.closePrice = order.direction === 'BULL' ? order.tp : order.tp;
      } else if (hitSL) {
        order.closed = true;
        order.closedOrderType = 'CLOSED_BY_SL';
        order.tradeResult = 'LOSS';
        order.closePrice = order.sl;
      }
    });
  });

  // Calculate stats
  const closedOrders = ordersHistory.filter(o => o.closed);
  const wins = closedOrders.filter(o => o.tradeResult === 'WIN').length;
  const losses = closedOrders.filter(o => o.tradeResult === 'LOSS').length;
  const totalTrades = closedOrders.length;

  let totalWinPips = 0, totalLossPips = 0, moneyEquivalent = 0, winRate = 0, profitFactor = 1;

  if (totalTrades > 0) {
    closedOrders.forEach(o => {
      const pips = o.direction === 'BULL'
        ? (o.closePrice - o.price) / 0.0001
        : (o.price - o.closePrice) / 0.0001;
      if (o.tradeResult === 'WIN') totalWinPips += pips;
      else totalLossPips += Math.abs(pips);
    });

    winRate = (wins / totalTrades) * 100;
    profitFactor = totalLossPips > 0 ? totalWinPips / totalLossPips : totalWinPips > 0 ? 999 : 1;
    moneyEquivalent = totalWinPips * 10 - totalLossPips * 10;
  }

  return {
    params: params,
    name: params.name || 'backtest',
    totalTrades: totalTrades,
    wins: wins,
    losses: losses,
    winRate: winRate.toFixed(2),
    profitFactor: profitFactor.toFixed(2),
    moneyEquivalent: moneyEquivalent.toFixed(2),
    ordersHistory: ordersHistory,
  };
};

// ===== GRID SEARCH =====
const runGridSearch = async () => {
  if (cachedCSVData.length === 0) {
    alert('Please load and run backtest first.');
    return;
  }

  if (!confirm('Run parameter optimization? (This finds best SL/TP/TS combination)')) return;

  document.getElementById('loading-element').classList.add('visible');
  document.getElementById('loading-element').querySelector('.loading-text').textContent = 'Optimizing...';

  backtestResults = [];

  const ranges = {
    slSize: { min: 0.0005, max: 0.003, step: 0.0005 },
    tpSize: { min: 0.001, max: 0.01, step: 0.001 },
    tsSize: { min: 0, max: 0.002, step: 0.0001 },
  };

  // Phase 1: Random search
  let bestResult = null, bestProfit = -Infinity;
  for (let i = 0; i < 50; i++) {
    const params = {
      slSize: Math.round((ranges.slSize.min + Math.random() * (ranges.slSize.max - ranges.slSize.min)) / ranges.slSize.step) * ranges.slSize.step,
      tpSize: Math.round((ranges.tpSize.min + Math.random() * (ranges.tpSize.max - ranges.tpSize.min)) / ranges.tpSize.step) * ranges.tpSize.step,
      tsSize: Math.round((ranges.tsSize.min + Math.random() * (ranges.tsSize.max - ranges.tsSize.min)) / ranges.tsSize.step) * ranges.tsSize.step,
      name: `Random_${i + 1}`,
    };

    const result = runOptimizedBacktest(params, cachedCSVData);
    backtestResults.push(result);

    const profit = parseFloat(result.moneyEquivalent);
    if (profit > bestProfit) {
      bestProfit = profit;
      bestResult = result;
    }

    document.getElementById('loading-element').querySelector('.loading-text').textContent =
      `Random search ${i + 1}/50 - Best: $${bestProfit.toFixed(2)}`;
    if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 1));
  }

  // Phase 2: Hill climbing
  let currentBest = { ...bestResult.params };
  let currentProfit = bestProfit;

  for (let iter = 0; iter < 30; iter++) {
    let foundBetter = false;

    const tests = [
      { param: 'slSize', delta: ranges.slSize.step },
      { param: 'slSize', delta: -ranges.slSize.step },
      { param: 'tpSize', delta: ranges.tpSize.step },
      { param: 'tpSize', delta: -ranges.tpSize.step },
      { param: 'tsSize', delta: ranges.tsSize.step },
      { param: 'tsSize', delta: -ranges.tsSize.step },
    ];

    for (const test of tests) {
      const newParams = {
        ...currentBest,
        [test.param]: Math.max(ranges[test.param].min, Math.min(ranges[test.param].max, currentBest[test.param] + test.delta)),
        name: `Hill_${iter}_${test.param}`,
      };

      const result = runOptimizedBacktest(newParams, cachedCSVData);
      backtestResults.push(result);

      const profit = parseFloat(result.moneyEquivalent);
      if (profit > currentProfit + 1) {
        currentBest = { ...newParams };
        currentProfit = profit;
        foundBetter = true;
        break;
      }
    }

    document.getElementById('loading-element').querySelector('.loading-text').textContent =
      `Hill climbing ${iter + 1}/30 - Best: $${currentProfit.toFixed(2)}`;

    if (!foundBetter) break;
    if (iter % 3 === 0) await new Promise(resolve => setTimeout(resolve, 1));
  }

  document.getElementById('loading-element').classList.remove('visible');

  const sorted = [...backtestResults].sort((a, b) => parseFloat(b.moneyEquivalent) - parseFloat(a.moneyEquivalent));
  const best = sorted[0];

  alert(
    `Best Found!\n\n` +
    `Profit: $${best.moneyEquivalent}\n` +
    `Win Rate: ${best.winRate}%\n` +
    `Trades: ${best.totalTrades}\n` +
    `Profit Factor: ${best.profitFactor}\n\n` +
    `SL: ${(best.params.slSize / 0.0001).toFixed(0)} pips\n` +
    `TP: ${(best.params.tpSize / 0.0001).toFixed(0)} pips\n` +
    `TS: ${(best.params.tsSize / 0.0001).toFixed(0)} pips`
  );
};

// ===== FILE HANDLING =====
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
      if ($firstDate) $firstDate.textContent = cachedFileInfo.firstDate;
      if ($lastDate) $lastDate.textContent = cachedFileInfo.lastDate;
      resolve(cachedCSVData);
    },
    error: reject,
  });
});

const runBacktest = async () => {
  if (cachedCSVData.length === 0) {
    alert('Please load CSV first');
    return;
  }

  const params = getCurrentParams();
  const result = runOptimizedBacktest(params, cachedCSVData);

  let html = `<h3>Backtest Results</h3>
    <table style="width:100%; border-collapse: collapse;">
      <tr><td>Total Trades:</td><td><strong>${result.totalTrades}</strong></td></tr>
      <tr><td>Wins / Losses:</td><td><strong>${result.wins} / ${result.losses}</strong></td></tr>
      <tr><td>Win Rate:</td><td><strong>${result.winRate}%</strong></td></tr>
      <tr><td>Profit Factor:</td><td><strong>${result.profitFactor}</strong></td></tr>
      <tr><td>Money Equivalent:</td><td style="color: ${result.moneyEquivalent >= 0 ? 'green' : 'red'};"><strong>$${result.moneyEquivalent}</strong></td></tr>
      <tr><td>SL (pips):</td><td>${(params.slSize / 0.0001).toFixed(0)}</td></tr>
      <tr><td>TP (pips):</td><td>${(params.tpSize / 0.0001).toFixed(0)}</td></tr>
      <tr><td>TS (pips):</td><td>${(params.tsSize / 0.0001).toFixed(0)}</td></tr>
    </table>`;

  if ($backTestingResult) $backTestingResult.innerHTML = html;
  alert(`Backtest complete: ${result.totalTrades} trades, ${result.winRate}% win rate, $${result.moneyEquivalent} profit`);
};

// ===== PANEL MANAGEMENT =====
const revealAlgo = () => {
  if ($resultPanel) {
    $resultPanel.classList.add('active');
    document.querySelectorAll('.result-panel-content')[0].classList.add('h-hide');
    document.querySelectorAll('.result-panel-content')[1].classList.remove('h-hide');
    document.querySelectorAll('.result-panel-content')[2].classList.add('h-hide');
    document.querySelectorAll('.result-panel-content')[3].classList.add('h-hide');
  }
};

const revealAlgoEditor = () => {
  if ($resultPanel) {
    $resultPanel.classList.add('active');
    document.querySelectorAll('.result-panel-content')[0].classList.remove('h-hide');
    document.querySelectorAll('.result-panel-content')[1].classList.add('h-hide');
    document.querySelectorAll('.result-panel-content')[2].classList.add('h-hide');
    document.querySelectorAll('.result-panel-content')[3].classList.add('h-hide');
  }
};

const toggleHeight = () => {
  if (!$resultPanel) return;
  const chartSection = document.querySelector('.chart-section');
  $resultPanel.classList.toggle('active');

  if ($resultPanel.classList.contains('active')) {
    if (chartSection?.classList.contains('chart-collapsed')) {
      $resultPanel.classList.add('full-height');
      if (chartSection) chartSection.style.height = '0px';
    } else {
      $resultPanel.classList.remove('full-height');
      const fullHeight = window.innerHeight;
      const halfHeight = Math.max(500, fullHeight / 2);
      $resultPanel.style.height = `${halfHeight}px`;
      if (chartSection) chartSection.style.height = `${halfHeight}px`;
    }
  } else {
    $resultPanel.classList.remove('full-height');
    $resultPanel.style.height = '';
    if (chartSection) chartSection.style.height = '';
  }
};

// Initialize panel visibility
revealAlgo();

// ===== EVENT LISTENERS =====
$csvFileInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadAndCacheCSV(file);
});

$csvRefresh?.addEventListener('click', () => {
  if (cachedFile) loadAndCacheCSV(cachedFile);
});

document.getElementById('backtestingPlayPause')?.addEventListener('click', runBacktest);
document.getElementById('runGridSearch')?.addEventListener('click', runGridSearch);
$toolbarToggler?.addEventListener('click', toggleHeight);
$resultPanelToolbarContentTogglerAlgo?.addEventListener('click', () => revealAlgo());
$resultPanelToolbarContentTogglerAlgoEditor?.addEventListener('click', () => revealAlgoEditor());
$resultPanelCollapseBtn?.addEventListener('click', () => {
  if ($resultPanel) $resultPanel.classList.remove('active');
});

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'G') {
    e.preventDefault();
    runGridSearch();
  }
});

console.log('✓ Simplified Trading System Loaded');
console.log('✓ Entry: 9/21 EMA Crossover');
console.log('✓ Grid Search: SL/TP/TS only');
console.log('✓ Ready for EA conversion');
