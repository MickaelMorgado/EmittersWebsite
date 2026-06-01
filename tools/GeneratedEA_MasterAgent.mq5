//+------------------------------------------------------------------+
//|                     HYTEK TRADING SYSTEM v2.0                     |
//|               Master Agent Integrated EMA Crossover EA            |
//|                   MQL5 Version - MetaTrader 5                     |
//|           Optimized for Master Agent Signal Integration          |
//+------------------------------------------------------------------+

#property copyright "HYTEK"
#property version   "1.65"
#property description "Master Agent Integrated EMA Crossover - Dynamic SL/TP from Agent Parameters + Open Positions JSON"
#property strict

#include <Trade\Trade.mqh>
#include <Files\FileTxt.mqh>

//+------------------------------------------------------------------+
//| CONFIGURATION                                                     |
//+------------------------------------------------------------------+

const string SIGNAL_FILE_PATH = "signal.txt";
const double DEFAULT_SL_DISTANCE = 100.0;
const double DEFAULT_TP_DISTANCE = 200.0;
const double DEFAULT_LOT_SIZE = 0.01;
const int EMA_FAST_PERIOD = 9;
const int EMA_SLOW_PERIOD = 21;
const int MAGIC_NUMBER = 12345;
const string EA_VERSION = "1.65";
const string TRADES_FILE = "trades.json";

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+

CTrade trade;
int handleEMA9 = INVALID_HANDLE;
int handleEMA21 = INVALID_HANDLE;
datetime lastHistoryUpdate = 0;
string lastProcessedSignalTimestamp = "";

//+------------------------------------------------------------------+
//| EXPERT INITIALIZATION                                            |
//+------------------------------------------------------------------+

int OnInit()
{
    handleEMA9 = iMA(_Symbol, _Period, EMA_FAST_PERIOD, 0, MODE_EMA, PRICE_CLOSE);
    handleEMA21 = iMA(_Symbol, _Period, EMA_SLOW_PERIOD, 0, MODE_EMA, PRICE_CLOSE);

    if(handleEMA9 == INVALID_HANDLE || handleEMA21 == INVALID_HANDLE)
    {
        Alert("Failed to create indicator handles");
        return INIT_FAILED;
    }

    trade.SetExpertMagicNumber(MAGIC_NUMBER);
    trade.SetDeviationInPoints(30);

    Print("=== HYTEK EA v", EA_VERSION, " Initialized ===");
    Print("Master Agent Signals: ENABLED");
    Print("Signal file: ", SIGNAL_FILE_PATH);

    UpdateTradesFileVersion();
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
//| UPDATE OPEN POSITIONS TO POSITIONS.JSON                          |
//+------------------------------------------------------------------+

void UpdateOpenPositions()
{
    string json = "{\"version\":\"" + EA_VERSION + "\",\"openPositions\":[";
    int posCount = 0;

    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        if(!PositionSelectByTicket(ticket)) continue;

        // Filter to only our EA's trades (matching magic number)
        long magicNumber = PositionGetInteger(POSITION_MAGIC);
        if(magicNumber != MAGIC_NUMBER) continue;

        // Get position properties
        string symbol = PositionGetString(POSITION_SYMBOL);
        long type = PositionGetInteger(POSITION_TYPE);
        double entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
        double stopLoss = PositionGetDouble(POSITION_SL);
        double takeProfit = PositionGetDouble(POSITION_TP);
        double profit = PositionGetDouble(POSITION_PROFIT);
        double volume = PositionGetDouble(POSITION_VOLUME);
        datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);

        string typeStr = (type == POSITION_TYPE_BUY) ? "BUY" : "SELL";

        if(posCount > 0) json += ",";

        // Build position JSON with SL and TP
        json += "{\"ticket\":" + (string)ticket +
                ",\"symbol\":\"" + symbol +
                "\",\"type\":\"" + typeStr +
                "\",\"entryPrice\":" + DoubleToString(entryPrice, _Digits) +
                ",\"currentPrice\":" + DoubleToString(currentPrice, _Digits) +
                ",\"stopLoss\":" + DoubleToString(stopLoss, _Digits) +
                ",\"takeProfit\":" + DoubleToString(takeProfit, _Digits) +
                ",\"volume\":" + DoubleToString(volume, 2) +
                ",\"profit\":" + DoubleToString(profit, 2) +
                ",\"openTime\":\"" + TimeToString(openTime, TIME_DATE | TIME_MINUTES) + "\"}";

        posCount++;
    }

    json += "],\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE | TIME_MINUTES) + "\"}";

    // Write to positions.json file
    int handle = FileOpen("positions.json", FILE_WRITE);
    if(handle != INVALID_HANDLE)
    {
        FileWriteString(handle, json);
        FileClose(handle);
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
    // Update open positions (every tick for live data)
    UpdateOpenPositions();

    // Update trade history
    UpdateTradesHistory();

    // Check for Master Agent signal
    MasterSignalData masterData = {0};
    if(ReadMasterSignal(masterData))
    {
        Print("[OnTick] Signal: ", masterData.signal);
        ProcessMasterSignal(masterData);
    }
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
    string filePath = SIGNAL_FILE_PATH;

    int handle = FileOpen(filePath, FILE_READ | FILE_TXT);
    if(handle == INVALID_HANDLE)
    {
        Print("[ReadMasterSignal] FAILED: File not found: ", filePath);
        return false;
    }

    // Read entire file
    string content = "";
    while(!FileIsEnding(handle))
    {
        content += FileReadString(handle);
    }
    FileClose(handle);

    Print("[ReadMasterSignal] File read, content length: ", StringLen(content));
    Print("[ReadMasterSignal] Content: ", content);

    // Extract signal - search for "signal":"BUY" or "signal":"SELL"
    if(StringFind(content, "\"signal\":\"BUY\"") >= 0)
        data.signal = "BUY";
    else if(StringFind(content, "\"signal\":\"SELL\"") >= 0)
        data.signal = "SELL";
    else
    {
        return false;
    }

    // Extract timestamp to avoid duplicate execution
    int tsPos = StringFind(content, "\"timestamp\":\"");
    if(tsPos < 0) return false;
    int tsStart = tsPos + 14;
    int tsEnd = StringFind(content, "\"", tsStart);
    string timestamp = StringSubstr(content, tsStart, tsEnd - tsStart);

    // Skip if we already processed this signal
    if(timestamp == lastProcessedSignalTimestamp)
    {
        Print("[ReadMasterSignal] Skipping duplicate signal (", timestamp, ")");
        return false;
    }

    lastProcessedSignalTimestamp = timestamp;
    Print("[ReadMasterSignal] Signal: ", data.signal);

    // Use defaults - price distance (not pips)
    data.stopLossPips = DEFAULT_SL_DISTANCE;
    data.takeProfitPips = DEFAULT_TP_DISTANCE;
    data.positionSize = DEFAULT_LOT_SIZE;
    data.confidence = 50;

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

    // Skip whitespace
    while(startPos < StringLen(json) && (json[startPos] == ' ' || json[startPos] == '\t' || json[startPos] == '\n'))
        startPos++;

    // Extract number (could be integer or float)
    for(int i = startPos; i < StringLen(json); i++)
    {
        char ch = json[i];
        if((ch >= '0' && ch <= '9') || ch == '.' || ch == '-')
            valueStr = valueStr + ch;
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
        if(HasOpenShorts())
            ClosePositionsByType(POSITION_TYPE_SELL);

        if(!HasOpenTrade())
            OpenMasterBuyOrder(data.positionSize, data.stopLossPips, data.takeProfitPips);
    }
    else if(data.signal == "SELL")
    {
        if(HasOpenLongs())
            ClosePositionsByType(POSITION_TYPE_BUY);

        if(!HasOpenTrade())
            OpenMasterSellOrder(data.positionSize, data.stopLossPips, data.takeProfitPips);
    }
}

