# App6 Glossary

## Trading Terms (Finance Context)

| Abbreviation | Full Term | Description |
|---------------|-----------|-------------|
| SL | Stop Loss | Price level to close a losing trade and limit risk |
| TP | Take Profit | Price level to close a winning trade and secure profit |
| BULL | Bullish | Upward price direction / buy signal |
| BEAR | Bearish | Downward price direction / sell signal |
| P/L | Profit/Loss | Net result of a trade in points or currency |
| R | Risk Unit | Single unit of risk (SL distance) |

## Technical Indicators

| Abbreviation | Full Term | Description |
|---------------|-----------|-------------|
| EA | Expert Advisor | MetaTrader automated trading script |
| TS | Trailing Stop | Dynamic stop loss that moves with price |
| CSID | Change in State of Delivery | ICT term - Breakout signal when price breaks highest high or lowest low in lookback |
| ATR | Average True Range | Volatility indicator measuring price range |
| MA | Moving Average | Trend-following indicator (SMA by default) |
| MADirection | Moving Average Direction | Direction of MA trend (bullish/bearish/neutral) |
| Accel | Acceleration | Rate of change in MA direction |

## Time & Session Terms

| Abbreviation | Full Term | Description |
|---------------|-----------|-------------|
| BT | BackTesting | Testing strategy on historical data |
| TTR | Trading Time Range | Session time window for trading (default 09:50-11:00) |
| LookbackPeriod | Lookback Period | Number of candles to analyze for CSID (default 20) |
| ATR_Period | ATR Period | Number of candles for ATR calculation (default 20) |
| MA_Period | MA Period | Number of candles for Moving Average (configurable) |

## Web App Elements

| Abbreviation | Full Term | Description |
|---------------|-----------|-------------|
| RC | Results Comparison | Panel comparing backtest vs live EA results |
| BTR | Backtesting Results | Panel displaying backtest trades and stats |
| LPRB | Load Params and Run Backtest | Play button to load saved parameters and run backtest |
| MQL | MetaQuotes Language | Code generation panel for MT5 expert advisor |
| Algo | Algorithm | Strategy configuration panel |
| Review | Review Panel | Panel for reviewing generated code |

## Data Structures

| Abbreviation | Full Term | Description |
|---------------|-----------|-------------|
| OHLC | Open High Low Close | Candle price data |
| EnumMT5OHLC | MT5 OHLC Enum | Index mapping for OHLC data (0=DATE,1=TIME,2=OPEN,3=HIGH,4=LOW,5=CLOSE) |
| EnumDirection | Direction Enum | BULL=up, BEAR=down |
| EnumArrayOfSignalsIndex | Signals Index Enum | 0=CSID, 1=TTR, 2=ATR, 3=MADirection |
| EnumStrategy | Strategy Enum | CSID, CSID_W_MA, CSID_W_MA_DynamicTS |
| EnumActionType | Action Type Enum | TAKE_A_TRADE, CLOSE_POSITION, etc. |

## Trade Execution

| Abbreviation | Full Term | Description |
|---------------|-----------|-------------|
| CLOSED_BY_SL | Closed By Stop Loss | Trade closed at SL price |
| CLOSED_BY_TP | Closed By Take Profit | Trade closed at TP price |
| Direction | Trade Direction | 1=BULL (buy), -1=BEAR (sell) |
| atr_triggered | ATR Triggered | Flag indicating ATR signal received |
| csid_signal | CSID Signal | Flag indicating CSID breakout detected |
| in_session | In Session | Flag indicating current time is within trading hours |

## Configuration Parameters

| Abbreviation | Parameter | Default |
|---------------|-----------|---------|
| sessionStart | Session Start Time | 09:50:00 |
| sessionEnd | Session End Time | 11:00:00 |
| SL_PRICE | Stop Loss Distance | 0.0003 (30 pips) |
| TP_PRICE | Take Profit Distance | 0.0009 (90 pips) |
| MA_THRESHOLD | MA Direction Threshold | 0.003 |
| ACCEL_THRESHOLD | MA Acceleration Threshold | 0.00003 |
| LOT_SIZE | Trade Lot Size | 1.0 |