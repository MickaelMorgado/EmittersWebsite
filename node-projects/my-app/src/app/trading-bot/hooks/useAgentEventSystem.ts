import { useEffect, useCallback } from 'react';
import { agentEventDispatcher, AgentEvent } from '@/app/trading-bot/lib/agentEventDispatcher';
import { useAgentTriggers, AgentAction } from './useAgentTriggers';

/**
 * Hook to wire up the complete agent event system
 * Coordinates all agent triggers and decision flows
 */
export function useAgentEventSystem(
  onAgentAction?: (action: AgentAction) => void,
  onDecision?: (decision: { agent: string; signal: string; confidence: number }) => void,
) {
  const triggers = useAgentTriggers(
    (action) => {
      onAgentAction?.(action);
      console.log(`[TREND AGENT] ${action.action}`);
    },
    (action) => {
      onAgentAction?.(action);
      console.log(`[RISK AGENT] ${action.action}`);
    },
    (action) => {
      onAgentAction?.(action);
      console.log(`[NEWS AGENT] ${action.action}`);
    },
    (action) => {
      onAgentAction?.(action);
      console.log(`[HISTORY AGENT] ${action.action}`);
    },
    (action) => {
      onAgentAction?.(action);
      console.log(`[MASTER AGENT] ${action.action}`);

      // Extract signal from action
      const signal = action.action.split('|')[0].trim();
      onDecision?.({
        agent: 'master',
        signal,
        confidence: action.confidence,
      });
    },
  );

  // Listen for trade insertion → trigger History Agent
  useEffect(() => {
    const unsubscribe = agentEventDispatcher.on('TRADE_INSERTED', (event: AgentEvent) => {
      const { trade, totalTrades, recentTrades } = event.payload;
      triggers.triggerHistoryAgent(trade, recentTrades || []);
    });

    return unsubscribe;
  }, [triggers]);

  // Listen for streak changes → trigger Trend Agent
  useEffect(() => {
    const unsubscribe = agentEventDispatcher.on('STREAK_CHANGED', (event: AgentEvent) => {
      const { winStreak, lossStreak, lastTradeWin } = event.payload;
      triggers.triggerTrendAgent(winStreak, lossStreak, lastTradeWin);
    });

    return unsubscribe;
  }, [triggers]);

  // Listen for drawdown updates → trigger Risk Agent
  useEffect(() => {
    const unsubscribe = agentEventDispatcher.on('DRAWDOWN_UPDATED', (event: AgentEvent) => {
      const { drawdown, maxDrawdown, positionCount } = event.payload;
      triggers.triggerRiskAgent(drawdown, maxDrawdown, positionCount);
    });

    return unsubscribe;
  }, [triggers]);

  // Listen for news fetches → trigger News Agent
  useEffect(() => {
    const unsubscribe = agentEventDispatcher.on('NEWS_FETCHED', (event: AgentEvent) => {
      const { newsItems, sentiment, volatility } = event.payload;
      triggers.triggerNewsAgent(sentiment || 'Neutral', volatility || 15, newsItems?.length || 0);
    });

    return unsubscribe;
  }, [triggers]);

  /**
   * Convenience function to evaluate all agents and trigger Master
   */
  const evaluateMasterDecision = useCallback(
    (trendScore: number, riskScore: number, newsScore: number, historyScore: number) => {
      triggers.triggerMasterAgent(trendScore, riskScore, newsScore, historyScore);
    },
    [triggers]
  );

  /**
   * Convenience function to manually emit events
   */
  const emitEvent = useCallback((event: AgentEvent) => {
    agentEventDispatcher.emit(event);
  }, []);

  /**
   * Get event history for debugging
   */
  const getEventHistory = useCallback((eventType?: AgentEvent['type']) => {
    return agentEventDispatcher.getHistory(eventType);
  }, []);

  return {
    triggers,
    evaluateMasterDecision,
    emitEvent,
    getEventHistory,
  };
}