//+------------------------------------------------------------------+
//| OPEN BUY ORDER WITH MASTER PARAMETERS                            |
//+------------------------------------------------------------------+

void OpenMasterBuyOrder(double lotSize, double slDistance, double tpDistance)
{
    double askPrice = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double stopLoss = NormalizeDouble(askPrice - slDistance, _Digits);
    double takeProfit = NormalizeDouble(askPrice + tpDistance, _Digits);

    if(trade.Buy(lotSize, _Symbol, 0, stopLoss, takeProfit, "MASTER_BUY"))
    {
        ulong ticket = trade.ResultOrder();
        Print("[MASTER BUY] Ticket=", ticket, " Entry=", askPrice, " SL=", stopLoss, " TP=", takeProfit);
    }
    else
    {
        Print("[MASTER BUY] FAILED: Error=", GetLastError());
    }
}

//+------------------------------------------------------------------+
//| OPEN SELL ORDER WITH MASTER PARAMETERS                           |
//+------------------------------------------------------------------+

void OpenMasterSellOrder(double lotSize, double slDistance, double tpDistance)
{
    double bidPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double stopLoss = NormalizeDouble(bidPrice + slDistance, _Digits);
    double takeProfit = NormalizeDouble(bidPrice - tpDistance, _Digits);

    if(trade.Sell(lotSize, _Symbol, 0, stopLoss, takeProfit, "MASTER_SELL"))
    {
        ulong ticket = trade.ResultOrder();
        Print("[MASTER SELL] Ticket=", ticket, " Entry=", bidPrice, " SL=", stopLoss, " TP=", takeProfit);
    }
    else
    {
        Print("[MASTER SELL] FAILED: Error=", GetLastError());
    }
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

