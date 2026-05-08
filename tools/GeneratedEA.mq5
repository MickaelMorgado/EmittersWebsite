//+------------------------------------------------------------------+
//|                     HYTEK TRADING SYSTEM                         |
//|                    9/21 EMA CROSSOVER EA                         |
//|                   MQL5 Version - MetaTrader 5                     |
//|                 Optimized Parameters v1.0                        |
//+------------------------------------------------------------------+

#property copyright "HYTEK"
#property version   "1.00"
#property description "9/21 EMA Crossover with optimized SL/TP/TS"
#property strict

#include <Trade\Trade.mqh>

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+

input double SL_Pips = 50;               // Stop Loss: 50 pips (broker minimum safe)
input double TP_Pips = 100;              // Take Profit: 100 pips (2:1 risk/reward)
input double TS_Pips = 0;                // Trailing Stop: 0 (disabled)
input double LotSize = 1.0;              // Fixed lot size
input double RiskPercent = 2.0;          // Alternative: risk % per trade
input int EMA_Fast = 9;                  // Fast EMA period
input int EMA_Slow = 21;                 // Slow EMA period
input string TradeStartHour = "09:50";   // Trade start time HH:MM
input string TradeEndHour = "11:00";     // Trade end time HH:MM
input bool TradeAllHours = false;        // If true, ignore time filter
input int MaxTradesPerDay = 10;          // Maximum trades per day
input double MaxDailyLoss = 500;         // Max loss in $ per day
input bool CloseAllOnMaxLoss = false;    // Close all if max loss hit

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+

CTrade trade;
int handleEMA9 = INVALID_HANDLE;
int handleEMA21 = INVALID_HANDLE;
int tradesToday = 0;
double dailyPnL = 0;
datetime lastTradeDay = 0;
const int MAGIC_NUMBER = 12345;

//+------------------------------------------------------------------+
//| EXPERT INITIALIZATION                                            |
//+------------------------------------------------------------------+

int OnInit()
{
    handleEMA9 = iMA(_Symbol, _Period, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE);
    handleEMA21 = iMA(_Symbol, _Period, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE);

    if(handleEMA9 == INVALID_HANDLE || handleEMA21 == INVALID_HANDLE)
    {
        Alert("Failed to create indicator handles");
        return INIT_FAILED;
    }

    trade.SetExpertMagicNumber(MAGIC_NUMBER);
    trade.SetDeviationInPoints(30);

    Print("HYTEK EA Initialized");
    Print("Entry: 9/21 EMA Crossover");
    Print("SL: ", SL_Pips, " pips | TP: ", TP_Pips, " pips");

    // Check broker's minimum stop distance requirement
    int minStopsPoints = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
    if(minStopsPoints > 0)
    {
        int minStopsPips = minStopsPoints / 10;  // Convert points to pips (for 5-digit broker)
        Print("=== BROKER INFO ===");
        Print("Broker minimum stop distance: ", minStopsPoints, " points (", minStopsPips, " pips)");
        Print("Your configured SL: ", SL_Pips, " pips");
        if(SL_Pips < minStopsPips)
        {
            Print("WARNING: SL_Pips (", SL_Pips, ") is less than broker minimum (", minStopsPips, ")");
            Print("Trades may be rejected. Consider increasing SL_Pips to at least ", minStopsPips);
        }
    }

    lastTradeDay = 0;
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| EXPERT DEINITIALIZATION                                          |
//+------------------------------------------------------------------+

void OnDeinit(const int reason)
{
    if(handleEMA9 != INVALID_HANDLE) IndicatorRelease(handleEMA9);
    if(handleEMA21 != INVALID_HANDLE) IndicatorRelease(handleEMA21);
    Print("HYTEK EA Deinitialized");
}

//+------------------------------------------------------------------+
//| EXPERT TICK FUNCTION                                             |
//+------------------------------------------------------------------+

void OnTick()
{
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);

    if(dt.day_of_week == 0 || dt.day_of_week == 6)
        return;

    MqlDateTime lastDt;
    TimeToStruct(lastTradeDay, lastDt);

    if(dt.day != lastDt.day)
    {
        tradesToday = 0;
        dailyPnL = 0;
        lastTradeDay = TimeCurrent();
    }

    UpdateDailyPnL();

    if(MaxDailyLoss > 0 && dailyPnL < -MaxDailyLoss)
    {
        if(CloseAllOnMaxLoss) CloseAllPositions();
        return;
    }

    if(!TradeAllHours && !IsInTradingHours())
        return;

    if(tradesToday >= MaxTradesPerDay)
        return;

    double ema9Array[2], ema21Array[2];

    if(CopyBuffer(handleEMA9, 0, 0, 2, ema9Array) != 2)
        return;
    if(CopyBuffer(handleEMA21, 0, 0, 2, ema21Array) != 2)
        return;

    double ema9Prev = ema9Array[1];
    double ema9Curr = ema9Array[0];
    double ema21Prev = ema21Array[1];
    double ema21Curr = ema21Array[0];

    bool bullishCrossover = (ema9Prev <= ema21Prev) && (ema9Curr > ema21Curr);
    bool bearishCrossover = (ema9Prev >= ema21Prev) && (ema9Curr < ema21Curr);

    if(bullishCrossover && HasOpenShorts())
        ClosePositionsByType(POSITION_TYPE_SELL);

    if(bearishCrossover && HasOpenLongs())
        ClosePositionsByType(POSITION_TYPE_BUY);

    if(bullishCrossover && !HasOpenTrade())
        OpenBuyOrder();

    if(bearishCrossover && !HasOpenTrade())
        OpenSellOrder();

    if(TS_Pips > 0)
        ManageTrailingStop();
}

