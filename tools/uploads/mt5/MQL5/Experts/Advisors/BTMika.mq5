//+------------------------------------------------------------------+
//|                                                       BTMika.mq5 |
//|                                                          Mickael |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Mickael"
#property link      "https://www.mql5.com"
#property version   "1.00"

#include <Trade/Trade.mqh>
#include <Trade/PositionInfo.mqh>
#include <Trade/DealInfo.mqh>

#include <MikaMQLScripts/Parameters.mqh>
#include <MikaMQLScripts/UtilityFunctions.mqh>

CTrade trade;
MqlRates r[];
bool prepareToTrade;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   loadGraphPresets();
   GetRates(_Symbol, currentTimeframe, 10, r);
   prepareToTrade = false;
   /*
      for(int i = 0; i < ArraySize(myRates); i++)
        {
         MqlRates selectedRate = DrawVerticalLine(myRates, i, "Candle Highlight", clrCyan);
         Print("Time: ", selectedRate.time, " Open: ", selectedRate.open, " High: ", selectedRate.high, " Low: ", selectedRate.low, " Close: ", selectedRate.close);
        }
   */
//DrawRectangle("My Rectangle", myRates[5].time, myRates[5].high, myRates[0].time, myRates[0].low, clrGreenYellow);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Event Called when a OB has been found                            |
//+------------------------------------------------------------------+
void OnOBDetected(
   bool found
)
  {
   prepareToTrade = found;
  }

