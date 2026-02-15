"""
Configuration settings for the quantitative trading project.

This module contains default configuration values and settings that can be
easily modified without changing the core code.
"""

import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
RESULTS_DIR = PROJECT_ROOT / "results"

# Create directories if they don't exist
for directory in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, RESULTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Default data settings
DEFAULT_TIMEZONE = "UTC"
DEFAULT_DELIMITER = "\t"
DEFAULT_DATA_COLUMNS = {
    "date": "<DATE>",
    "time": "<TIME>", 
    "open": "<OPEN>",
    "high": "<HIGH>",
    "low": "<LOW>",
    "close": "<CLOSE>",
    "volume": "<VOL>"
}

# Default strategy parameters
DEFAULT_STRATEGY_PARAMS = {
    "simple_ma": {
        "fast_period": 10,
        "slow_period": 30
    },
    "ema_crossover": {
        "fast_period": 12,
        "slow_period": 26
    }
}

# Default backtesting parameters
DEFAULT_BACKTEST_PARAMS = {
    "initial_capital": 10000.0,
    "lot_size": 1.0,
    "stop_loss": 0.001,  # 10 pips for EURUSD
    "take_profit": 0.003,  # 30 pips for EURUSD
    "commission": 0.00005,  # 0.5 pips
    "max_trades_per_day": 10
}

# Default visualization settings
DEFAULT_CHART_SETTINGS = {
    "template": "plotly_white",
    "height": 600,
    "width": 1000,
    "color_scheme": {
        "bullish": "#2E8B57",  # Sea Green
        "bearish": "#DC143C",  # Crimson
        "neutral": "#808080",  # Gray
        "buy_signal": "#32CD32",  # Lime Green
        "sell_signal": "#FF4500",  # Orange Red
        "ma_fast": "#FFA500",  # Orange
        "ma_slow": "#4169E1"   # Royal Blue
    }
}

# Optimization settings
DEFAULT_OPTIMIZATION = {
    "fast_period_range": range(5, 21, 5),  # 5, 10, 15, 20
    "slow_period_range": range(20, 101, 10),  # 20, 30, 40, ..., 100
    "metric_to_optimize": "total_return"  # total_return, sharpe_ratio, win_rate, profit_factor
}

# Risk management settings
DEFAULT_RISK_SETTINGS = {
    "max_risk_per_trade": 0.02,  # 2% of capital per trade
    "max_drawdown_limit": 0.20,  # 20% maximum drawdown
    "position_sizing_method": "fixed_fraction",  # fixed_fraction, kelly, equal_weight
    "trailing_stop_enabled": True,
    "trailing_stop_distance": 0.001
}

# Performance metrics settings
DEFAULT_METRICS = [
    "total_return",
    "annualized_return", 
    "sharpe_ratio",
    "sortino_ratio",
    "max_drawdown",
    "win_rate",
    "profit_factor",
    "average_win",
    "average_loss",
    "expectancy"
]

# Monte Carlo simulation settings
DEFAULT_MONTE_CARLO = {
    "num_simulations": 1000,
    "confidence_level": 0.95,
    "time_horizon": 252,  # Trading days in a year
    "initial_capital": 10000
}

# Logging settings
DEFAULT_LOGGING = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": RESULTS_DIR / "trading.log",
    "console": True
}

# Jupyter notebook settings
DEFAULT_NOTEBOOK = {
    "auto_save": True,
    "display_max_rows": 100,
    "display_max_columns": 20,
    "plotly_renderer": "notebook"
}

# Asset settings
DEFAULT_ASSETS = {
    "EURUSD": {
        "pip_value": 0.0001,
        "tick_size": 0.00001,
        "session_hours": {"start": "00:00", "end": "23:59"},
        "timezone": "UTC"
    },
    "BTCUSD": {
        "pip_value": 0.01,
        "tick_size": 0.01,
        "session_hours": {"start": "00:00", "end": "23:59"},
        "timezone": "UTC"
    },
    "XAUUSD": {
        "pip_value": 0.1,
        "tick_size": 0.01,
        "session_hours": {"start": "00:00", "end": "23:59"},
        "timezone": "UTC"
    }
}

# Environment variables
ENVIRONMENT = os.getenv("QUANT_ENV", "development")  # development, production, testing

# API settings (for future live trading integration)
API_SETTINGS = {
    "broker": "demo",  # demo, live
    "api_key": os.getenv("BROKER_API_KEY", ""),
    "api_secret": os.getenv("BROKER_API_SECRET", ""),
    "base_url": os.getenv("BROKER_BASE_URL", "https://api.example.com")
}

# Cache settings
CACHE_SETTINGS = {
    "enabled": True,
    "ttl": 3600,  # 1 hour in seconds
    "directory": RESULTS_DIR / "cache"
}

# Create cache directory
CACHE_SETTINGS["directory"].mkdir(exist_ok=True)

# Configuration validation
def validate_config():
    """Validate configuration settings."""
    errors = []
    
    # Check required directories exist
    required_dirs = [DATA_DIR, RESULTS_DIR]
    for directory in required_dirs:
        if not directory.exists():
            errors.append(f"Required directory does not exist: {directory}")
    
    # Validate strategy parameters
    for strategy, params in DEFAULT_STRATEGY_PARAMS.items():
        if params["fast_period"] >= params["slow_period"]:
            errors.append(f"Fast period must be less than slow period for {strategy}")
    
    # Validate backtest parameters
    if DEFAULT_BACKTEST_PARAMS["initial_capital"] <= 0:
        errors.append("Initial capital must be positive")
    
    if DEFAULT_BACKTEST_PARAMS["commission"] < 0:
        errors.append("Commission cannot be negative")
    
    # Report validation results
    if errors:
        for error in errors:
            print(f"❌ Configuration Error: {error}")
        return False
    else:
        print("✅ Configuration validation passed")
        return True

# Load environment-specific overrides
def load_environment_config():
    """Load environment-specific configuration overrides."""
    if ENVIRONMENT == "production":
        # Production-specific settings
        DEFAULT_BACKTEST_PARAMS["commission"] = 0.0001  # Higher commission in production
        DEFAULT_RISK_SETTINGS["max_risk_per_trade"] = 0.01  # Lower risk in production
    elif ENVIRONMENT == "testing":
        # Testing-specific settings
        DEFAULT_OPTIMIZATION["fast_period_range"] = range(5, 11, 5)  # Smaller range for faster testing
        DEFAULT_OPTIMIZATION["slow_period_range"] = range(20, 41, 10)
    
    return validate_config()

if __name__ == "__main__":
    print("Configuration Module")
    print("===================")
    print(f"Environment: {ENVIRONMENT}")
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"Data Directory: {DATA_DIR}")
    print(f"Results Directory: {RESULTS_DIR}")
    
    load_environment_config()