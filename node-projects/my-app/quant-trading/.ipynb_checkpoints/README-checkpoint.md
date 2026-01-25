# Quantitative Trading Project - Beginner Friendly

A simple Python-based quantitative trading backtesting system designed for beginners, focusing on Moving Average strategies with beautiful equity curve visualization.

## 🎯 Project Goals

- **Simple MA Strategies**: Start with basic Moving Average crossovers
- **Beautiful Visualizations**: Clear equity curves and performance charts
- **Easy to Understand**: Beginner-friendly code with clear explanations
- **Extensible**: Easy to add new strategies and assets later
- **Backtesting Only**: Focus on historical analysis, not live trading

## 📁 Project Structure

```
quant-trading/
├── data/                    # Your trading data
│   ├── raw/                # Original CSV files from MT5
│   ├── processed/          # Cleaned data
│   └── eurusd_5m/          # EURUSD 5-minute data
├── strategies/             # Trading strategies
│   ├── base_strategy.py    # Strategy base class
│   └── ma_crossover.py     # Moving Average crossover strategy
├── backtesting/            # Backtesting engine
│   ├── backtester.py       # Main backtesting engine
│   ├── performance.py      # Performance calculations
│   └── monte_carlo.py      # Monte Carlo simulations
├── notebooks/              # Jupyter notebooks for analysis
│   ├── 01-data-loading.ipynb      # Load and explore your data
│   ├── 02-ma-strategy.ipynb       # Test MA strategies
│   ├── 03-performance-analysis.ipynb  # Analyze results
│   └── 04-equity-curves.ipynb     # Create beautiful charts
├── utils/                  # Helper functions
│   ├── data_loader.py      # Load MT5 CSV files
│   ├── visualization.py    # Chart creation functions
│   └── config.py          # Configuration settings
└── requirements.txt       # Python packages needed
```

## 🚀 Quick Start Guide

### Step 1: Install Python Environment

