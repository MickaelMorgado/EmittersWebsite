/**
 * Agent Event Dispatcher
 * Coordinates event-driven agent triggers and decision flows
 */

export interface AgentEvent {
  type:
    | 'TRADE_INSERTED'
    | 'STREAK_CHANGED'
    | 'DRAWDOWN_UPDATED'
    | 'NEWS_FETCHED'
    | 'TICK'
    | 'MANUAL_SIGNAL';
  payload: any;
  timestamp: string;
}

export interface AgentEventListener {
  (event: AgentEvent): void;
}

class AgentEventDispatcher {
  private listeners: Map<string, Set<AgentEventListener>> = new Map();
  private eventHistory: AgentEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to agent events
   */
  on(eventType: AgentEvent['type'], listener: AgentEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Subscribe to event once
   */
  once(eventType: AgentEvent['type'], listener: AgentEventListener): void {
    const unsubscribe = this.on(eventType, (event) => {
      listener(event);
      unsubscribe();
    });
  }

  /**
   * Emit agent event
   */
  emit(event: AgentEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in agent event listener for ${event.type}:`, error);
        }
      });
    }

    // Also emit to wildcard listeners
    const wildcardListeners = this.listeners.get('*' as any);
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in wildcard agent event listener:', error);
        }
      });
    }
  }

  /**
   * Get event history
   */
  getHistory(eventType?: AgentEvent['type']): AgentEvent[] {
    if (eventType) {
      return this.eventHistory.filter((e) => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listener count
   */
  listenerCount(eventType: AgentEvent['type']): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }
}

// Singleton instance
export const agentEventDispatcher = new AgentEventDispatcher();

/**
 * Helper: Emit trade inserted event
 */
export function emitTradeInserted(trade: any, allTrades: any[]): void {
  agentEventDispatcher.emit({
    type: 'TRADE_INSERTED',
    payload: { trade, totalTrades: allTrades.length, recentTrades: allTrades.slice(-10) },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper: Emit streak changed event
 */
export function emitStreakChanged(winStreak: number, lossStreak: number, lastTradeWin: boolean): void {
  agentEventDispatcher.emit({
    type: 'STREAK_CHANGED',
    payload: { winStreak, lossStreak, lastTradeWin },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper: Emit drawdown updated event
 */
export function emitDrawdownUpdated(drawdown: number, maxDrawdown: number, positionCount: number): void {
  agentEventDispatcher.emit({
    type: 'DRAWDOWN_UPDATED',
    payload: { drawdown, maxDrawdown, positionCount },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper: Emit news fetched event
 */
export function emitNewsFetched(newsItems: any[], sentiment: string, volatility: number): void {
  agentEventDispatcher.emit({
    type: 'NEWS_FETCHED',
    payload: { newsItems, sentiment, volatility },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper: Emit tick event
 */
export function emitTick(candle: any): void {
  agentEventDispatcher.emit({
    type: 'TICK',
    payload: { candle },
    timestamp: new Date().toISOString(),
  });
}
