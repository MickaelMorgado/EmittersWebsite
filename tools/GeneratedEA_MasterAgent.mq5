//+------------------------------------------------------------------+
//|                     HYTEK TRADING SYSTEM v2.0                     |
//|               Master Agent Integrated EMA Crossover EA            |
//|                   MQL5 Version - MetaTrader 5                     |
//|           Optimized for Master Agent Signal Integration          |
//+------------------------------------------------------------------+

#property copyright "HYTEK"
#property version   "1.43"
#property description "Master Agent Integrated EMA Crossover - Dynamic SL/TP from Agent Parameters"
#property strict

#include <Trade\Trade.mqh>
#include <Files\FileTxt.mqh>

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+

input bool UseMasterSignals = true;        // Use Master Agent signals if available
input string SignalFilePath = "signals";   // Folder path for signal file
input double SL_Pips = 50;                 // Default Stop Loss: 50 pips
input double TP_Pips = 100;                // Default Take Profit: 100 pips
input double TS_Pips = 0;                  // Trailing Stop: 0 (disabled)
input double LotSize = 1.0;                // Fixed lot size
input double RiskPercent = 2.0;            // Alternative: risk % per trade
input int EMA_Fast = 9;                    // Fast EMA period
input int EMA_Slow = 21;                   // Slow EMA period
input string TradeStartHour = "09:50";     // Trade start time HH:MM
input string TradeEndHour = "11:00";       // Trade end time HH:MM
input bool TradeAllHours = false;          // If true, ignore time filter
input int MaxTradesPerDay = 10;            // Maximum trades per day
input double MaxDailyLoss = 500;           // Max loss in $ per day
input bool CloseAllOnMaxLoss = false;      // Close all if max loss hit

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+

CTrade trade;
int handleEMA9 = INVALID_HANDLE;
int handleEMA21 = INVALID_HANDLE;
int tradesToday = 0;
double dailyPnL = 0;
datetime lastTradeDay = 0;
datetime lastSignalTime = 0;
datetime lastHistoryUpdate = 0;
const int MAGIC_NUMBER = 12345;
string lastSignalString = "";
const string EA_VERSION = "1.43";  // Must match #property version above
const string TRADES_FILE = "trades.json";  // File to update with version

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

    Print("=== HYTEK EA v", EA_VERSION, " Initialized ===");
    Print("Master Agent Integration: ", UseMasterSignals ? "ENABLED" : "DISABLED");
    Print("Entry Strategy: Master Agent Signals (dynamic SL/TP) + 9/21 EMA Crossover (fallback)");
    Print("Default SL: ", SL_Pips, " pips | Default TP: ", TP_Pips, " pips");

    // Check broker's minimum stop distance requirement
    int minStopsPoints = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
    if(minStopsPoints > 0)
    {
        int minStopsPips = minStopsPoints / 10;
        Print("=== BROKER INFO ===");
        Print("Broker minimum stop distance: ", minStopsPoints, " points (", minStopsPips, " pips)");
        if(SL_Pips < minStopsPips)
            Print("WARNING: Default SL_Pips is less than broker minimum");
    }

    // Update trades.json with current EA version for web interface
    UpdateTradesFileVersion();

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
    Print("HYTEK EA v", EA_VERSION, " Deinitialized");
}

//+------------------------------------------------------------------+
//| UPDATE TRADES FILE WITH CURRENT EA VERSION                       |
//+------------------------------------------------------------------+

void UpdateTradesFileVersion()
{
    // Write entire file fresh with current version
    // Simpler and more reliable than string replacement

    string fileContent = "{\n  \"version\": \"" + EA_VERSION + "\",\n  \"openPositions\": [],\n  \"history\": [],\n  \"stats\": {}\n}";

    int writeHandle = FileOpen(TRADES_FILE, FILE_WRITE);
    if(writeHandle != INVALID_HANDLE)
    {
        FileWriteString(writeHandle, fileContent);
        FileClose(writeHandle);
        Print("[INIT] trades.json written with version: ", EA_VERSION);
    }
    else
    {
        Print("[WARNING] Could not write trades.json");
    }
}

//+------------------------------------------------------------------+
//| UPDATE TRADES HISTORY FROM DEAL HISTORY                          |
//+------------------------------------------------------------------+

