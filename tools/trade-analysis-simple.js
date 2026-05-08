/**
 * Simplified Trade Analysis - Works with trade data only
 * No need for full CSV data
 */

const SimpleTradeAnalysis = {
  analyze(trades) {
    const closed = trades.filter(t => t.closed);

    if (closed.length === 0) {
      console.error('No closed trades');
      return null;
    }

    const wins = closed.filter(t => t.tradeResult === 'WIN');
    const losses = closed.filter(t => t.tradeResult === 'LOSS');

    const analysis = {
      total: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate: (wins.length / closed.length) * 100,

      // By Position
      byPosition: this.analyzeByPosition(closed),

      // By Entry Hour
      byHour: this.analyzeByHour(closed),

      // By Direction
      byDirection: this.analyzeByDirection(closed),

      // By Entry Price Level (high/low in day)
      byPNL: this.analyzeByPNL(closed),

      // Consecutive wins/losses
      streaks: this.analyzeStreaks(closed),

      // Filter suggestions based on patterns
      suggestions: []
    };

    // Generate suggestions
    analysis.suggestions = this.generateSuggestions(analysis, closed);

    return analysis;
  },

  analyzeByPosition(trades) {
    const positions = {};

    trades.forEach(t => {
      const pos = t.posName || 'Unknown';
      if (!positions[pos]) {
        positions[pos] = { trades: [], wins: 0, losses: 0 };
      }
      positions[pos].trades.push(t);
      if (t.tradeResult === 'WIN') positions[pos].wins++;
      else if (t.tradeResult === 'LOSS') positions[pos].losses++;
    });

    const result = {};
    Object.keys(positions).forEach(pos => {
      const p = positions[pos];
      result[pos] = {
        count: p.trades.length,
        wins: p.wins,
        losses: p.losses,
        winRate: ((p.wins / p.trades.length) * 100).toFixed(2)
      };
    });

    return result;
  },

  analyzeByHour(trades) {
    const byHour = {};

    trades.forEach(t => {
      const timeMatch = t.time.match(/(\d{2}):(\d{2})/);
      if (!timeMatch) return;

      const hour = parseInt(timeMatch[1]);
      if (!byHour[hour]) {
        byHour[hour] = { wins: 0, total: 0 };
      }
      byHour[hour].total++;
      if (t.tradeResult === 'WIN') byHour[hour].wins++;
    });

    const result = {};
    Object.keys(byHour).sort((a, b) => a - b).forEach(hour => {
      const h = byHour[hour];
      result[`${hour}:00`] = {
        count: h.total,
        wins: h.wins,
        losses: h.total - h.wins,
        winRate: ((h.wins / h.total) * 100).toFixed(2)
      };
    });

    return result;
  },

  analyzeByDirection(trades) {
    const bull = trades.filter(t => t.direction === 'BULL');
    const bear = trades.filter(t => t.direction === 'BEAR');

    return {
      BULL: {
        count: bull.length,
        wins: bull.filter(t => t.tradeResult === 'WIN').length,
        losses: bull.filter(t => t.tradeResult === 'LOSS').length,
        winRate: ((bull.filter(t => t.tradeResult === 'WIN').length / bull.length) * 100).toFixed(2)
      },
      BEAR: {
        count: bear.length,
        wins: bear.filter(t => t.tradeResult === 'WIN').length,
        losses: bear.filter(t => t.tradeResult === 'LOSS').length,
        winRate: ((bear.filter(t => t.tradeResult === 'WIN').length / bear.length) * 100).toFixed(2)
      }
    };
  },

  analyzeByPNL(trades) {
    const winners = trades.filter(t => t.tradeResult === 'WIN');
    const losers = trades.filter(t => t.tradeResult === 'LOSS');

    const avgWin = winners.length > 0
      ? (winners.reduce((sum, t) => sum + (t.pnlPoints || 0), 0) / winners.length).toFixed(6)
      : 0;

    const avgLoss = losers.length > 0
      ? (losers.reduce((sum, t) => sum + (t.pnlPoints || 0), 0) / losers.length).toFixed(6)
      : 0;

    const totalPnL = trades.reduce((sum, t) => sum + (t.pnlPoints || 0), 0).toFixed(2);
    const profitFactor = avgLoss !== 0 ? (Math.abs(avgWin) / Math.abs(avgLoss)).toFixed(2) : 0;

    return {
      avgWinPoints: avgWin,
      avgLossPoints: avgLoss,
      totalPnLPoints: totalPnL,
      profitFactor: profitFactor,
      expectancy: ((winners.length * avgWin + losers.length * avgLoss) / trades.length).toFixed(6)
    };
  },

  analyzeStreaks(trades) {
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    trades.forEach(t => {
      if (t.tradeResult === 'WIN') {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      }
    });

    return {
      maxConsecutiveWins,
      maxConsecutiveLosses
    };
  },

  generateSuggestions(analysis, trades) {
    const suggestions = [];

    // Check position performance
    const posWinRates = Object.entries(analysis.byPosition).map(([pos, data]) => ({
      pos,
      rate: parseFloat(data.winRate)
    }));

    const bestPos = posWinRates.reduce((a, b) => a.rate > b.rate ? a : b);
    const worstPos = posWinRates.reduce((a, b) => a.rate < b.rate ? a : b);

    if (bestPos.rate - worstPos.rate > 10) {
      suggestions.push({
        type: 'POSITION_FILTER',
        priority: 'HIGH',
        title: `Focus on Position ${bestPos.pos}`,
        description: `Position ${bestPos.pos} has ${bestPos.rate.toFixed(2)}% win rate vs ${worstPos.rate.toFixed(2)}% for Position ${worstPos.pos}`,
        impact: `Could improve win rate by focusing on best-performing position type`,
        detail: `Current: ${bestPos.pos}=${bestPos.rate.toFixed(2)}% | ${worstPos.pos}=${worstPos.rate.toFixed(2)}%`
      });
    }

    // Check time of day
    const hourlyRates = Object.entries(analysis.byHour)
      .map(([hour, data]) => ({
        hour,
        rate: parseFloat(data.winRate),
        count: data.count
      }))
      .filter(h => h.count >= 2); // Only hours with 2+ trades

    if (hourlyRates.length > 1) {
      const bestHour = hourlyRates.reduce((a, b) => a.rate > b.rate ? a : b);
      const worstHour = hourlyRates.reduce((a, b) => a.rate < b.rate ? a : b);

      if (bestHour.rate - worstHour.rate > 15) {
        suggestions.push({
          type: 'TIME_FILTER',
          priority: 'HIGH',
          title: `Trade only during optimal hours`,
          description: `Best hour: ${bestHour.hour} at ${bestHour.rate.toFixed(2)}% win rate | Worst: ${worstHour.hour} at ${worstHour.rate.toFixed(2)}%`,
          impact: `Could eliminate low-probability hours and improve overall win rate`,
          detail: `Focus on hours with >40% win rate, avoid hours with <30%`
        });
      }
    }

    // Check direction bias
    const bullRate = parseFloat(analysis.byDirection.BULL.winRate);
    const bearRate = parseFloat(analysis.byDirection.BEAR.winRate);

    if (Math.abs(bullRate - bearRate) > 12) {
      const better = bullRate > bearRate ? 'BULL' : 'BEAR';
      suggestions.push({
        type: 'DIRECTION_FILTER',
        priority: 'MEDIUM',
        title: `Prefer ${better} direction signals`,
        description: `${better} trades: ${Math.max(bullRate, bearRate).toFixed(2)}% | ${better === 'BULL' ? 'BEAR' : 'BULL'} trades: ${Math.min(bullRate, bearRate).toFixed(2)}%`,
        impact: `Could improve consistency by trading only preferred direction`,
        detail: `Current performance bias suggests one direction is more favorable`
      });
    }

    // Check profit factor
    const pf = parseFloat(analysis.byPNL.profitFactor);
    if (pf < 1.0) {
      suggestions.push({
        type: 'PROFITABILITY_ANALYSIS',
        priority: 'HIGH',
        title: `Strategy is unprofitable (PF: ${pf})`,
        description: `Average winner (${analysis.byPNL.avgWinPoints}pts) < Average loser (${Math.abs(analysis.byPNL.avgLossPoints)}pts)`,
        impact: `Need to improve TP/SL ratios or increase win rate above breakeven`,
        detail: `Current profit factor ${pf} means you lose money on average. Need PF > 1.2 for consistency.`
      });
    }

    return suggestions;
  }
};

window.SimpleTradeAnalysis = SimpleTradeAnalysis;