1. **Install Python** (if you don't have it):
   - Download from [python.org](https://python.org)
   - Make sure to check "Add Python to PATH" during installation

2. **Install Required Packages**:
   ```bash
   # Navigate to the quant-trading folder
   cd node-projects/my-app/quant-trading
   
   # Install all required packages
   pip install -r requirements.txt
   ```

### Step 2: Set Up Your Data

1. **Export Data from MT5**:
   - Open MT5
   - Press `Ctrl+U` to open Market Watch
   - Go to "Symbols" tab
   - Select EURUSD
   - Click "Export" and save as CSV

2. **Place Your Data**:
   - Put your CSV file in `quant-trading/data/raw/`
   - Name it something like `EURUSD_5m_2025.csv`

### Step 3: Start JupyterLab

```bash
# From the quant-trading folder
jupyter lab
```

This will open JupyterLab in your browser where you can:
- Run the notebooks step by step
- See interactive charts
- Experiment with different parameters

## 📊 What You'll Get

### Beautiful Equity Curves
![Equity Curve Example](https://i.imgur.com/example.png)

### Performance Metrics
- Total Return
- Win Rate
- Maximum Drawdown
- Sharpe Ratio
- Profit Factor

### Interactive Charts
- Price charts with strategy signals
- Equity curve visualization
- Trade-by-trade analysis
- Monte Carlo simulation results

## 🎮 How to Use

### For Complete Beginners

1. **Start with Notebook 01**: `01-data-loading.ipynb`
   - Learn how to load your MT5 data
   - See what your data looks like
   - Basic data exploration

2. **Try Notebook 02**: `02-ma-strategy.ipynb`
   - Test Moving Average crossover strategy
   - Change parameters (MA periods, stop loss, etc.)
   - See immediate results

3. **Analyze Results**: `03-performance-analysis.ipynb`
   - Understand your strategy performance
   - Learn key trading metrics
   - Compare different parameter sets

4. **Create Charts**: `04-equity-curves.ipynb`
   - Generate beautiful equity curves
   - Export charts for analysis
   - Customize visualizations

### Key Parameters You Can Adjust

```python
# Moving Average periods
fast_ma_period = 10    # Fast MA (short-term trend)
slow_ma_period = 30    # Slow MA (long-term trend)

# Risk Management
lot_size = 1.0         # Position size
stop_loss = 0.001      # Stop loss in price
take_profit = 0.003    # Take profit in price
commission = 0.00005   # Trading fees
```

## 📈 Strategy Overview

### Moving Average Crossover Strategy

**How it works:**
1. **Buy Signal**: When Fast MA crosses above Slow MA (Bullish crossover)
2. **Sell Signal**: When Fast MA crosses below Slow MA (Bearish crossover)
3. **Exit**: When opposite crossover happens or hit stop loss/take profit

**Why it's good for beginners:**
- Simple to understand
- Clear entry/exit rules
- Works well in trending markets
- Easy to visualize on charts

## 🔧 Customization

### Adding New Strategies
1. Create a new file in `strategies/`
2. Inherit from `BaseStrategy`
3. Implement the `generate_signals()` method
4. Test in a new notebook

### Adding New Assets
1. Export data from MT5 for new asset (BTCUSD, XAUUSD, etc.)
2. Place in `data/raw/` with appropriate naming
3. Update data loading in notebooks
4. Test your strategies on new data

## 📚 Learning Resources

### Key Concepts You'll Learn
- **Moving Averages**: Trend following indicators
- **Backtesting**: Testing strategies on historical data
- **Risk Management**: Position sizing and stop losses
- **Performance Metrics**: How to evaluate strategy success
- **Monte Carlo**: Testing strategy robustness

### Next Steps After Mastering MA
- Add more indicators (RSI, MACD, Bollinger Bands)
- Try different timeframes (1min, 15min, 1hour)
- Implement portfolio management
- Add machine learning elements

## 🆘 Getting Help

### Common Issues
1. **Python not found**: Make sure Python is installed and in PATH
2. **Packages not installing**: Try `pip install --upgrade pip`
3. **Jupyter not starting**: Try `python -m jupyter lab`

### Where to Ask Questions
- Check the notebook comments for explanations
- Look at the code comments for detailed explanations
- Ask me any questions about the code!

## 🎯 Success Criteria

You'll know you're making progress when you can:
1. ✅ Load your MT5 data successfully
2. ✅ Run a basic MA strategy backtest
3. ✅ Understand the performance metrics
4. ✅ Create and interpret equity curves
5. ✅ Adjust parameters and see results
6. ✅ Explain your strategy to someone else

---

**Remember**: This is designed to be beginner-friendly. Take your time, experiment, and don't hesitate to ask questions!

## 🚀 Quick Start Commands

```bash
# 1. Navigate to the project
cd node-projects/my-app/quant-trading

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start JupyterLab
jupyter lab

# 4. Open notebooks/01-data-loading.ipynb in JupyterLab
# 5. Run the cells step by step!
```

## 📈 Example Output

When you run the notebooks, you'll see beautiful charts like:

- **Price charts** with Moving Average lines and buy/sell signals
- **Equity curves** showing your strategy's performance over time
- **Performance dashboards** with key metrics
- **Trade analysis** showing individual trade results
- **Parameter optimization** heatmaps

## 🎨 Customization Examples

### Change Strategy Parameters
```python
# In the notebooks, you can easily change:
fast_period = 15    # Try different fast MA periods
slow_period = 50    # Try different slow MA periods
stop_loss = 0.002   # Adjust risk management
```

### Add New Indicators
```python
# Add EMA to your strategy
ema_fast = data['close'].ewm(span=12).mean()
ema_slow = data['close'].ewm(span=26).mean()
```

### Test Different Assets
```python
# Load different data
btc_data = load_mt5_csv("../data/raw/BTCUSD_1h_2025.csv")
xau_data = load_mt5_csv("../data/raw/XAUUSD_5m_2025.csv")
```

## 📊 Performance Metrics Explained

- **Total Return**: Overall percentage gain/loss
- **Sharpe Ratio**: Risk-adjusted return (higher is better)
- **Win Rate**: Percentage of winning trades
- **Maximum Drawdown**: Largest peak-to-trough decline
- **Profit Factor**: Ratio of gross profits to gross losses

## 🎯 Next Steps

Once you're comfortable with the basics:

1. **Try different strategies**: EMA crossovers, RSI strategies, etc.
2. **Add risk management**: Position sizing, trailing stops
3. **Test on different timeframes**: 1min, 15min, 1hour, daily
4. **Compare strategies**: See which works best for different markets
5. **Build a portfolio**: Combine multiple strategies

Happy trading! 🚀