void UpdateTradesHistory()
{
    // Update trades.json with deal history (every 1 second to keep file fresh)
    if(TimeCurrent() - lastHistoryUpdate < 1)
        return;

    lastHistoryUpdate = TimeCurrent();

    string json = "{\"version\": \"" + EA_VERSION + "\", \"history\": [";
    int dealCount = 0;
    int maxDeals = 100;  // Limit to 100 most recent trades

    // Select deal history from last 30 days
    datetime rangeStart = TimeCurrent() - (30 * 24 * 3600);

    if(HistorySelect(rangeStart, TimeCurrent()))
    {
        int totalHistory = HistoryDealsTotal();

        // Process deals in reverse order (most recent first) - limit to 100 trades
        for(int i = totalHistory - 1; i >= 0 && dealCount < maxDeals; i--)
        {
            ulong ticket = HistoryDealGetTicket(i);
            if(ticket == 0) continue;

            // Get deal properties
            long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
            double dealPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
            datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
            double dealProfit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
            double dealCommission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);

            string type = (dealType == DEAL_TYPE_BUY) ? "BUY" : "SELL";

            if(dealCount > 0) json += ",";

            json += "{\"ticket\":" + (string)ticket + ",\"type\":\"" + type +
                    "\",\"price\":" + DoubleToString(dealPrice, 5) +
                    ",\"time\":\"" + TimeToString(dealTime, TIME_DATE | TIME_MINUTES) +
                    "\",\"profit\":" + DoubleToString(dealProfit, 2) +
                    ",\"commission\":" + DoubleToString(dealCommission, 2) +
                    ",\"netProfit\":" + DoubleToString(dealProfit - dealCommission, 2) + "}";

            dealCount++;
        }
    }

    json += "], \"stats\": {}}";

    // Write to file
    int handle = FileOpen(TRADES_FILE, FILE_WRITE);
    if(handle != INVALID_HANDLE)
    {
        FileWriteString(handle, json);
        FileClose(handle);
    }
}

//+------------------------------------------------------------------+
//| EXPERT TICK FUNCTION                                             |
//+------------------------------------------------------------------+

void OnTick()
{
    // ALWAYS update trade history - do this first before any other checks
    UpdateTradesHistory();

    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);

    // Skip weekends
    if(dt.day_of_week == 0 || dt.day_of_week == 6)
        return;

    // Reset daily counters
    MqlDateTime lastDt;
    TimeToStruct(lastTradeDay, lastDt);
    if(dt.day != lastDt.day)
    {
        tradesToday = 0;
        dailyPnL = 0;
        lastTradeDay = TimeCurrent();
    }

    UpdateDailyPnL();

    // Check max daily loss
    if(MaxDailyLoss > 0 && dailyPnL < -MaxDailyLoss)
    {
        if(CloseAllOnMaxLoss) CloseAllPositions();
        return;
    }

    // Check trading hours
    if(!TradeAllHours && !IsInTradingHours())
        return;

    // Check trade limit
    if(tradesToday >= MaxTradesPerDay)
        return;

    // PRIMARY: Check for Master Agent signal
    if(UseMasterSignals)
    {
        MasterSignalData masterData;
        if(ReadMasterSignal(masterData))
        {
            ProcessMasterSignal(masterData);
            return;  // Use Master signal, skip EMA logic
        }
    }

    // FALLBACK: Use EMA crossover logic
    ProcessEMACrossover();
}

//+------------------------------------------------------------------+
//| MASTER AGENT SIGNAL STRUCTURE                                    |
//+------------------------------------------------------------------+

struct MasterSignalData
{
    string signal;              // BUY, SELL, NEUTRAL
    double stopLossPips;        // SL from Master Agent
    double takeProfitPips;      // TP from Master Agent
    double positionSize;        // Lot size from Master Agent
    double confidence;          // Confidence percentage
    datetime generatedTime;     // When signal was generated
};

//+------------------------------------------------------------------+
//| READ MASTER SIGNAL FROM FILE                                     |
//+------------------------------------------------------------------+

bool ReadMasterSignal(MasterSignalData &data)
{
    string filePath = SignalFilePath + "/master_signal.txt";

    int handle = FileOpen(filePath, FILE_READ | FILE_TXT);
    if(handle == INVALID_HANDLE)
        return false;  // No signal file yet

    // Read entire file
    string content = "";
    while(!FileIsEnding(handle))
    {
        content += FileReadString(handle);
    }
    FileClose(handle);

    // Parse minimal JSON: signal, trading.stopLossPips, trading.takeProfitPips, trading.positionSize

    // Extract signal
    int signalPos = StringFind(content, "\"signal\":");
    if(signalPos < 0) return false;

    int quotePos = StringFind(content, "\"", signalPos + 10);
    int endQuote = StringFind(content, "\"", quotePos + 1);
    data.signal = StringSubstr(content, quotePos + 1, endQuote - quotePos - 1);

    // Skip NEUTRAL signals
    if(data.signal != "BUY" && data.signal != "SELL")
        return false;

    // Extract trading.stopLossPips
    ExtractDoubleFromJson(content, "stopLossPips", data.stopLossPips);
    if(data.stopLossPips <= 0) data.stopLossPips = SL_Pips;

    // Extract trading.takeProfitPips
    ExtractDoubleFromJson(content, "takeProfitPips", data.takeProfitPips);
    if(data.takeProfitPips <= 0) data.takeProfitPips = TP_Pips;

    // Extract trading.positionSize
    ExtractDoubleFromJson(content, "positionSize", data.positionSize);
    if(data.positionSize <= 0) data.positionSize = LotSize;

    // Extract confidence
    ExtractDoubleFromJson(content, "confidence", data.confidence);
    if(data.confidence <= 0) data.confidence = 75;

    data.generatedTime = TimeCurrent();

    // Log the signal
    Print("[MASTER SIGNAL] ", data.signal, " | SL:", data.stopLossPips, "p TP:",
          data.takeProfitPips, "p Size:", data.positionSize, " | Confidence:", data.confidence, "%");

    return true;
}