//+------------------------------------------------------------------+
//| OPEN BUY ORDER                                                    |
//+------------------------------------------------------------------+

void OpenBuyOrder()
{
    double lotSize = CalculateLotSize(LotSize, RiskPercent);

    // Execute at market price without SL/TP
    if(trade.Buy(lotSize, _Symbol, 0, 0, 0, "HYTEK_BUY"))
    {
        ulong ticket = trade.ResultOrder();
        Print("BUY executed: Ticket=", ticket);

        // Small delay for position to settle
        Sleep(100);

        // Get actual fill price from the position
        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice - (SL_Pips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice + (TP_Pips * _Point), _Digits);

            Print("BUY Fill Price: ", fillPrice, " SL calc: ", stopLoss, " TP calc: ", takeProfit);
            Print("BUY SL distance: ", (fillPrice - stopLoss) / _Point, " pips, TP distance: ", (takeProfit - fillPrice) / _Point, " pips");

            // Modify with calculated stops based on actual fill
            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("BUY Order Opened: Ticket=", ticket, " Fill=", fillPrice, " SL=", stopLoss, " TP=", takeProfit);
                tradesToday++;
            }
            else
            {
                Print("BUY Modify Failed: Ticket=", ticket, " Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
            }
        }
        else
        {
            Print("BUY Position select failed: Ticket=", ticket);
        }
    }
    else
    {
        Print("BUY Order Failed: Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
    }
}

//+------------------------------------------------------------------+
//| OPEN SELL ORDER                                                   |
//+------------------------------------------------------------------+

void OpenSellOrder()
{
    double lotSize = CalculateLotSize(LotSize, RiskPercent);

    // Execute at market price without SL/TP
    if(trade.Sell(lotSize, _Symbol, 0, 0, 0, "HYTEK_SELL"))
    {
        ulong ticket = trade.ResultOrder();
        Print("SELL executed: Ticket=", ticket);

        // Small delay for position to settle
        Sleep(100);

        // Get actual fill price from the position
        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice + (SL_Pips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice - (TP_Pips * _Point), _Digits);

            Print("SELL Fill Price: ", fillPrice, " SL calc: ", stopLoss, " TP calc: ", takeProfit);
            Print("SELL SL distance: ", (stopLoss - fillPrice) / _Point, " pips, TP distance: ", (fillPrice - takeProfit) / _Point, " pips");

            // Modify with calculated stops based on actual fill
            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("SELL Order Opened: Ticket=", ticket, " Fill=", fillPrice, " SL=", stopLoss, " TP=", takeProfit);
                tradesToday++;
            }
            else
            {
                Print("SELL Modify Failed: Ticket=", ticket, " Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
            }
        }
        else
        {
            Print("SELL Position select failed: Ticket=", ticket);
        }
    }
    else
    {
        Print("SELL Order Failed: Error=", GetLastError(), " RetCode=", trade.ResultRetcode());
    }
}

//+------------------------------------------------------------------+
//| CLOSE POSITIONS BY TYPE                                          |
//+------------------------------------------------------------------+

void ClosePositionsByType(ENUM_POSITION_TYPE posType)
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) != MAGIC_NUMBER) continue;
        if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
        if(PositionGetInteger(POSITION_TYPE) != posType) continue;

        if(!trade.PositionClose(ticket))
            Print("Position Close Failed: Ticket=", ticket, " Error=", GetLastError());
        else
            Print("Position Closed: Ticket=", ticket);
    }
}

//+------------------------------------------------------------------+
//| CLOSE ALL POSITIONS                                              |
//+------------------------------------------------------------------+

