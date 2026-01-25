"""
Data loading utilities for MT5 CSV files.

This module provides functions to load and process CSV files exported from MetaTrader 5.
It handles the specific format used by MT5 and converts it to a standard format for analysis.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging
from typing import Optional, Tuple, Union

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_mt5_csv(filepath: Union[str, Path], 
                 delimiter: str = '\t',
                 timezone: str = 'UTC') -> pd.DataFrame:
    """
    Load and process MT5 CSV file into a pandas DataFrame.
    
    MT5 CSV format typically has these columns:
    <DATE>, <TIME>, <OPEN>, <HIGH>, <LOW>, <CLOSE>
    
    Args:
        filepath: Path to the CSV file
        delimiter: Delimiter used in the CSV file (default: tab)
        timezone: Timezone for the datetime index (default: UTC)
    
    Returns:
        DataFrame with OHLC data and datetime index
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If the file format is invalid
    """
    filepath = Path(filepath)
    
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    
    logger.info(f"Loading MT5 CSV file: {filepath}")
    
    try:
        # Read CSV file
        df = pd.read_csv(filepath, delimiter=delimiter)
        
        # Check if required columns exist
        required_columns = ['<DATE>', '<TIME>', '<OPEN>', '<HIGH>', '<LOW>', '<CLOSE>']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Combine date and time columns
        df['datetime'] = pd.to_datetime(df['<DATE>'] + ' ' + df['<TIME>'])
        
        # Set datetime as index
        df.set_index('datetime', inplace=True)
        
        # Select only OHLC columns and rename them
        ohlc_data = df[['<OPEN>', '<HIGH>', '<LOW>', '<CLOSE>']].copy()
        ohlc_data.columns = ['open', 'high', 'low', 'close']
        
        # Convert to numeric, handling any non-numeric values
        ohlc_data = ohlc_data.apply(pd.to_numeric, errors='coerce')
        
        # Remove any rows with NaN values
        ohlc_data.dropna(inplace=True)
        
        # Sort by datetime to ensure chronological order
        ohlc_data.sort_index(inplace=True)
        
        # Set timezone
        if timezone:
            ohlc_data.index = ohlc_data.index.tz_localize(timezone)
        
        logger.info(f"Successfully loaded {len(ohlc_data)} rows of data")
        logger.info(f"Date range: {ohlc_data.index.min()} to {ohlc_data.index.max()}")
        
        return ohlc_data
        
    except Exception as e:
        logger.error(f"Error loading CSV file: {e}")
        raise


def validate_data(df: pd.DataFrame) -> bool:
    """
    Validate OHLC data for common issues.
    
    Args:
        df: DataFrame with OHLC data
        
    Returns:
        True if data is valid, False otherwise
    """
    if df.empty:
        logger.warning("DataFrame is empty")
        return False
    
    # Check for required columns
    required_columns = ['open', 'high', 'low', 'close']
    if not all(col in df.columns for col in required_columns):
        logger.warning("Missing required OHLC columns")
        return False
    
    # Check for NaN values
    nan_count = df[required_columns].isna().sum().sum()
    if nan_count > 0:
        logger.warning(f"Found {nan_count} NaN values in OHLC data")
    
    # Check OHLC consistency (high >= open, high >= close, low <= open, low <= close)
    invalid_high = ((df['high'] < df['open']) | (df['high'] < df['close'])).sum()
    invalid_low = ((df['low'] > df['open']) | (df['low'] > df['close'])).sum()
    
    if invalid_high > 0:
        logger.warning(f"Found {invalid_high} invalid high values (high < open or high < close)")
    
    if invalid_low > 0:
        logger.warning(f"Found {invalid_low} invalid low values (low > open or low > close)")
    
    # Check for duplicate timestamps
    duplicates = df.index.duplicated().sum()
    if duplicates > 0:
        logger.warning(f"Found {duplicates} duplicate timestamps")
        df = df[~df.index.duplicated(keep='first')]
    
    return True


def resample_data(df: pd.DataFrame, timeframe: str = '1H') -> pd.DataFrame:
    """
    Resample OHLC data to a different timeframe.
    
    Args:
        df: DataFrame with OHLC data
        timeframe: Target timeframe (e.g., '1H', '4H', '1D')
    
    Returns:
        Resampled DataFrame
    """
    logger.info(f"Resampling data to {timeframe}")
    
    resampled = df.resample(timeframe).agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last'
    })
    
    # Remove rows where all values are NaN (e.g., weekends)
    resampled.dropna(how='all', inplace=True)
    
    logger.info(f"Resampled to {len(resampled)} rows")
    return resampled


def get_data_summary(df: pd.DataFrame) -> dict:
    """
    Get a summary of the data.
    
    Args:
        df: DataFrame with OHLC data
        
    Returns:
        Dictionary with data summary
    """
    summary = {
        'total_rows': len(df),
        'date_range': {
            'start': df.index.min().strftime('%Y-%m-%d %H:%M:%S'),
            'end': df.index.max().strftime('%Y-%m-%d %H:%M:%S')
        },
        'price_range': {
            'min': df['low'].min(),
            'max': df['high'].max(),
            'avg': df['close'].mean()
        },
        'missing_values': df.isna().sum().to_dict(),
        'data_frequency': df.index.freq
    }
    
    return summary


def load_sample_data() -> pd.DataFrame:
    """
    Create sample EURUSD 5-minute data for testing purposes.
    
    Returns:
        DataFrame with sample OHLC data
    """
    logger.info("Creating sample EURUSD 5-minute data")
    
    # Create date range for 30 days of 5-minute data
    start_date = pd.Timestamp('2025-01-01 00:00:00')
    end_date = pd.Timestamp('2025-01-31 23:55:00')
    dates = pd.date_range(start=start_date, end=end_date, freq='5min')
    
    # Set random seed for reproducible results
    np.random.seed(42)
    
    # Generate sample price data
    base_price = 1.1000
    prices = []
    current_price = base_price
    
    for _ in dates:
        # Random walk with some trend
        change = np.random.normal(0, 0.0005)  # Small random change
        current_price += change
        
        # Add some volatility
        volatility = 0.0002
        open_price = current_price + np.random.normal(0, volatility)
        close_price = open_price + np.random.normal(0, volatility)
        high_price = max(open_price, close_price) + abs(np.random.normal(0, volatility))
        low_price = min(open_price, close_price) - abs(np.random.normal(0, volatility))
        
        prices.append({
            'open': round(open_price, 5),
            'high': round(high_price, 5),
            'low': round(low_price, 5),
            'close': round(close_price, 5)
        })
    
    # Create DataFrame
    df = pd.DataFrame(prices, index=dates)
    df.index.name = 'datetime'
    
    logger.info(f"Created sample data with {len(df)} rows")
    return df


if __name__ == "__main__":
    # Example usage
    print("Data Loader Module")
    print("==================")
    
    # Load sample data
    sample_data = load_sample_data()
    print(f"Sample data shape: {sample_data.shape}")
    print(f"Date range: {sample_data.index.min()} to {sample_data.index.max()}")
    print(f"Price range: {sample_data['low'].min():.5f} to {sample_data['high'].max():.5f}")
    
    # Validate data
    is_valid = validate_data(sample_data)
    print(f"Data validation: {'PASS' if is_valid else 'FAIL'}")
    
    # Get summary
    summary = get_data_summary(sample_data)
    print(f"Data summary: {summary}")