//+------------------------------------------------------------------+
//| Event Called when a FVG has been found                           |
//+------------------------------------------------------------------+
void OnFVGDetected(
   MqlRates &fvgRate,
   MqlRates &rateBeforeFVG,
   MqlRates &previousRate,
   CandleType candleType,
   MqlRates &rates[]
)
  {
   switch(candleType)
     {
      case CandleType::bullish :
         DrawRectangle(
            "SIBI " + TimeToString(fvgRate.time),
            rateBeforeFVG.time,
            rateBeforeFVG.high,
            previousRate.time,
            previousRate.low,
            clrGreenYellow
         );
         break;
      case CandleType::bearish :
         DrawRectangle(
            "SIBI " + TimeToString(fvgRate.time),
            rateBeforeFVG.time,
            rateBeforeFVG.low,
            previousRate.time,
            previousRate.high,
            clrRed
         );
         break;
      default:
         Print("Couldn't Draw a valid FVG");
         break;
     }

   DetectOrderBlock(fvgRate, r, OnOBDetected); // prepareToTrade should be 

   if(prepareToTrade == true)
     {
      ExecuteTrade(candleType);
      prepareToTrade = false;
     }
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {


//MqlDateTime tm;
//datetime currentTime = TimeCurrent();
//TimeToStruct(currentTime, tm);

// Static variable to track trade status
// static bool tradeExecuted = false;

// Reset tradeExecuted at 10:00 server time
   /*
      if(tm.hour == 10 && tm.min == 0 && !tradeExecuted)
        {
         Print("Trade status reset at ", TimeToString(currentTime, TIME_DATE | TIME_MINUTES));
         tradeExecuted = false; // Allow trading for the new day
        }
   */
// Check if it's time to trade (between 10:00 and 11:00 server time)
//if(tm.hour >= 10 && tm.hour < 11)
//{
   if(isNewBar())
     {
      //MqlRates r[];
      GetRates(_Symbol, currentTimeframe, 5, r); // force to retrieve again one everytime
      bool isBullish;

      DisplayRates(r); // Comment to Display Rates for debuging

      if(IsHammerCandle(_Symbol, 1, isBullish))
        {
         if(isBullish)
           {
            Print("Bullish hammer detected.");
            //DrawVerticalLine(r[1], "Bullish hammer", clrBlue);
           }
         else
           {
            Print("Bearish hammer detected.");
            //DrawVerticalLine(r[1], "Bearish hammer", clrRed);
           }
        }

      DetectFVG(r, OnFVGDetected);
     }
   /*
         static double prevLow1 = 0;
         static double prevLow2 = 0;
         static double highBetweenLows = 0;
         static bool twoHigherLows = false;
         static bool isBearish = true;

         double currentLow = iLow(_Symbol, PERIOD_CURRENT, 3); // Use 3 bars ago
         double currentHigh = iHigh(_Symbol, PERIOD_CURRENT, 3); // Use 3 bars ago

         // Detect two consecutive Higher Lows (HLs)
         if(prevLow2 < prevLow1 && prevLow1 < currentLow)
           {
            twoHigherLows = true;
            // Update the highest price (pivot) between the two higher lows
            highBetweenLows = iHigh(_Symbol, PERIOD_CURRENT, 2); // Highest price between two lows
           }

         // Detect Market Structure Shift: the current high must exceed the highest price between the two higher lows
         if(currentHigh > highBetweenLows && isBearish)
           {
            isBearish = false;  // MSS detected, no longer bearish
           }

         // Place buy trade if all conditions are met, time is within range, and no position is currently open
         if(twoHigherLows && !isBearish && !IsPositionOpen() && !tradeExecuted)
           {
            double lote = 0.07;
            double priceEntry = GetCurrentPrice();
            double stopLoss = priceEntry - 0.0001;
            double takeProfit = priceEntry + 0.0003;

            // Place the trade
            trade.Buy(lote, _Symbol, priceEntry, stopLoss, takeProfit, "Buy!");

            // Update trade execution status
            tradeExecuted = true;
           }

         // Update the previous highs and lows
         prevLow2 = prevLow1;
         prevLow1 = currentLow;
         highBetweenLows = iHigh(_Symbol, PERIOD_CURRENT, 2); // Update the highest price between the two higher lows

         // Reset isBearish if new lower low is formed
         if(currentLow < prevLow1)
           {
            isBearish = true;
           }
        }
        */
  }

// Manage trailing stop
//ManageTrailingStop();
//}
//+------------------------------------------------------------------+
//| Check if there is an open position                               |
//+------------------------------------------------------------------+
bool IsPositionOpen()
  {
// Check if there is an open position for the current symbol
   return PositionSelect(_Symbol);
  }

//+------------------------------------------------------------------+
//| Check if new bar is formed                                       |
//+------------------------------------------------------------------+
bool isNewBar()
  {
   static datetime last_time = 0;

   datetime lastbar_time = (datetime)SeriesInfoInteger(_Symbol, PERIOD_CURRENT, SERIES_LASTBAR_DATE);

   if(last_time == 0)
     {
      last_time = lastbar_time;
      return (false);
     }

   if(last_time != lastbar_time)
     {
      last_time = lastbar_time;
      return (true);
     }
   return (false);
  }
//+------------------------------------------------------------------+
//| Manage trailing stop                                             |
//+------------------------------------------------------------------+
/*
void ManageTrailingStop()
  {
   // Select the position for the current symbol
   if (PositionSelect(_Symbol))
     {
      double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentPrice = GetCurrentPrice();
      double trailingStopDistance = 0.0002; // Distance for the trailing stop (e.g., 2 pips)
      double newStopLoss = currentPrice - trailingStopDistance;
      double lastStopLoss = PositionGetDouble(POSITION_SL);
      double takeProfit = PositionGetDouble(POSITION_TP); // Fetch the current TP value

      Print("Manage trailing stop: Last SL = ", lastStopLoss, ", New SL = ", newStopLoss, ", TP = ", takeProfit);

      // Check if the new stop loss is higher than the last stop loss
      if (newStopLoss > lastStopLoss)
        {
         // Modify the position with the new stop loss and keep the current TP
         bool modifyResult = trade.PositionModify(PositionGetInteger(POSITION_TICKET), newStopLoss, takeProfit);

         // Update lastStopLoss only if modification was successful
         if (modifyResult)
           {
            Print("Trailing stop updated to ", newStopLoss);
           }
         else
           {
            Print("Failed to update trailing stop");
           }
        }
     }
  }
*/
//+------------------------------------------------------------------+

//+------------------------------------------------------------------+

//+------------------------------------------------------------------+

//+------------------------------------------------------------------+
