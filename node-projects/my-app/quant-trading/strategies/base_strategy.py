"""
Base strategy class for trading strategies.

This module defines the base class that all trading strategies should inherit from.
It provides common functionality and a standard interface for strategy implementation.
"""

import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class BaseStrategy(ABC):
    """
    Abstract base class for trading strategies.
    
    All strategies should inherit from this class and implement the abstract methods.
    """
    
    def __init__(self, name: str = "Base Strategy"):
        """
        Initialize the base strategy.
        
        Args:
            name: Name of the strategy
        """
        self.name = name
        self.signals = pd.DataFrame()
        self.positions = pd.DataFrame()
        self.trades = []
        
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Generate trading signals based on the input data.
        
        Args:
            data: DataFrame with OHLC price data
            
        Returns:
            DataFrame with trading signals (1 for buy, -1 for sell, 0 for hold)
        """
        pass
    
    @abstractmethod
    def get_parameters(self) -> Dict:
        """
        Get the current parameters of the strategy.
        
        Returns:
            Dictionary of strategy parameters
        """
        pass
    
    def validate_data(self, data: pd.DataFrame) -> bool:
        """
        Validate input data for the strategy.
        
        Args:
            data: DataFrame with OHLC price data
            
        Returns:
            True if data is valid, False otherwise
        """
        if data.empty:
            logger.warning("Empty data provided to strategy")
            return False
        
        required_columns = ['open', 'high', 'low', 'close']
        if not all(col in data.columns for col in required_columns):
            logger.warning(f"Missing required columns. Expected: {required_columns}")
            return False
        
        if data.isna().any().any():
            logger.warning("Data contains NaN values")
            return False
        
        return True
    
    def calculate_indicators(self, data: pd.DataFrame, 
                           indicators: List[Tuple[str, str, int]]) -> pd.DataFrame:
        """
        Calculate technical indicators for the strategy.
        
        Args:
            data: DataFrame with OHLC price data
            indicators: List of tuples (column, indicator_type, period)
                       e.g., [('close', 'sma', 20), ('close', 'ema', 50)]
        
        Returns:
            DataFrame with calculated indicators
        """
        result = data.copy()
        
        for column, indicator_type, period in indicators:
            if indicator_type.lower() == 'sma':
                result[f'{indicator_type.upper()}_{period}'] = result[column].rolling(window=period).mean()
            elif indicator_type.lower() == 'ema':
                result[f'{indicator_type.upper()}_{period}'] = result[column].ewm(span=period).mean()
            elif indicator_type.lower() == 'std':
                result[f'{indicator_type.upper()}_{period}'] = result[column].rolling(window=period).std()
            else:
                logger.warning(f"Unknown indicator type: {indicator_type}")
        
        return result
    
    def backtest(self, data: pd.DataFrame, 
                initial_capital: float = 10000,
                lot_size: float = 1.0,
                stop_loss: Optional[float] = None,
                take_profit: Optional[float] = None,
                commission: float = 0.00005) -> Dict:
        """
        Backtest the strategy on historical data.
        
        Args:
            data: DataFrame with OHLC price data
            initial_capital: Starting capital for backtest
            lot_size: Position size for each trade
            stop_loss: Stop loss distance (in price)
            take_profit: Take profit distance (in price)
            commission: Trading commission per trade
            
        Returns:
            Dictionary with backtest results
        """
        if not self.validate_data(data):
            return {"error": "Invalid data"}
        
        # Generate signals
        signals = self.generate_signals(data)
        
        # Initialize tracking variables
        capital = initial_capital
        position = 0  # 1 for long, -1 for short, 0 for flat
        entry_price = 0
        trades = []
        equity_curve = [initial_capital]
        
        # Backtest loop
        for i in range(len(data)):
            current_data = data.iloc[i]
            current_signals = signals.iloc[i] if i < len(signals) else 0
            
            # Check for stop loss/take profit
            if position != 0 and stop_loss and take_profit:
                price_change = current_data['close'] - entry_price
                if (position > 0 and price_change <= -stop_loss) or \
                   (position < 0 and price_change >= stop_loss):
                    # Stop loss hit
                    exit_price = entry_price - (stop_loss * position)
                    pnl = position * lot_size * (exit_price - entry_price) - commission
                    capital += pnl
                    trades.append({
                        'type': 'SL',
                        'entry_price': entry_price,
                        'exit_price': exit_price,
                        'pnl': pnl,
                        'capital': capital
                    })
                    position = 0
                elif (position > 0 and price_change >= take_profit) or \
                     (position < 0 and price_change <= -take_profit):
                    # Take profit hit
                    exit_price = entry_price + (take_profit * position)
                    pnl = position * lot_size * (exit_price - entry_price) - commission
                    capital += pnl
                    trades.append({
                        'type': 'TP',
                        'entry_price': entry_price,
                        'exit_price': exit_price,
                        'pnl': pnl,
                        'capital': capital
                    })
                    position = 0
            
            # Execute trades based on signals
            if current_signals > 0 and position <= 0:
                # Enter long position
                if position < 0:
                    # Close short position first
                    exit_price = current_data['close']
                    pnl = position * lot_size * (exit_price - entry_price) - commission
                    capital += pnl
                    trades.append({
                        'type': 'Close Short',
                        'entry_price': entry_price,
                        'exit_price': exit_price,
                        'pnl': pnl,
                        'capital': capital
                    })
                
                # Enter long position
                entry_price = current_data['close']
                position = 1
                trades.append({
                    'type': 'Enter Long',
                    'entry_price': entry_price,
                    'exit_price': None,
                    'pnl': -commission,
                    'capital': capital - commission
                })
                
            elif current_signals < 0 and position >= 0:
                # Enter short position
                if position > 0:
                    # Close long position first
                    exit_price = current_data['close']
                    pnl = position * lot_size * (exit_price - entry_price) - commission
                    capital += pnl
                    trades.append({
                        'type': 'Close Long',
                        'entry_price': entry_price,
                        'exit_price': exit_price,
                        'pnl': pnl,
                        'capital': capital
                    })
                
                # Enter short position
                entry_price = current_data['close']
                position = -1
                trades.append({
                    'type': 'Enter Short',
                    'entry_price': entry_price,
                    'exit_price': None,
                    'pnl': -commission,
                    'capital': capital - commission
                })
            
            # Update equity curve
            if position != 0:
                unrealized_pnl = position * lot_size * (current_data['close'] - entry_price)
                current_equity = capital + unrealized_pnl
            else:
                current_equity = capital
            
            equity_curve.append(current_equity)
        
        # Close final position if open
        if position != 0:
            exit_price = data.iloc[-1]['close']
            pnl = position * lot_size * (exit_price - entry_price) - commission
            capital += pnl
            trades.append({
                'type': 'Close Final',
                'entry_price': entry_price,
                'exit_price': exit_price,
                'pnl': pnl,
                'capital': capital
            })
        
        # Calculate performance metrics
        results = self._calculate_performance_metrics(
            initial_capital, capital, equity_curve, trades
        )
        
        return results
    
    def _calculate_performance_metrics(self, initial_capital: float, final_capital: float,
                                     equity_curve: List[float], trades: List[Dict]) -> Dict:
        """
        Calculate performance metrics for the backtest.
        
        Args:
            initial_capital: Starting capital
            final_capital: Final capital
            equity_curve: List of equity values over time
            trades: List of trade dictionaries
            
        Returns:
            Dictionary with performance metrics
        """
        total_return = ((final_capital - initial_capital) / initial_capital) * 100
        
        # Calculate daily returns
        equity_array = np.array(equity_curve)
        daily_returns = np.diff(equity_array) / equity_array[:-1]
        
        # Calculate metrics
        sharpe_ratio = np.mean(daily_returns) / np.std(daily_returns) if np.std(daily_returns) > 0 else 0
        max_drawdown = self._calculate_max_drawdown(equity_curve)
        
        # Trade statistics
        winning_trades = [t for t in trades if t['pnl'] > 0]
        losing_trades = [t for t in trades if t['pnl'] < 0]
        
        win_rate = len(winning_trades) / len(trades) if trades else 0
        avg_win = np.mean([t['pnl'] for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t['pnl'] for t in losing_trades]) if losing_trades else 0
        
        profit_factor = abs(sum([t['pnl'] for t in winning_trades]) / 
                           sum([t['pnl'] for t in losing_trades])) if losing_trades else float('inf')
        
        return {
            'initial_capital': initial_capital,
            'final_capital': final_capital,
            'total_return': total_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'profit_factor': profit_factor,
            'total_trades': len(trades),
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'equity_curve': equity_curve,
            'trades': trades
        }
    
    def _calculate_max_drawdown(self, equity_curve: List[float]) -> float:
        """
        Calculate maximum drawdown from equity curve.
        
        Args:
            equity_curve: List of equity values
            
        Returns:
            Maximum drawdown as percentage
        """
        peak = equity_curve[0]
        max_drawdown = 0
        
        for value in equity_curve:
            if value > peak:
                peak = value
            drawdown = (peak - value) / peak
            max_drawdown = max(max_drawdown, drawdown)
        
        return max_drawdown * 100


class SimpleMovingAverageStrategy(BaseStrategy):
    """
    Simple Moving Average crossover strategy.
    
    This is a basic strategy that generates buy signals when the fast MA crosses above
    the slow MA, and sell signals when the fast MA crosses below the slow MA.
    """
    
    def __init__(self, fast_period: int = 10, slow_period: int = 30):
        """
        Initialize the SMA strategy.
        
        Args:
            fast_period: Period for the fast moving average
            slow_period: Period for the slow moving average
        """
        super().__init__("Simple Moving Average Crossover")
        self.fast_period = fast_period
        self.slow_period = slow_period
    
    def get_parameters(self) -> Dict:
        """Get strategy parameters."""
        return {
            'fast_period': self.fast_period,
            'slow_period': self.slow_period
        }
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Generate trading signals using SMA crossover.
        
        Args:
            data: DataFrame with OHLC price data
            
        Returns:
            DataFrame with signals (1 for buy, -1 for sell, 0 for hold)
        """
        if not self.validate_data(data):
            return pd.DataFrame()
        
        # Calculate moving averages
        fast_ma = data['close'].rolling(window=self.fast_period).mean()
        slow_ma = data['close'].rolling(window=self.slow_period).mean()
        
        # Generate signals
        signals = pd.DataFrame(index=data.index)
        signals['signal'] = 0
        
        # Buy signal: Fast MA crosses above Slow MA
        signals.loc[fast_ma > slow_ma, 'signal'] = 1
        
        # Sell signal: Fast MA crosses below Slow MA
        signals.loc[fast_ma < slow_ma, 'signal'] = -1
        
        # Remove signals for periods where we don't have enough data
        signals.iloc[:max(self.fast_period, self.slow_period)] = 0
        
        return signals['signal']


if __name__ == "__main__":
    # Example usage
    print("Base Strategy Module")
    print("===================")
    
    # Create sample data
    dates = pd.date_range('2025-01-01', periods=100, freq='D')
    np.random.seed(42)
    prices = 100 + np.cumsum(np.random.randn(100) * 0.5)
    
    sample_data = pd.DataFrame({
        'open': prices,
        'high': prices + np.abs(np.random.randn(100)),
        'low': prices - np.abs(np.random.randn(100)),
        'close': prices
    }, index=dates)
    
    # Test the strategy
    strategy = SimpleMovingAverageStrategy(fast_period=10, slow_period=30)
    signals = strategy.generate_signals(sample_data)
    
    print(f"Strategy: {strategy.name}")
    print(f"Parameters: {strategy.get_parameters()}")
    print(f"Generated {len(signals)} signals")
    print(f"Buy signals: {sum(signals == 1)}")
    print(f"Sell signals: {sum(signals == -1)}")
    print(f"Hold signals: {sum(signals == 0)}")