"""
Visualization utilities for trading data and backtest results.

This module provides functions to create beautiful charts and visualizations
for trading strategies, equity curves, and performance analysis.
"""

import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional, Union
import logging

logger = logging.getLogger(__name__)


class TradingVisualizer:
    """
    Class for creating trading-related visualizations.
    
    Provides methods to create equity curves, price charts with indicators,
    performance metrics plots, and trade analysis charts.
    """
    
    def __init__(self):
        """Initialize the visualizer with default styling."""
        # Set default plotly template
        self.template = 'plotly_white'
        
    def create_price_chart(self, data: pd.DataFrame, 
                          indicators: Optional[Dict] = None,
                          signals: Optional[pd.Series] = None,
                          title: str = "Price Chart with Indicators") -> go.Figure:
        """
        Create a price chart with optional indicators and signals.
        
        Args:
            data: DataFrame with OHLC price data
            indicators: Dictionary of indicators to plot
                       e.g., {'SMA_20': series, 'SMA_50': series}
            signals: Series with trading signals (1, -1, 0)
            title: Chart title
            
        Returns:
            Plotly figure object
        """
        fig = make_subplots(
            rows=2, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.03,
            subplot_titles=('Price Chart', 'Volume'),
            row_width=[0.7, 0.3]
        )
        
        # Add candlestick chart
        fig.add_trace(
            go.Candlestick(
                x=data.index,
                open=data['open'],
                high=data['high'],
                low=data['low'],
                close=data['close'],
                name='Price'
            ),
            row=1, col=1
        )
        
        # Add indicators if provided
        if indicators:
            colors = ['orange', 'red', 'blue', 'purple', 'green']
            for i, (name, series) in enumerate(indicators.items()):
                color = colors[i % len(colors)]
                fig.add_trace(
                    go.Scatter(
                        x=data.index,
                        y=series,
                        mode='lines',
                        name=name,
                        line=dict(color=color, width=2)
                    ),
                    row=1, col=1
                )
        
        # Add signals if provided
        if signals is not None:
            buy_signals = data[signals == 1]
            sell_signals = data[signals == -1]
            
            if not buy_signals.empty:
                fig.add_trace(
                    go.Scatter(
                        x=buy_signals.index,
                        y=buy_signals['low'] * 0.995,  # Slightly below low
                        mode='markers',
                        marker=dict(symbol='triangle-up', size=10, color='green'),
                        name='Buy Signal',
                        showlegend=True
                    ),
                    row=1, col=1
                )
            
            if not sell_signals.empty:
                fig.add_trace(
                    go.Scatter(
                        x=sell_signals.index,
                        y=sell_signals['high'] * 1.005,  # Slightly above high
                        mode='markers',
                        marker=dict(symbol='triangle-down', size=10, color='red'),
                        name='Sell Signal',
                        showlegend=True
                    ),
                    row=1, col=1
                )
        
        # Add volume chart (if available)
        if 'volume' in data.columns:
            fig.add_trace(
                go.Bar(
                    x=data.index,
                    y=data['volume'],
                    name='Volume',
                    marker_color='lightgray'
                ),
                row=2, col=1
            )
        
        # Update layout
        fig.update_layout(
            title=title,
            template=self.template,
            height=600,
            showlegend=True,
            xaxis_rangeslider_visible=False
        )
        
        # Update y-axis labels
        fig.update_yaxes(title_text="Price", row=1, col=1)
        fig.update_yaxes(title_text="Volume", row=2, col=1)
        
        return fig
    
    def create_equity_curve(self, equity_curve: List[float],
                           trades: Optional[List[Dict]] = None,
                           title: str = "Equity Curve") -> go.Figure:
        """
        Create an equity curve chart.
        
        Args:
            equity_curve: List of equity values over time
            trades: List of trade dictionaries with entry/exit info
            title: Chart title
            
        Returns:
            Plotly figure object
        """
        fig = go.Figure()
        
        # Add equity curve
        fig.add_trace(
            go.Scatter(
                x=list(range(len(equity_curve))),
                y=equity_curve,
                mode='lines',
                name='Equity',
                line=dict(color='blue', width=2)
            )
        )
        
        # Add trade markers if provided
        if trades:
            winning_trades = []
            losing_trades = []
            
            for trade in trades:
                if trade['pnl'] > 0:
                    winning_trades.append(trade)
                elif trade['pnl'] < 0:
                    losing_trades.append(trade)
            
            if winning_trades:
                fig.add_trace(
                    go.Scatter(
                        x=[t.get('exit_index', i) for i, t in enumerate(winning_trades)],
                        y=[t['capital'] for t in winning_trades],
                        mode='markers',
                        marker=dict(symbol='circle', size=8, color='green'),
                        name='Winning Trades',
                        showlegend=True
                    )
                )
            
            if losing_trades:
                fig.add_trace(
                    go.Scatter(
                        x=[t.get('exit_index', i) for i, t in enumerate(losing_trades)],
                        y=[t['capital'] for t in losing_trades],
                        mode='markers',
                        marker=dict(symbol='circle', size=8, color='red'),
                        name='Losing Trades',
                        showlegend=True
                    )
                )
        
        # Update layout
        fig.update_layout(
            title=title,
            template=self.template,
            height=400,
            showlegend=True,
            xaxis_title="Time Periods",
            yaxis_title="Equity ($)"
        )
        
        return fig
    
    def create_performance_dashboard(self, backtest_results: Dict) -> go.Figure:
        """
        Create a performance dashboard with key metrics.
        
        Args:
            backtest_results: Dictionary with backtest results
            
        Returns:
            Plotly figure object
        """
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Performance Metrics', 'Trade Distribution', 
                           'Drawdown Analysis', 'Returns Distribution'),
            specs=[[{"type": "bar"}, {"type": "pie"}],
                   [{"type": "scatter"}, {"type": "histogram"}]]
        )
        
        # Performance metrics bar chart
        metrics = ['Total Return', 'Sharpe Ratio', 'Win Rate', 'Profit Factor']
        values = [
            backtest_results.get('total_return', 0),
            backtest_results.get('sharpe_ratio', 0),
            backtest_results.get('win_rate', 0) * 100,  # Convert to percentage
            backtest_results.get('profit_factor', 0)
        ]
        
        fig.add_trace(
            go.Bar(
                x=metrics,
                y=values,
                name='Metrics',
                marker_color=['blue', 'green', 'orange', 'red']
            ),
            row=1, col=1
        )
        
        # Trade distribution pie chart
        trade_data = [
            backtest_results.get('winning_trades', 0),
            backtest_results.get('losing_trades', 0)
        ]
        trade_labels = ['Winning', 'Losing']
        
        fig.add_trace(
            go.Pie(
                labels=trade_labels,
                values=trade_data,
                name='Trade Distribution'
            ),
            row=1, col=2
        )
        
        # Drawdown analysis
        if 'equity_curve' in backtest_results:
            equity = backtest_results['equity_curve']
            peak = equity[0]
            drawdowns = []
            
            for value in equity:
                if value > peak:
                    peak = value
                drawdown = (peak - value) / peak * 100
                drawdowns.append(drawdown)
            
            fig.add_trace(
                go.Scatter(
                    x=list(range(len(drawdowns))),
                    y=drawdowns,
                    mode='lines',
                    fill='tozeroy',
                    name='Drawdown',
                    line=dict(color='red')
                ),
                row=2, col=1
            )
        
        # Returns distribution histogram
        if 'trades' in backtest_results:
            returns = [trade['pnl'] for trade in backtest_results['trades'] if trade['pnl'] != 0]
            if returns:
                fig.add_trace(
                    go.Histogram(
                        x=returns,
                        nbinsx=20,
                        name='Returns Distribution',
                        marker_color='lightblue',
                        opacity=0.7
                    ),
                    row=2, col=2
                )
        
        # Update layout
        fig.update_layout(
            title="Strategy Performance Dashboard",
            template=self.template,
            height=600,
            showlegend=False
        )
        
        return fig
    
    def create_trade_analysis(self, trades: List[Dict]) -> go.Figure:
        """
        Create a detailed trade analysis chart.
        
        Args:
            trades: List of trade dictionaries
            
        Returns:
            Plotly figure object
        """
        if not trades:
            return go.Figure()
        
        # Create DataFrame for easier analysis
        df_trades = pd.DataFrame(trades)
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Trade P&L Distribution', 'Trade Duration',
                           'Cumulative P&L', 'Trade Size Analysis'),
            specs=[[{"type": "histogram"}, {"type": "bar"}],
                   [{"type": "scatter"}, {"type": "bar"}]]
        )
        
        # Trade P&L distribution
        fig.add_trace(
            go.Histogram(
                x=df_trades['pnl'],
                nbinsx=20,
                name='P&L Distribution',
                marker_color='blue',
                opacity=0.7
            ),
            row=1, col=1
        )
        
        # Trade duration (if available)
        if 'duration' in df_trades.columns:
            fig.add_trace(
                go.Bar(
                    x=df_trades.index,
                    y=df_trades['duration'],
                    name='Trade Duration',
                    marker_color='green'
                ),
                row=1, col=2
            )
        
        # Cumulative P&L
        cumulative_pnl = df_trades['pnl'].cumsum()
        fig.add_trace(
            go.Scatter(
                x=df_trades.index,
                y=cumulative_pnl,
                mode='lines+markers',
                name='Cumulative P&L',
                line=dict(color='purple', width=2)
            ),
            row=2, col=1
        )
        
        # Trade size analysis
        fig.add_trace(
            go.Bar(
                x=['Winning', 'Losing'],
                y=[df_trades[df_trades['pnl'] > 0]['pnl'].mean(),
                   abs(df_trades[df_trades['pnl'] < 0]['pnl'].mean())],
                name='Average Trade Size',
                marker_color=['green', 'red']
            ),
            row=2, col=2
        )
        
        # Update layout
        fig.update_layout(
            title="Trade Analysis",
            template=self.template,
            height=600,
            showlegend=False
        )
        
        return fig
    
    def save_chart(self, fig: go.Figure, filename: str, format: str = 'html'):
        """
        Save chart to file.
        
        Args:
            fig: Plotly figure object
            filename: Output filename
            format: Output format ('html', 'png', 'pdf', 'svg')
        """
        if format == 'html':
            fig.write_html(filename)
        elif format in ['png', 'pdf', 'svg']:
            fig.write_image(filename)
        else:
            logger.warning(f"Unsupported format: {format}")
    
    def show_chart(self, fig: go.Figure):
        """
        Display chart in browser.
        
        Args:
            fig: Plotly figure object
        """
        fig.show()