//+------------------------------------------------------------------+
//| EXTRACT DOUBLE VALUE FROM JSON                                   |
//+------------------------------------------------------------------+

bool ExtractDoubleFromJson(const string &json, const string &key, double &value)
{
    string searchKey = "\"" + key + "\":";
    int keyPos = StringFind(json, searchKey);
    if(keyPos < 0) return false;

    int startPos = keyPos + StringLen(searchKey);
    string valueStr = "";

    // Extract number (could be integer or float)
    for(int i = startPos; i < StringLen(json); i++)
    {
        char ch = json[i];  // MQL5: direct string indexing
        if((ch >= '0' && ch <= '9') || ch == '.' || ch == '-')
            valueStr = valueStr + ch;  // Direct char append in MQL5
        else
            break;
    }

    if(StringLen(valueStr) == 0) return false;
    value = StringToDouble(valueStr);
    return true;
}

//+------------------------------------------------------------------+
//| PROCESS MASTER AGENT SIGNAL                                      |
//+------------------------------------------------------------------+

void ProcessMasterSignal(const MasterSignalData &data)
{
    if(data.signal == "BUY")
    {
        // Close any open short positions first
        if(HasOpenShorts())
            ClosePositionsByType(POSITION_TYPE_SELL);

        // Only open if no existing position
        if(!HasOpenTrade())
        {
            OpenMasterBuyOrder(data.positionSize, data.stopLossPips, data.takeProfitPips);
        }
    }
    else if(data.signal == "SELL")
    {
        // Close any open long positions first
        if(HasOpenLongs())
            ClosePositionsByType(POSITION_TYPE_BUY);

        // Only open if no existing position
        if(!HasOpenTrade())
        {
            OpenMasterSellOrder(data.positionSize, data.stopLossPips, data.takeProfitPips);
        }
    }
}

//+------------------------------------------------------------------+
//| OPEN BUY ORDER WITH MASTER PARAMETERS                            |
//+------------------------------------------------------------------+

void OpenMasterBuyOrder(double lotSize, double slPips, double tpPips)
{
    // Execute at market price without SL/TP initially
    if(trade.Buy(lotSize, _Symbol, 0, 0, 0, "MASTER_BUY"))
    {
        ulong ticket = trade.ResultOrder();
        Print("[MASTER BUY] Ticket=", ticket);

        Sleep(100);

        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice - (slPips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice + (tpPips * _Point), _Digits);

            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("[MASTER BUY] SUCCESS: Fill=", fillPrice, " SL=", stopLoss, " TP=", takeProfit);
                tradesToday++;
            }
            else
            {
                Print("[MASTER BUY] MODIFY FAILED: Error=", GetLastError());
            }
        }
    }
    else
    {
        Print("[MASTER BUY] EXECUTION FAILED: Error=", GetLastError());
    }
}

//+------------------------------------------------------------------+
//| OPEN SELL ORDER WITH MASTER PARAMETERS                           |
//+------------------------------------------------------------------+

void OpenMasterSellOrder(double lotSize, double slPips, double tpPips)
{
    // Execute at market price without SL/TP initially
    if(trade.Sell(lotSize, _Symbol, 0, 0, 0, "MASTER_SELL"))
    {
        ulong ticket = trade.ResultOrder();
        Print("[MASTER SELL] Ticket=", ticket);

        Sleep(100);

        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice + (slPips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice - (tpPips * _Point), _Digits);

            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("[MASTER SELL] SUCCESS: Fill=", fillPrice, " SL=", stopLoss, " TP=", takeProfit);
                tradesToday++;
            }
            else
            {
                Print("[MASTER SELL] MODIFY FAILED: Error=", GetLastError());
            }
        }
    }
    else
    {
        Print("[MASTER SELL] EXECUTION FAILED: Error=", GetLastError());
    }
}

