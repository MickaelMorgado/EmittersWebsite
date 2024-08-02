//+------------------------------------------------------------------+
//|                                             UtilityFunctions.mqh |
//|                                                          Mickael |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Mickael"
#property link      "https://www.mql5.com"
//+------------------------------------------------------------------+
//| defines                                                          |
//+------------------------------------------------------------------+
// #define MacrosHello   "Hello, world!"
// #define MacrosYear    2010
//+------------------------------------------------------------------+
//| DLL imports                                                      |
//+------------------------------------------------------------------+
// #import "user32.dll"
//   int      SendMessageA(int hWnd,int Msg,int wParam,int lParam);
// #import "my_expert.dll"
//   int      ExpertRecalculate(int wParam,int lParam);
// #import
//+------------------------------------------------------------------+
//| EX5 imports                                                      |
//+------------------------------------------------------------------+
// #import "stdlib.ex5"
//   string ErrorDescription(int error_code);
// #import
//+------------------------------------------------------------------+
//+------------------------------------------------------------------+
//|                   UtilityFunctions.mqh                           |
//+------------------------------------------------------------------+
bool IsPositionOpen(const string symbol)
  {
   return PositionSelect(symbol);
  }

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
double GetCurrentPrice(const string symbol)
  {
   return SymbolInfoDouble(symbol, SYMBOL_BID);
  }

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
bool isNewBar(const string symbol, ENUM_TIMEFRAMES timeframe)
  {
   static datetime last_time = 0;
   datetime lastbar_time = (datetime)SeriesInfoInteger(symbol, timeframe, SERIES_LASTBAR_DATE);

   if(last_time == 0)
     {
      last_time = lastbar_time;
      return false;
     }

   if(last_time != lastbar_time)
     {
      last_time = lastbar_time;
      return true;
     }
   return false;
  }

//+------------------------------------------------------------------+
//| Get historical rates                                             |
//+------------------------------------------------------------------+
void GetRates(const string symbol, ENUM_TIMEFRAMES timeframe, int count, MqlRates &rates[])
  {
   if(count < 1)
     {
      Print("Set a valid rate count");
      return;
     }
// Resize the array to fit the required number of rates
   ArrayResize(rates, count);

// Retrieve historical rates
   if(CopyRates(symbol, timeframe, 0, count, rates) == -1)
     {
      Print("Failed to get historical rates. Error code: ", GetLastError());
     }
  }

//+------------------------------------------------------------------+
//| Detect if the candle is a hammer type (bullish or bearish)       |
//+------------------------------------------------------------------+
bool IsHammerCandle(const string symbol, int shift, bool &isBullish)
  {
   double open = iOpen(symbol, PERIOD_CURRENT, shift);
   double close = iClose(symbol, PERIOD_CURRENT, shift);
   double high = iHigh(symbol, PERIOD_CURRENT, shift);
   double low = iLow(symbol, PERIOD_CURRENT, shift);

   double bodySize = MathAbs(close - open);
   double lowerShadow = open < close ? open - low : close - low;
   double upperShadow = high - (open > close ? open : close);

   double range = high - low;

// Check to avoid division by zero
   if(range == 0)
     {
      return false;
     }

// Define thresholds for a hammer
   double bodyToShadowRatio = 0.5; // Body should be less than 50% (default 25%) of the total range
   double minShadowLength = 2 * bodySize; // Lower shadow should be at least twice the body size (default 2 * bodySize)

   bool isHammer = (bodySize / range <= bodyToShadowRatio) && (lowerShadow >= minShadowLength) && (upperShadow <= bodySize);

   if(isHammer)
     {
      isBullish = close > open;
      return true;
     }
   return false;
  }