def create_simple_mpl_chart(data: pd.DataFrame, title: str = "Price Chart"):
    """
    Create a simple matplotlib chart for quick visualization.
    
    Args:
        data: DataFrame with OHLC price data
        title: Chart title
        
    Returns:
        Matplotlib figure object
    """
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
    
    # Price chart
    ax1.plot(data.index, data['close'], label='Close Price', color='blue')
    ax1.set_title(title)
    ax1.set_ylabel('Price')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Volume chart
    if 'volume' in data.columns:
        ax2.bar(data.index, data['volume'], alpha=0.7, color='gray')
        ax2.set_ylabel('Volume')
        ax2.set_xlabel('Date')
    
    plt.tight_layout()
    return fig


def plot_correlation_matrix(data: pd.DataFrame, title: str = "Correlation Matrix"):
    """
    Create a correlation matrix heatmap.
    
    Args:
        data: DataFrame with numerical columns
        title: Chart title
        
    Returns:
        Seaborn/matplotlib figure
    """
    correlation_matrix = data.corr()
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
    plt.title(title)
    plt.tight_layout()
    return plt.gcf()


if __name__ == "__main__":
    # Example usage
    print("Visualization Module")
    print("===================")
    
    # Create sample data
    dates = pd.date_range('2025-01-01', periods=50, freq='D')
    np.random.seed(42)
    prices = 100 + np.cumsum(np.random.randn(50) * 0.5)
    
    sample_data = pd.DataFrame({
        'open': prices,
        'high': prices + np.abs(np.random.randn(50)),
        'low': prices - np.abs(np.random.randn(50)),
        'close': prices,
        'volume': np.random.randint(1000, 5000, 50)
    }, index=dates)
    
    # Create visualizer
    viz = TradingVisualizer()
    
    # Create price chart
    fig1 = viz.create_price_chart(sample_data, title="Sample Price Chart")
    print("Price chart created successfully")
    
    # Create equity curve
    equity = [10000 + i * 100 for i in range(50)]
    fig2 = viz.create_equity_curve(equity, title="Sample Equity Curve")
    print("Equity curve created successfully")
    
    print("All visualizations created successfully!")