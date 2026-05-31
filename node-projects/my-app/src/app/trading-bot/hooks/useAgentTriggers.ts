import { useCallback } from 'react';

export interface AgentDecisionTrigger {
  agent: 'trend' | 'risk' | 'news' | 'history' | 'master';
  event: string;
  timestamp: string;
  data?: any;
}

export interface AgentAction {
  agent: string;
  action: string;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

/**
 * Hook for managing agent trigger events
 * Coordinates when each agent should evaluate and act
 */
export function useAgentTriggers(
  onTrendAction?: (action: AgentAction) => void,
  onRiskAction?: (action: AgentAction) => void,
  onNewsAction?: (action: AgentAction) => void,
  onHistoryAction?: (action: AgentAction) => void,
  onMasterAction?: (action: AgentAction) => void,
) {
  // History Agent: Triggered on new trade insertion
  const triggerHistoryAgent = useCallback((newTrade: any, allTrades: any[]) => {
    const timestamp = new Date().toISOString();

    // Analyze the latest trade outcome
    const isWin = newTrade.result === 'WIN';
    const recentTrades = allTrades.slice(-10);
    const recentWins = recentTrades.filter(t => t.result === 'WIN').length;
    const consistency = (recentWins / recentTrades.length) * 100;

    // Check for milestone
    const totalTrades = allTrades.length;
    const milestone50Hit = totalTrades === 50;
    const milestone500Hit = totalTrades === 500;

    const action: AgentAction = {
      agent: 'history',
      action: `Trade analysis: ${isWin ? 'WIN' : 'LOSS'} | Consistency: ${consistency.toFixed(0)}%`,
      confidence: consistency / 100,
      reasoning: `Analyzed trade #${totalTrades}. Recent consistency: ${consistency.toFixed(0)}%. ${
        milestone50Hit ? 'Milestone 50-trade hit!' : milestone500Hit ? 'Milestone 500-trade hit!' : ''
      }`,
      timestamp,
    };

    onHistoryAction?.(action);

    return action;
  }, [onHistoryAction]);

  // Risk Agent: Continuous monitoring (called on position/stats change)
  const triggerRiskAgent = useCallback((drawdown: number, maxDrawdown: number, positionCount: number) => {
    const timestamp = new Date().toISOString();
    const drawdownRatio = drawdown / maxDrawdown;
    const isThresholdBreached = drawdownRatio > 0.5;

    const action: AgentAction = {
      agent: 'risk',
      action: `Drawdown: ${drawdown.toFixed(2)} / ${maxDrawdown.toFixed(2)} (${(drawdownRatio * 100).toFixed(0)}%)`,
      confidence: 1 - drawdownRatio,
      reasoning: isThresholdBreached
        ? `⚠️ Drawdown threshold approaching! Position count: ${positionCount}`
        : `✓ Risk within limits. Position count: ${positionCount}`,
      timestamp,
    };

    onRiskAction?.(action);

    return action;
  }, [onRiskAction]);

  // Trend Agent: Triggered on streak change
  const triggerTrendAgent = useCallback((winStreak: number, lossStreak: number, lastTradeWin: boolean) => {
    const timestamp = new Date().toISOString();

    let trend = 'NEUTRAL';
    let confidence = 0;

    if (winStreak > 3) {
      trend = 'BUY';
      confidence = Math.min(winStreak / 10, 1); // Cap at 1.0
    } else if (lossStreak > 3) {
      trend = 'SELL';
      confidence = Math.min(lossStreak / 10, 1);
    } else {
      confidence = 0.5;
    }

    const action: AgentAction = {
      agent: 'trend',
      action: `${trend} | Win Streak: ${winStreak} | Loss Streak: ${lossStreak}`,
      confidence,
      reasoning: `${lastTradeWin ? '✓ Win' : '✗ Loss'} detected. Current streak: ${winStreak > lossStreak ? `${winStreak}W` : `${lossStreak}L`}`,
      timestamp,
    };

    onTrendAction?.(action);

    return action;
  }, [onTrendAction]);

  // News Agent: Triggered on 5-min interval or breaking news
  const triggerNewsAgent = useCallback((sentiment: 'Bullish' | 'Neutral' | 'Bearish', volatility: number, newsCount: number) => {
    const timestamp = new Date().toISOString();

    let confidence = 0.25; // Baseline
    if (newsCount > 0) {
      confidence = Math.min(0.25 + (newsCount * 0.05), 1);
    }

    const action: AgentAction = {
      agent: 'news',
      action: `${sentiment} | VIX: ${volatility.toFixed(1)} | ${newsCount} news items`,
      confidence,
      reasoning: `Market sentiment: ${sentiment}. Volatility level: ${volatility > 20 ? 'High' : volatility > 15 ? 'Medium' : 'Low'}. News impact: ${newsCount} events.`,
      timestamp,
    };

    onNewsAction?.(action);

    return action;
  }, [onNewsAction]);

  // Master Agent: Evaluates all sub-agents and makes final decision
  const triggerMasterAgent = useCallback((
    trendScore: number,
    riskScore: number,
    newsScore: number,
    historyScore: number,
  ) => {
    const timestamp = new Date().toISOString();
    const totalScore = trendScore + riskScore + newsScore + historyScore;
    const threshold = 75;
    const gateOpen = totalScore >= threshold;

    let signal = 'NEUTRAL';
    if (gateOpen) {
      if (trendScore > historyScore) {
        signal = 'BUY'; // Simplified - should use trend direction
      } else if (trendScore < historyScore / 2) {
        signal = 'SELL';
      }
    }

    const action: AgentAction = {
      agent: 'master',
      action: `${signal} | Confidence: ${totalScore}%`,
      confidence: totalScore / 100,
      reasoning: gateOpen
        ? `✓ GATE OPEN: All agents aligned. Score: ${totalScore}pts [Trend:${trendScore} Risk:${riskScore} News:${newsScore} History:${historyScore}]`
        : `✗ GATE CLOSED: Insufficient confidence. Score: ${totalScore}pts (need 75+)`,
      timestamp,
    };

    onMasterAction?.(action);

    return action;
  }, [onMasterAction]);

  return {
    triggerHistoryAgent,
    triggerRiskAgent,
    triggerTrendAgent,
    triggerNewsAgent,
    triggerMasterAgent,
  };
}