void CloseAllPositions()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) != MAGIC_NUMBER) continue;
        if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

        trade.PositionClose(ticket);
    }
}

//+------------------------------------------------------------------+
//| MANAGE TRAILING STOP                                             |
//+------------------------------------------------------------------+

void ManageTrailingStop()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) != MAGIC_NUMBER) continue;
        if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

        int posType = (int)PositionGetInteger(POSITION_TYPE);
        double stopLoss = PositionGetDouble(POSITION_SL);
        double trailingStop = TS_Pips * _Point;
        double newSL = 0;
        bool modify = false;

        if(posType == POSITION_TYPE_BUY)
        {
            newSL = SymbolInfoDouble(_Symbol, SYMBOL_BID) - trailingStop;
            if(newSL > stopLoss)
                modify = true;
        }
        else if(posType == POSITION_TYPE_SELL)
        {
            newSL = SymbolInfoDouble(_Symbol, SYMBOL_ASK) + trailingStop;
            if(newSL < stopLoss)
                modify = true;
        }

        if(modify)
        {
            double currentTP = PositionGetDouble(POSITION_TP);
            trade.PositionModify(ticket, newSL, currentTP);
        }
    }
}

//+------------------------------------------------------------------+
//| CALCULATE LOT SIZE                                               |
//+------------------------------------------------------------------+

double CalculateLotSize(double fixedLot, double riskPercent)
{
    if(fixedLot > 0)
        return NormalizeDouble(fixedLot, 2);

    if(riskPercent <= 0)
        return 0.1;

    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = balance * (riskPercent / 100);
    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);

    double pipValue = tickValue / tickSize;
    double lotSize = NormalizeDouble(riskAmount / (SL_Pips * pipValue), 2);

    double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);

    lotSize = MathMax(lotSize, minLot);
    lotSize = MathMin(lotSize, maxLot);

    return lotSize;
}

//+------------------------------------------------------------------+
//| CHECK TRADING HOURS                                              |
//+------------------------------------------------------------------+

bool IsInTradingHours()
{
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);

    int hour = dt.hour;
    int minute = dt.min;

    int startHour = (int)StringToInteger(StringSubstr(TradeStartHour, 0, 2));
    int startMin = (int)StringToInteger(StringSubstr(TradeStartHour, 3, 2));
    int endHour = (int)StringToInteger(StringSubstr(TradeEndHour, 0, 2));
    int endMin = (int)StringToInteger(StringSubstr(TradeEndHour, 3, 2));

    int currentTime = hour * 60 + minute;
    int startTime = startHour * 60 + startMin;
    int endTime = endHour * 60 + endMin;

    return (currentTime >= startTime && currentTime <= endTime);
}

//+------------------------------------------------------------------+
//| UPDATE DAILY P&L                                                  |
//+------------------------------------------------------------------+

void UpdateDailyPnL()
{
    dailyPnL = 0;

    MqlDateTime currentDt;
    TimeToStruct(TimeCurrent(), currentDt);

    for(int i = 0; i < HistoryDealsTotal(); i++)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket == 0) continue;

        datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
        MqlDateTime dealDt;
        TimeToStruct(dealTime, dealDt);

        if(dealDt.day != currentDt.day) continue;

        if(HistoryDealGetInteger(ticket, DEAL_MAGIC) != MAGIC_NUMBER) continue;
        if(HistoryDealGetString(ticket, DEAL_SYMBOL) != _Symbol) continue;

        int dealEntry = (int)HistoryDealGetInteger(ticket, DEAL_ENTRY);
        if(dealEntry != DEAL_ENTRY_OUT) continue;

        double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
        double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
        double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);

        dailyPnL += profit + commission + swap;
    }
}

//+------------------------------------------------------------------+
//| CHECK POSITION STATUS                                            |
//+------------------------------------------------------------------+

bool HasOpenTrade()
{
    for(int i = 0; i < PositionsTotal(); i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER && PositionGetString(POSITION_SYMBOL) == _Symbol)
            return true;
    }
    return false;
}

bool HasOpenLongs()
{
    for(int i = 0; i < PositionsTotal(); i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER &&
           PositionGetString(POSITION_SYMBOL) == _Symbol &&
           PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
            return true;
    }
    return false;
}

bool HasOpenShorts()
{
    for(int i = 0; i < PositionsTotal(); i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER &&
           PositionGetString(POSITION_SYMBOL) == _Symbol &&
           PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
            return true;
    }
    return false;
}

//+------------------------------------------------------------------+
//| END OF EA                                                         |
//+------------------------------------------------------------------+
