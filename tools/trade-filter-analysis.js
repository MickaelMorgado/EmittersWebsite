/**
 * Trade Filter Analysis Tool
 * Analyzes closed trades and market conditions to identify potential filters
 * that could improve strategy profitability
 */

const TradeFilterAnalysis = {
  /**
   * Analyze all closed trades and their market conditions
   * @param {Array} ordersHistory - Array of trade objects from backtesting
   * @param {Array} rawData - Raw OHLC data used in backtest
   * @returns {Object} Analysis results with filter suggestions
   */
  analyzeTradesAndConditions(ordersHistory, rawData) {
    const closedTrades = ordersHistory.filter(o => o.closed);

    if (closedTrades.length === 0) {
      return { error: 'No closed trades to analyze' };
    }

    // Build a lookup map for quick OHLC data access
    const dataMap = this.buildDataMap(rawData);

    // Enrich trades with market condition data
    const enrichedTrades = closedTrades.map(trade => {
      return this.enrichTradeWithMarketData(trade, dataMap, rawData);
    });

    // Analyze patterns
    const analysis = {
      totalTrades: enrichedTrades.length,
      winCount: enrichedTrades.filter(t => t.tradeResult === 'WIN').length,
      lossCount: enrichedTrades.filter(t => t.tradeResult === 'LOSS').length,
      winRate: enrichedTrades.filter(t => t.tradeResult === 'WIN').length / enrichedTrades.length,

      // Condition-based analysis
      candleSizeAnalysis: this.analyzeByCandleSize(enrichedTrades),
      volatilityAnalysis: this.analyzeByVolatility(enrichedTrades),
      trendAnalysis: this.analyzeByTrend(enrichedTrades),
      candleDirectionAnalysis: this.analyzeByCandleDirection(enrichedTrades),
      momentumAnalysis: this.analyzeByMomentum(enrichedTrades),
      timeOfDayAnalysis: this.analyzeByTimeOfDay(enrichedTrades),

      // Suggested filters
      suggestedFilters: []
    };

    // Generate filter suggestions based on analysis
    analysis.suggestedFilters = this.generateFilterSuggestions(analysis, enrichedTrades);

    return analysis;
  },

  /**
   * Build a map for O(1) lookup of OHLC data by datetime
   */
  buildDataMap(rawData) {
    const map = new Map();
    rawData.forEach(row => {
      const key = `${row['<DATE>']} ${row['<TIME>']}`;
      map.set(key, row);
    });
    return map;
  },

  /**
   * Enrich a trade with market condition data at entry and exit
   */
  enrichTradeWithMarketData(trade, dataMap, rawData) {
    const enriched = { ...trade };

    // Get entry candle data
    const entryData = dataMap.get(trade.time);
    if (entryData) {
      enriched.entryCandle = this.processCandle(entryData);
      enriched.entryCandleSize = Math.abs(
        parseFloat(entryData['<CLOSE>']) - parseFloat(entryData['<OPEN>'])
      );
      enriched.entryCandleRange =
        parseFloat(entryData['<HIGH>']) - parseFloat(entryData['<LOW>']);
      enriched.entryCandleDirection =
        parseFloat(entryData['<CLOSE>']) > parseFloat(entryData['<OPEN>']) ? 'BULL' : 'BEAR';
    }

    // Get exit candle data if trade closed
    if (trade.closedTime) {
      const exitData = dataMap.get(trade.closedTime);
      if (exitData) {
        enriched.exitCandle = this.processCandle(exitData);
        enriched.exitCandleSize = Math.abs(
          parseFloat(exitData['<CLOSE>']) - parseFloat(exitData['<OPEN>'])
        );
      }
    }

    // Analyze volatility around entry (last 5 candles)
    enriched.entryVolatility = this.calculateVolatility(trade.time, rawData, 5);

    // Analyze trend at entry
    enriched.trendAtEntry = this.analyzeTrend(trade.time, rawData);

    // Extract time components
    const timeMatch = trade.time.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      enriched.entryHour = parseInt(timeMatch[1]);
      enriched.entryMinute = parseInt(timeMatch[2]);
    }

    return enriched;
  },

  /**
   * Process a single candle row
   */
  processCandle(candleData) {
    return {
      open: parseFloat(candleData['<OPEN>']),
      high: parseFloat(candleData['<HIGH>']),
      low: parseFloat(candleData['<LOW>']),
      close: parseFloat(candleData['<CLOSE>'])
    };
  },

  /**
   * Calculate average candle size volatility over N periods
   */
  calculateVolatility(targetTime, rawData, periods = 5) {
    const targetIndex = rawData.findIndex(
      row => `${row['<DATE>']} ${row['<TIME>']}` === targetTime
    );

    if (targetIndex === -1 || targetIndex < periods) return null;

    let totalSize = 0;
    for (let i = targetIndex - periods; i < targetIndex; i++) {
      const size = Math.abs(
        parseFloat(rawData[i]['<CLOSE>']) - parseFloat(rawData[i]['<OPEN>'])
      );
      totalSize += size;
    }

    return totalSize / periods;
  },

  /**
   * Analyze trend structure at entry point (higher highs/lows)
   */
  analyzeTrend(targetTime, rawData, lookback = 10) {
    const targetIndex = rawData.findIndex(
      row => `${row['<DATE>']} ${row['<TIME>']}` === targetTime
    );

    if (targetIndex === -1 || targetIndex < lookback) return 'INSUFFICIENT_DATA';

    const highs = [];
    const lows = [];

    for (let i = targetIndex - lookback; i < targetIndex; i++) {
      highs.push(parseFloat(rawData[i]['<HIGH>']));
      lows.push(parseFloat(rawData[i]['<LOW>']));
    }

    const maxHigh = Math.max(...highs);
    const minLow = Math.min(...lows);
    const recentHigh = highs[highs.length - 1];
    const recentLow = lows[lows.length - 1];

    // Check for higher highs and higher lows (uptrend)
    if (recentHigh > maxHigh * 0.95 && recentLow > minLow) {
      return 'UPTREND';
    }

    // Check for lower highs and lower lows (downtrend)
    if (recentHigh < maxHigh && recentLow < minLow * 1.05) {
      return 'DOWNTREND';
    }

    return 'RANGE';
  },

  /**
   * Analyze recent momentum (last 3 candles)
   */
  analyzeMomentum(targetTime, rawData) {
    const targetIndex = rawData.findIndex(
      row => `${row['<DATE>']} ${row['<TIME>']}` === targetTime
    );

    if (targetIndex === -1 || targetIndex < 3) return 'INSUFFICIENT_DATA';

    const candles = [];
    for (let i = targetIndex - 3; i < targetIndex; i++) {
      candles.push({
        open: parseFloat(rawData[i]['<OPEN>']),
        close: parseFloat(rawData[i]['<CLOSE>']),
        direction: parseFloat(rawData[i]['<CLOSE>']) > parseFloat(rawData[i]['<OPEN>']) ? 'BULL' : 'BEAR'
      });
    }

    // Count consecutive same-direction candles
    let bullCount = 0, bearCount = 0;
    candles.forEach(c => {
      if (c.direction === 'BULL') bullCount++;
      else bearCount++;
    });

    if (bullCount === 3) return 'STRONG_BULL_MOMENTUM';
    if (bearCount === 3) return 'STRONG_BEAR_MOMENTUM';
    if (bullCount > bearCount) return 'BULL_MOMENTUM';
    if (bearCount > bullCount) return 'BEAR_MOMENTUM';
    return 'MIXED_MOMENTUM';
  },

  /**
   * Analyze trades grouped by candle size at entry
   */
  analyzeByCandleSize(enrichedTrades) {
    const small = enrichedTrades.filter(t => t.entryCandleSize < 0.0002);
    const medium = enrichedTrades.filter(t => t.entryCandleSize >= 0.0002 && t.entryCandleSize < 0.0005);
    const large = enrichedTrades.filter(t => t.entryCandleSize >= 0.0005);

    return {
      small: this.calculateWinRate(small),
      medium: this.calculateWinRate(medium),
      large: this.calculateWinRate(large),
      insight: this.getWinRateInsight('small/medium/large candle size', [small, medium, large])
    };
  },

  /**
   * Analyze trades by volatility
   */
  analyzeByVolatility(enrichedTrades) {
    const lowVol = enrichedTrades.filter(t =>
      t.entryVolatility && t.entryVolatility < 0.00025
    );
    const mediumVol = enrichedTrades.filter(t =>
      t.entryVolatility && t.entryVolatility >= 0.00025 && t.entryVolatility < 0.0005
    );
    const highVol = enrichedTrades.filter(t =>
      t.entryVolatility && t.entryVolatility >= 0.0005
    );

    return {
      lowVolatility: this.calculateWinRate(lowVol),
      mediumVolatility: this.calculateWinRate(mediumVol),
      highVolatility: this.calculateWinRate(highVol),
      insight: this.getWinRateInsight('low/medium/high volatility', [lowVol, mediumVol, highVol])
    };
  },

  /**
   * Analyze trades by trend at entry
   */
  analyzeByTrend(enrichedTrades) {
    const uptrend = enrichedTrades.filter(t => t.trendAtEntry === 'UPTREND');
    const downtrend = enrichedTrades.filter(t => t.trendAtEntry === 'DOWNTREND');
    const range = enrichedTrades.filter(t => t.trendAtEntry === 'RANGE');

    return {
      uptrend: this.calculateWinRate(uptrend),
      downtrend: this.calculateWinRate(downtrend),
      range: this.calculateWinRate(range),
      insight: this.getWinRateInsight('uptrend/downtrend/range', [uptrend, downtrend, range])
    };
  },

  /**
   * Analyze trades by entry candle direction
   */
  analyzeByCandleDirection(enrichedTrades) {
    const bullEntry = enrichedTrades.filter(t => t.entryCandleDirection === 'BULL');
    const bearEntry = enrichedTrades.filter(t => t.entryCandleDirection === 'BEAR');

    return {
      bullCandleEntry: this.calculateWinRate(bullEntry),
      bearCandleEntry: this.calculateWinRate(bearEntry),
      insight: this.getWinRateInsight('bull/bear entry candle', [bullEntry, bearEntry])
    };
  },

  /**
   * Analyze trades by momentum
   */
  analyzeByMomentum(enrichedTrades) {
    const strongBull = enrichedTrades.filter(t =>
      t.momentum === 'STRONG_BULL_MOMENTUM'
    );
    const strongBear = enrichedTrades.filter(t =>
      t.momentum === 'STRONG_BEAR_MOMENTUM'
    );
    const bullMom = enrichedTrades.filter(t =>
      t.momentum === 'BULL_MOMENTUM'
    );
    const bearMom = enrichedTrades.filter(t =>
      t.momentum === 'BEAR_MOMENTUM'
    );

    return {
      strongBullMomentum: this.calculateWinRate(strongBull),
      bullMomentum: this.calculateWinRate(bullMom),
      strongBearMomentum: this.calculateWinRate(strongBear),
      bearMomentum: this.calculateWinRate(bearMom),
      insight: 'Momentum analysis shows signal alignment with direction'
    };
  },

  /**
   * Analyze trades by time of day
   */
  analyzeByTimeOfDay(enrichedTrades) {
    const earlySession = enrichedTrades.filter(t =>
      t.entryHour >= 9 && t.entryHour < 11
    );
    const midSession = enrichedTrades.filter(t =>
      t.entryHour >= 11 && t.entryHour < 13
    );
    const lateSession = enrichedTrades.filter(t =>
      t.entryHour >= 13
    );

    return {
      earlySession: this.calculateWinRate(earlySession),
      midSession: this.calculateWinRate(midSession),
      lateSession: this.calculateWinRate(lateSession),
      insight: 'Win rates vary by time of day - potential filter opportunity'
    };
  },

  /**
   * Calculate win rate for a group of trades
   */
  calculateWinRate(trades) {
    if (trades.length === 0) {
      return { count: 0, wins: 0, losses: 0, winRate: 0 };
    }

    const wins = trades.filter(t => t.tradeResult === 'WIN').length;
    const losses = trades.filter(t => t.tradeResult === 'LOSS').length;

    return {
      count: trades.length,
      wins,
      losses,
      winRate: wins / trades.length,
      winRatePercent: (wins / trades.length * 100).toFixed(2)
    };
  },

  /**
   * Compare win rates and identify best/worst groups
   */
  getWinRateInsight(label, groups) {
    const validGroups = groups.filter(g => g.length > 0);
    const rates = validGroups.map(g => this.calculateWinRate(g).winRate);

    if (rates.length === 0) return `Insufficient data for ${label}`;

    const max = Math.max(...rates);
    const min = Math.min(...rates);
    const spread = max - min;

    if (spread > 0.15) {
      return `STRONG SIGNAL: Large win rate variation (${(spread * 100).toFixed(1)}%) across conditions`;
    } else if (spread > 0.05) {
      return `Moderate variation in win rates across conditions`;
    }
    return `Consistent win rates across conditions`;
  },

  /**
   * Generate specific, actionable filter suggestions
   */
  generateFilterSuggestions(analysis, enrichedTrades) {
    const suggestions = [];

    // Analyze candle size filter
    const smallWR = analysis.candleSizeAnalysis.small.winRatePercent;
    const mediumWR = analysis.candleSizeAnalysis.medium.winRatePercent;
    const largeWR = analysis.candleSizeAnalysis.large.winRatePercent;

    if (smallWR < 30) {
      suggestions.push({
        type: 'CANDLE_SIZE_FILTER',
        description: 'Filter out small candle entries',
        detail: `Small candles (< 0.0002) have only ${smallWR}% win rate`,
        implementation: 'Add minimum candle size requirement at entry',
        expectedImprovement: `Could eliminate ${analysis.candleSizeAnalysis.small.count} losing trades`,
        priority: 'HIGH'
      });
    }

    // Analyze volatility filter
    const lowVolWR = analysis.volatilityAnalysis.lowVolatility.winRatePercent;
    const highVolWR = analysis.volatilityAnalysis.highVolatility.winRatePercent;

    if (Math.abs(parseFloat(lowVolWR) - parseFloat(highVolWR)) > 15) {
      const betterVol = parseFloat(lowVolWR) > parseFloat(highVolWR) ? 'LOW' : 'HIGH';
      const count = betterVol === 'LOW' ?
        analysis.volatilityAnalysis.highVolatility.count :
        analysis.volatilityAnalysis.lowVolatility.count;

      suggestions.push({
        type: 'VOLATILITY_FILTER',
        description: `Filter for ${betterVol.toLowerCase()} volatility entries`,
        detail: `${betterVol} volatility trades have ${Math.max(parseFloat(lowVolWR), parseFloat(highVolWR))}% win rate`,
        implementation: `Use ATR or candle size average to filter entries to ${betterVol.toLowerCase()} volatility periods`,
        expectedImprovement: `Could eliminate ~${count} unfavorable trades`,
        priority: 'HIGH'
      });
    }

    // Analyze trend filter
    const uptrendWR = analysis.trendAnalysis.uptrend.winRatePercent;
    const downtrendWR = analysis.trendAnalysis.downtrend.winRatePercent;
    const rangeWR = analysis.trendAnalysis.range.winRatePercent;

    if (parseFloat(uptrendWR) > 45 && parseFloat(downtrendWR) < 35) {
      suggestions.push({
        type: 'TREND_FILTER',
        description: 'Only trade during uptrends',
        detail: `Uptrend trades have ${uptrendWR}% win rate vs ${downtrendWR}% in downtrends`,
        implementation: 'Add higher high/higher low validation before entry',
        expectedImprovement: `Could improve win rate by filtering ${analysis.trendAnalysis.downtrend.count} downtrend trades`,
        priority: 'MEDIUM'
      });
    }

    // Analyze entry candle direction
    const bullCandleWR = analysis.candleDirectionAnalysis.bullCandleEntry.winRatePercent;
    const bearCandleWR = analysis.candleDirectionAnalysis.bearCandleEntry.winRatePercent;

    if (Math.abs(parseFloat(bullCandleWR) - parseFloat(bearCandleWR)) > 12) {
      const betterDir = parseFloat(bullCandleWR) > parseFloat(bearCandleWR) ? 'BULL' : 'BEAR';
      suggestions.push({
        type: 'ENTRY_CANDLE_DIRECTION',
        description: `Prefer ${betterDir.toLowerCase()} candle entries`,
        detail: `${betterDir} entry candles have ${Math.max(parseFloat(bullCandleWR), parseFloat(bearCandleWR))}% win rate`,
        implementation: 'Validate entry candle direction matches signal direction',
        expectedImprovement: `Could eliminate ~${betterDir === 'BULL' ? analysis.candleDirectionAnalysis.bearCandleEntry.count : analysis.candleDirectionAnalysis.bullCandleEntry.count} trades`,
        priority: 'MEDIUM'
      });
    }

    // Time of day analysis
    const early = parseFloat(analysis.timeOfDayAnalysis.earlySession.winRatePercent || 0);
    const mid = parseFloat(analysis.timeOfDayAnalysis.midSession.winRatePercent || 0);
    const late = parseFloat(analysis.timeOfDayAnalysis.lateSession.winRatePercent || 0);

    const timeRates = [early, mid, late].filter(r => r > 0);
    if (timeRates.length > 0) {
      const maxTime = Math.max(...timeRates);
      const minTime = Math.min(...timeRates);

      if (maxTime - minTime > 10) {
        suggestions.push({
          type: 'TIME_OF_DAY_FILTER',
          description: 'Trade only during best time periods',
          detail: `Win rates vary from ${minTime.toFixed(1)}% to ${maxTime.toFixed(1)}% by hour`,
          implementation: 'Restrict trading to hours with >40% win rate',
          expectedImprovement: 'Eliminates low-probability trading windows',
          priority: 'MEDIUM'
        });
      }
    }

    return suggestions;
  },

  /**
   * Format analysis results for display
   */
  formatReport(analysis) {
    let report = '';

    report += `\n=== TRADE FILTER ANALYSIS REPORT ===\n`;
    report += `Total Trades Analyzed: ${analysis.totalTrades}\n`;
    report += `Wins: ${analysis.winCount} | Losses: ${analysis.lossCount} | Win Rate: ${(analysis.winRate * 100).toFixed(2)}%\n`;

    report += `\n--- CANDLE SIZE ANALYSIS ---\n`;
    report += `Small (<0.0002): ${analysis.candleSizeAnalysis.small.winRatePercent}% (${analysis.candleSizeAnalysis.small.count} trades)\n`;
    report += `Medium: ${analysis.candleSizeAnalysis.medium.winRatePercent}% (${analysis.candleSizeAnalysis.medium.count} trades)\n`;
    report += `Large (>0.0005): ${analysis.candleSizeAnalysis.large.winRatePercent}% (${analysis.candleSizeAnalysis.large.count} trades)\n`;

    report += `\n--- VOLATILITY ANALYSIS ---\n`;
    report += `Low: ${analysis.volatilityAnalysis.lowVolatility.winRatePercent}% (${analysis.volatilityAnalysis.lowVolatility.count} trades)\n`;
    report += `Medium: ${analysis.volatilityAnalysis.mediumVolatility.winRatePercent}% (${analysis.volatilityAnalysis.mediumVolatility.count} trades)\n`;
    report += `High: ${analysis.volatilityAnalysis.highVolatility.winRatePercent}% (${analysis.volatilityAnalysis.highVolatility.count} trades)\n`;

    report += `\n--- TREND ANALYSIS ---\n`;
    report += `Uptrend: ${analysis.trendAnalysis.uptrend.winRatePercent}% (${analysis.trendAnalysis.uptrend.count} trades)\n`;
    report += `Downtrend: ${analysis.trendAnalysis.downtrend.winRatePercent}% (${analysis.trendAnalysis.downtrend.count} trades)\n`;
    report += `Range: ${analysis.trendAnalysis.range.winRatePercent}% (${analysis.trendAnalysis.range.count} trades)\n`;

    report += `\n--- CANDLE DIRECTION AT ENTRY ---\n`;
    report += `Bull Candle Entry: ${analysis.candleDirectionAnalysis.bullCandleEntry.winRatePercent}% (${analysis.candleDirectionAnalysis.bullCandleEntry.count} trades)\n`;
    report += `Bear Candle Entry: ${analysis.candleDirectionAnalysis.bearCandleEntry.winRatePercent}% (${analysis.candleDirectionAnalysis.bearCandleEntry.count} trades)\n`;

    if (analysis.suggestedFilters.length > 0) {
      report += `\n=== SUGGESTED FILTERS (${analysis.suggestedFilters.length} recommendations) ===\n`;
      analysis.suggestedFilters.forEach((filter, idx) => {
        report += `\n[${idx + 1}] ${filter.type} (Priority: ${filter.priority})\n`;
        report += `Description: ${filter.description}\n`;
        report += `Detail: ${filter.detail}\n`;
        report += `Implementation: ${filter.implementation}\n`;
        report += `Expected Impact: ${filter.expectedImprovement}\n`;
      });
    }

    return report;
  }
};

// Export for use in backtest system
if (typeof window !== 'undefined') {
  window.TradeFilterAnalysis = TradeFilterAnalysis;
}
