/**
 * Browser Console Command - Run Trade Filter Analysis
 *
 * Usage:
 * 1. Open your backtesting system with completed backtest results
 * 2. Open browser Developer Tools (F12 or Right Click → Inspect → Console)
 * 3. Copy and paste this script into the console
 * 4. Press Enter to run
 *
 * Or load it as a script in your HTML before running backtest:
 * <script src="tools/run-analysis-console.js"></script>
 *
 * Then in console, just type: runTradeAnalysis()
 */

async function runTradeAnalysis() {
  console.log('%c🔍 TRADE FILTER ANALYSIS STARTING', 'font-size: 16px; font-weight: bold; color: #667eea;');

  // Check if we have the required data
  if (!window.ordersHistory) {
    console.error('❌ No trades found. Please run a backtest first.');
    return;
  }

  if (!window.cachedCSVData) {
    console.error('❌ No market data found. Please load CSV data first.');
    return;
  }

  const closedTrades = window.ordersHistory.filter(o => o.closed);

  if (closedTrades.length === 0) {
    console.error('❌ No closed trades found.');
    return;
  }

  console.log(`✅ Found ${closedTrades.length} closed trades`);
  console.log(`✅ Found ${window.cachedCSVData.length} candles of market data`);

  // Check if analysis tool is loaded
  if (!window.TradeFilterAnalysis) {
    console.log('%c⚠️ Loading analysis tool...', 'color: #ff9800;');

    // Load the analysis script
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'tools/trade-filter-analysis.js';
      script.onload = () => {
        console.log('✅ Analysis tool loaded');
        performAnalysis();
        resolve();
      };
      document.head.appendChild(script);
    });
  } else {
    performAnalysis();
  }

  function performAnalysis() {
    console.log('%c📊 Analyzing trades...', 'font-size: 14px; font-weight: bold; color: #667eea;');

    const startTime = Date.now();
    const analysis = window.TradeFilterAnalysis.analyzeTradesAndConditions(
      window.ordersHistory,
      window.cachedCSVData
    );
    const duration = Date.now() - startTime;

    console.log(`✅ Analysis complete in ${duration}ms\n`);

    // Display summary
    console.log('%c=== ANALYSIS SUMMARY ===', 'font-size: 14px; font-weight: bold; color: #667eea;');
    console.table({
      'Total Trades': analysis.totalTrades,
      'Winning Trades': analysis.winCount,
      'Losing Trades': analysis.lossCount,
      'Current Win Rate': `${(analysis.winRate * 100).toFixed(2)}%`
    });

    // Candle Size Analysis
    console.log('%c--- CANDLE SIZE ANALYSIS ---', 'font-weight: bold; color: #667eea;');
    console.table({
      'Small (<0.0002)': {
        'Win Rate': `${analysis.candleSizeAnalysis.small.winRatePercent}%`,
        'Count': analysis.candleSizeAnalysis.small.count,
        'Wins': analysis.candleSizeAnalysis.small.wins,
        'Losses': analysis.candleSizeAnalysis.small.losses
      },
      'Medium (0.0002-0.0005)': {
        'Win Rate': `${analysis.candleSizeAnalysis.medium.winRatePercent}%`,
        'Count': analysis.candleSizeAnalysis.medium.count,
        'Wins': analysis.candleSizeAnalysis.medium.wins,
        'Losses': analysis.candleSizeAnalysis.medium.losses
      },
      'Large (>0.0005)': {
        'Win Rate': `${analysis.candleSizeAnalysis.large.winRatePercent}%`,
        'Count': analysis.candleSizeAnalysis.large.count,
        'Wins': analysis.candleSizeAnalysis.large.wins,
        'Losses': analysis.candleSizeAnalysis.large.losses
      }
    });

    // Volatility Analysis
    console.log('%c--- VOLATILITY ANALYSIS ---', 'font-weight: bold; color: #667eea;');
    console.table({
      'Low': {
        'Win Rate': `${analysis.volatilityAnalysis.lowVolatility.winRatePercent}%`,
        'Count': analysis.volatilityAnalysis.lowVolatility.count,
        'Wins': analysis.volatilityAnalysis.lowVolatility.wins,
        'Losses': analysis.volatilityAnalysis.lowVolatility.losses
      },
      'Medium': {
        'Win Rate': `${analysis.volatilityAnalysis.mediumVolatility.winRatePercent}%`,
        'Count': analysis.volatilityAnalysis.mediumVolatility.count,
        'Wins': analysis.volatilityAnalysis.mediumVolatility.wins,
        'Losses': analysis.volatilityAnalysis.mediumVolatility.losses
      },
      'High': {
        'Win Rate': `${analysis.volatilityAnalysis.highVolatility.winRatePercent}%`,
        'Count': analysis.volatilityAnalysis.highVolatility.count,
        'Wins': analysis.volatilityAnalysis.highVolatility.wins,
        'Losses': analysis.volatilityAnalysis.highVolatility.losses
      }
    });

    // Trend Analysis
    console.log('%c--- TREND ANALYSIS ---', 'font-weight: bold; color: #667eea;');
    console.table({
      'Uptrend': {
        'Win Rate': `${analysis.trendAnalysis.uptrend.winRatePercent}%`,
        'Count': analysis.trendAnalysis.uptrend.count,
        'Wins': analysis.trendAnalysis.uptrend.wins,
        'Losses': analysis.trendAnalysis.uptrend.losses
      },
      'Downtrend': {
        'Win Rate': `${analysis.trendAnalysis.downtrend.winRatePercent}%`,
        'Count': analysis.trendAnalysis.downtrend.count,
        'Wins': analysis.trendAnalysis.downtrend.wins,
        'Losses': analysis.trendAnalysis.downtrend.losses
      },
      'Range': {
        'Win Rate': `${analysis.trendAnalysis.range.winRatePercent}%`,
        'Count': analysis.trendAnalysis.range.count,
        'Wins': analysis.trendAnalysis.range.wins,
        'Losses': analysis.trendAnalysis.range.losses
      }
    });

    // Entry Candle Direction Analysis
    console.log('%c--- ENTRY CANDLE DIRECTION ---', 'font-weight: bold; color: #667eea;');
    console.table({
      'Bull Entry': {
        'Win Rate': `${analysis.candleDirectionAnalysis.bullCandleEntry.winRatePercent}%`,
        'Count': analysis.candleDirectionAnalysis.bullCandleEntry.count,
        'Wins': analysis.candleDirectionAnalysis.bullCandleEntry.wins,
        'Losses': analysis.candleDirectionAnalysis.bullCandleEntry.losses
      },
      'Bear Entry': {
        'Win Rate': `${analysis.candleDirectionAnalysis.bearCandleEntry.winRatePercent}%`,
        'Count': analysis.candleDirectionAnalysis.bearCandleEntry.count,
        'Wins': analysis.candleDirectionAnalysis.bearCandleEntry.wins,
        'Losses': analysis.candleDirectionAnalysis.bearCandleEntry.losses
      }
    });

    // Suggested Filters
    if (analysis.suggestedFilters.length > 0) {
      console.log(`%c=== SUGGESTED FILTERS (${analysis.suggestedFilters.length}) ===`, 'font-size: 14px; font-weight: bold; color: #28a745;');

      analysis.suggestedFilters.forEach((filter, idx) => {
        const priorityColor = filter.priority === 'HIGH' ? '#dc3545' : filter.priority === 'MEDIUM' ? '#ff9800' : '#28a745';
        console.log(`%c[${idx + 1}] ${filter.type} (${filter.priority})`, `font-weight: bold; color: ${priorityColor};`);
        console.log(`📌 ${filter.description}`);
        console.log(`📊 ${filter.detail}`);
        console.log(`🔧 Implementation: ${filter.implementation}`);
        console.log(`✨ Expected Impact: ${filter.expectedImprovement}`);
        console.log('---');
      });
    } else {
      console.log('%c⚠️ No specific filter suggestions at this time', 'color: #ff9800;');
    }

    // Store analysis for reference
    window.lastTradeAnalysis = analysis;

    console.log('%c✅ Analysis complete! Results stored in window.lastTradeAnalysis', 'font-size: 12px; color: #28a745;');
    console.log('💡 TIP: You can access the full analysis object with: window.lastTradeAnalysis');
    console.log('💡 TIP: Export formatted report with: window.TradeFilterAnalysis.formatReport(window.lastTradeAnalysis)');

    return analysis;
  }
}

// Make it available globally
window.runTradeAnalysis = runTradeAnalysis;

console.log('%c✅ Trade Analysis Tool Ready', 'font-size: 14px; font-weight: bold; color: #667eea;');
console.log('Type: runTradeAnalysis() to start analysis');
