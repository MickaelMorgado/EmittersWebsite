# MikaBot Dashboard

AI trading bot performance analytics and self-learning system.

## Overview

| Attribute | Value |
|-----------|-------|
| **Route** | `/trading-bot` |
| **Type** | Private (requires auth) |
| **Stack** | Next.js + React |
| **Data Source** | FileSignalEA (MT5) |

## Features

- Real-time trade execution monitoring
- Performance analytics (win rate, P&L, streak)
- Trade history with entry/exit prices
- AI-powered insights and pattern detection
- Recommendations for strategy improvements

## Data Flow

```
MT5 (Wine/Mac)
    ↓ trades
FileSignalEA.mq5
    ↓ logs
Python signal script → JSON file
    ↓ reads
API endpoint → Dashboard UI
```

## Related Projects

- **MikaBot** (`~/development/MikaBot/`) - Trading bot source code
- **FileSignalEA** - MT5 EA that executes trades based on signals

## Future Enhancements

- Connect to live trade data via shared file
- Ollama integration for AI analysis
- Pattern recognition engine
- Strategy optimizer