//+------------------------------------------------------------------+
//| PROCESS EMA CROSSOVER (FALLBACK)                                 |
//+------------------------------------------------------------------+

void ProcessEMACrossover()
{
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
//| OPEN BUY ORDER (EMA FALLBACK)                                    |
//+------------------------------------------------------------------+

void OpenBuyOrder()
{
    double lotSize = CalculateLotSize(LotSize, RiskPercent);

    if(trade.Buy(lotSize, _Symbol, 0, 0, 0, "EMA_BUY"))
    {
        ulong ticket = trade.ResultOrder();

        Sleep(100);

        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice - (SL_Pips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice + (TP_Pips * _Point), _Digits);

            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("[EMA BUY] SUCCESS: Ticket=", ticket, " Fill=", fillPrice);
                tradesToday++;
            }
        }
    }
}

//+------------------------------------------------------------------+
//| OPEN SELL ORDER (EMA FALLBACK)                                   |
//+------------------------------------------------------------------+

void OpenSellOrder()
{
    double lotSize = CalculateLotSize(LotSize, RiskPercent);

    if(trade.Sell(lotSize, _Symbol, 0, 0, 0, "EMA_SELL"))
    {
        ulong ticket = trade.ResultOrder();

        Sleep(100);

        if(PositionSelectByTicket(ticket))
        {
            double fillPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = NormalizeDouble(fillPrice + (SL_Pips * _Point), _Digits);
            double takeProfit = NormalizeDouble(fillPrice - (TP_Pips * _Point), _Digits);

            if(trade.PositionModify(ticket, stopLoss, takeProfit))
            {
                Print("[EMA SELL] SUCCESS: Ticket=", ticket, " Fill=", fillPrice);
                tradesToday++;
            }
        }
    }
}

//+------------------------------------------------------------------+
//| HELPER FUNCTIONS                                                  |
//+------------------------------------------------------------------+

bool IsInTradingHours()
{
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);
    int currentTime = dt.hour * 100 + dt.min;

    int startTime = StringToInteger(TradeStartHour[0] + "" + TradeStartHour[1]) * 100 +
                    StringToInteger(TradeStartHour[3] + "" + TradeStartHour[4]);
    int endTime = StringToInteger(TradeEndHour[0] + "" + TradeEndHour[1]) * 100 +
                  StringToInteger(TradeEndHour[3] + "" + TradeEndHour[4]);

    return currentTime >= startTime && currentTime <= endTime;
}

bool HasOpenTrade()
{
    return HasOpenLongs() || HasOpenShorts();
}

bool HasOpenLongs()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket))
        {
            if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
               PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY &&
               PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER)
                return true;
        }
    }
    return false;
}

bool HasOpenShorts()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket))
        {
            if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
               PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL &&
               PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER)
                return true;
        }
    }
    return false;
}

void ClosePositionsByType(ENUM_POSITION_TYPE type)
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket))
        {
            if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
               PositionGetInteger(POSITION_TYPE) == type &&
               PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER)
            {
                trade.PositionClose(ticket);
            }
        }
    }
}

void CloseAllPositions()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket))
        {
            if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
               PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER)
            {
                trade.PositionClose(ticket);
            }
        }
    }
}

void UpdateDailyPnL()
{
    dailyPnL = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket))
        {
            if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
               PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER)
            {
                dailyPnL += PositionGetDouble(POSITION_PROFIT);
            }
        }
    }
}

double CalculateLotSize(double fixedLots, double riskPercent)
{
    if(riskPercent > 0)
    {
        double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
        double riskAmount = accountBalance * riskPercent / 100;
        // Simplified: assume 50 pips standard risk
        return NormalizeDouble(riskAmount / (50 * 10), 2);
    }
    return fixedLots;
}

void ManageTrailingStop()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket))
        {
            if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
               PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER)
            {
                double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
                double positionOpenPrice = PositionGetDouble(POSITION_PRICE_OPEN);
                double currentSL = PositionGetDouble(POSITION_SL);

                if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
                {
                    double newSL = currentPrice - (TS_Pips * _Point);
                    if(newSL > currentSL)
                        trade.PositionModify(ticket, newSL, PositionGetDouble(POSITION_TP));
                }
                else if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
                {
                    double newSL = currentPrice + (TS_Pips * _Point);
                    if(newSL < currentSL)
                        trade.PositionModify(ticket, newSL, PositionGetDouble(POSITION_TP));
                }
            }
        }
    }
}
