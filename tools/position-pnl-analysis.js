/**
 * Proper Position Analysis - By Profit, Not Just Win Rate
 * Account for different TP targets and actual profitability
 */

function analyzePositionsByProfitability(trades) {
  const closed = trades.filter(t => t.closed);

  const positions = {
    A: { trades: [], totalPoints: 0, wins: 0, losses: 0 },
    B: { trades: [], totalPoints: 0, wins: 0, losses: 0 },
    C: { trades: [], totalPoints: 0, wins: 0, losses: 0 }
  };

  closed.forEach(t => {
    const pos = t.posName || 'A';
    if (positions[pos]) {
      positions[pos].trades.push(t);
      positions[pos].totalPoints += (t.pnlPoints || 0);
      if (t.tradeResult === 'WIN') positions[pos].wins++;
      else if (t.tradeResult === 'LOSS') positions[pos].losses++;
    }
  });

  const analysis = {};

  Object.keys(positions).forEach(pos => {
    const p = positions[pos];
    const count = p.trades.length;
    const avgPoints = count > 0 ? (p.totalPoints / count).toFixed(6) : 0;
    const winRate = count > 0 ? ((p.wins / count) * 100).toFixed(2) : 0;

    const winners = p.trades.filter(t => t.tradeResult === 'WIN');
    const losers = p.trades.filter(t => t.tradeResult === 'LOSS');

    const avgWin = winners.length > 0
      ? (winners.reduce((sum, t) => sum + (t.pnlPoints || 0), 0) / winners.length).toFixed(6)
      : 0;

    const avgLoss = losers.length > 0
      ? (losers.reduce((sum, t) => sum + (t.pnlPoints || 0), 0) / losers.length).toFixed(6)
      : 0;

    analysis[pos] = {
      count,
      wins: p.wins,
      losses: p.losses,
      winRate: winRate + '%',
      totalPnLPoints: p.totalPoints.toFixed(2),
      avgPointsPerTrade: avgPoints,
      avgWinPoints: avgWin,
      avgLossPoints: avgLoss,
      profitFactor: avgLoss !== 0 ? (Math.abs(avgWin) / Math.abs(avgLoss)).toFixed(2) : 'N/A'
    };
  });

  return analysis;
}

// Run it
const posAnalysis = analyzePositionsByProfitability(window.ordersHistory);

console.log('%c=== POSITION ANALYSIS BY PROFITABILITY (NOT WIN RATE) ===', 'font-size: 14px; font-weight: bold; color: #667eea;');
console.table(posAnalysis);

// Summary
console.log('%c=== KEY INSIGHT ===', 'font-size: 12px; font-weight: bold; color: #ff6f00;');
const posA = posAnalysis.A;
const posB = posAnalysis.B;
const posC = posAnalysis.C;

console.log(`Position A: ${posA.wins}W/${posA.losses}L (${posA.winRate}) | Total: ${posA.totalPnLPoints} pts | Avg: ${posA.avgPointsPerTrade} pts/trade`);
console.log(`Position B: ${posB.wins}W/${posB.losses}L (${posB.winRate}) | Total: ${posB.totalPnLPoints} pts | Avg: ${posB.avgPointsPerTrade} pts/trade`);
console.log(`Position C: ${posC.wins}W/${posC.losses}L (${posC.winRate}) | Total: ${posC.totalPnLPoints} pts | Avg: ${posC.avgPointsPerTrade} pts/trade`);

console.log('\n%c💡 ANALYSIS:', 'font-weight: bold; color: #ff6f00;');
console.log('Position C has HIGH win rate (43.64%) BUT:');
console.log('  ❌ Smaller TP (0.5R) = easier to hit');
console.log('  ❌ Check actual points generated - might be lowest!');
console.log('');
console.log('Position A has LOW win rate (29.77%) BUT:');
console.log('  ✓ Larger TP (1.0R) = harder to hit');
console.log('  ✓ When it wins, it wins BIG - check avgWinPoints');
console.log('');
console.log('VERDICT: Allocate based on TOTAL POINTS GENERATED, not win rate!');