//+------------------------------------------------------------------+
//| Draw vertical line                                               |
//+------------------------------------------------------------------+
MqlRates DrawVerticalLine(MqlRates &rate, string lineName, color lineColor)
  {
   MqlRates currentRate = rate;
   Print(rate.time);
   datetime lineTime = currentRate.time; // TimeCurrent();
   double linePrice = currentRate.close;

// Create a vertical line
   bool lineCreated = ObjectCreate(
                         0,         // chart_id (0 represents the current chart)
                         lineName,  // object name
                         OBJ_VLINE, // object type (vertical line)
                         0,         // window index (0 represents the main chart window)
                         lineTime,  // time of the anchor point
                         linePrice  // price of the anchor point
                      );

   if(lineCreated)
     {
      ObjectSetInteger(0, lineName, OBJPROP_COLOR, lineColor);
     }

   return currentRate;
  }

//+------------------------------------------------------------------+
//| Candle Type                                                      |
//+------------------------------------------------------------------+
enum CandleType
  {
   bullish,
   bearish,
   sideWays
  };

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
CandleType getCandleType(const MqlRates &rate)
  {
   if(rate.open <= rate.close)
     {
      return CandleType::bullish;
     }
   else
     {
      return CandleType::bearish;
     }
  }

//+------------------------------------------------------------------+
//| Draw a rectangle on the chart                                    |
//+------------------------------------------------------------------+
void DrawRectangle(const string name, datetime time1, double price1, datetime time2, double price2, color boxColor)
  {
// Create a rectangle object
   if(ObjectCreate(0, name, OBJ_RECTANGLE, 0, time1, price1, time2, price2))
     {
      // Set rectangle properties
      ObjectSetInteger(0, name, OBJPROP_COLOR, boxColor);        // Color of the rectangle
      ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_FLAT); // Border type (flat, raised, sunken, etc.)
      ObjectSetInteger(0, name, OBJPROP_WIDTH, 2);             // Border width
      ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_SOLID);   // Border style (solid, dashed, dotted, etc.)
      ObjectSetInteger(0, name, OBJPROP_SELECTED, 1);          // Select the rectangle (optional)
      ObjectSetInteger(0, name, OBJPROP_SELECTED, 1);          // Make the rectangle selectable (optional)
      Print("Rectangle drawn successfully.");
     }
   else
     {
      Print("Failed to create rectangle. Error code: ", GetLastError());
     }
  }

//+------------------------------------------------------------------+
//| FVGs                                                             |
//+------------------------------------------------------------------+
typedef void (*FVGCallback)(
   MqlRates &rate,
   MqlRates &previousRate,
   MqlRates &nextRate,
   CandleType candleType,
   MqlRates &r[]
);
void DetectFVG(MqlRates &rates[], FVGCallback callback)
  {
   MqlRates previousRate = rates[ArraySize(rates) - 2]; // Previous Rate of current (closed candle)
   MqlRates fvgRate = rates[ArraySize(rates) - 3];
   MqlRates rateBeforeFVG = rates[ArraySize(rates) - 4];

   bool SIBI = (previousRate.high < rateBeforeFVG.low) > 0; // Calculate a positive gap for bearish move.
   bool BISI = (previousRate.low > rateBeforeFVG.high) > 0; // Calculate a positive gap for bullish move.

   if(SIBI)
     {
      Print("SIBI: ", fvgRate.time);
      if(callback != NULL)
        {
         callback(fvgRate, rateBeforeFVG, previousRate, CandleType::bearish, rates);
        }
     }

   if(BISI)
     {
      Print("SIBI: ", fvgRate.time);
      if(callback != NULL)
        {
         callback(fvgRate, rateBeforeFVG, previousRate, CandleType::bullish, rates);
        }
     }
  }

//+------------------------------------------------------------------+
//| Order Block                                                      |
//+------------------------------------------------------------------+
typedef void (*OBCallback)(
   bool found
);
void DetectOrderBlock(MqlRates &fvgRate, MqlRates &rates[], OBCallback callback)
  {
   MqlRates OB = rates[1];
   MqlRates previousCandleBeforeOB = rates[0];
   string timeStr = TimeToString(OB.time, TIME_DATE|TIME_MINUTES);

   callback(false);

   if(getCandleType(OB) == CandleType::bullish && getCandleType(previousCandleBeforeOB) == CandleType::bearish && previousCandleBeforeOB.low < OB.close) // Check if previous candle was bearish
     {
      Print("DOB: " + timeStr);
      DrawRectangle("OB" + timeStr, OB.time, OB.high, fvgRate.time, OB.low, clrBlue);
      callback(true);
     }
   if(getCandleType(OB) == CandleType::bearish && getCandleType(previousCandleBeforeOB) == CandleType::bullish && previousCandleBeforeOB.high < OB.open) // Check if previous candle was bullish
     {
      Print("DOB: " + timeStr);
      DrawRectangle("OB" + timeStr, OB.time, OB.high, fvgRate.time, OB.low, clrBlue);
      callback(true);
     }
  }

//+------------------------------------------------------------------+
//| Get current price                                                |
//+------------------------------------------------------------------+
double GetCurrentPrice()
  {
   return SymbolInfoDouble(_Symbol, SYMBOL_BID);
  }

//+------------------------------------------------------------------+
//| Trade (Take Positions)                                           |
//+------------------------------------------------------------------+
void ExecuteTrade(CandleType tradeType)
  {
   double sl = 0;
   double tp = 0;
   double orderPrice = GetCurrentPrice();

   if(tradeType == CandleType::bearish)
     {
      sl = orderPrice + slDistance;
      tp = orderPrice - tpDistance;

      trade.Sell(lote, _Symbol, orderPrice, sl, tp, "Sell!");
     }
   else
      if(tradeType == CandleType::bullish)
        {
         sl = orderPrice - slDistance;
         tp = orderPrice + tpDistance;

         trade.Buy(lote, _Symbol, orderPrice, sl, tp, "Buy!");
        }

   Print("CTrade | OrderPrice: ", orderPrice, " SL: ", sl, " TP: ", tp, " slDistance: ", slDistance, " tpDistance: ", tpDistance);
  }

//+------------------------------------------------------------------+
//| Check if the current time is within the specified range          |
//+------------------------------------------------------------------+
bool IsInTimeRange(int startHour, int endHour)
  {
   datetime currentTime = TimeCurrent();
   MqlDateTime tm;
   TimeToStruct(currentTime, tm);

   /*int currentTime = tm.hour * 100 + tm.min;
   int startTime = startHour * 100 + startMinute;
   int endTime = endHour * 100 + endMinute;
   */
   PrintFormat("Current Time: %02d:%02d, Start Time: %02d, End Time: %02d",
            tm.hour, tm.min, startHour, endHour);

   
   if((tm.hour >= startHour) && (tm.hour < endHour))
     {
      return true;
     }
   else
     {
      return false;
     }
   
   /*

   if (startTime <= endTime)
     {
      // Time range is within the same day
      return (currentTime >= startTime && currentTime <= endTime);
     }
   else
     {
      // Time range spans midnight
      return (currentTime >= startTime || currentTime <= endTime);
     }
     
     */
  }

//+------------------------------------------------------------------+
//| Function to display rates using Comment                          |
//+------------------------------------------------------------------+
void DisplayRates(MqlRates &rates[])
  {
   Comment(""); // Clear the comment

   string output = "Rates:\n";
   int size = ArraySize(rates);

   for(int i = 0; i < size - 1; i++)
     {
      output += "R[" + IntegerToString(i) + "] " + TimeToString(rates[i].time, TIME_DATE|TIME_MINUTES) + " - " +
                "O: " + DoubleToString(rates[i].open, 5) + ", " +
                "H: " + DoubleToString(rates[i].high, 5) + ", " +
                "L: " + DoubleToString(rates[i].low, 5) + ", " +
                "C: " + DoubleToString(rates[i].close, 5) + "\n";
     }

   Comment(output);
  }
//+------------------------------------------------------------------+
