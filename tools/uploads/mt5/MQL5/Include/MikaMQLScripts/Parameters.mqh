//+------------------------------------------------------------------+
//|                                                   Parameters.mqh |
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
ENUM_TIMEFRAMES currentTimeframe = Period();
double lote = 0.07;
double slDistance = 0.0001;
double tpDistance = 0.0003;

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
void loadGraphPresets()
  {
   Print("Load graph presets");
// Prevent the grid from being shown
   ChartSetInteger(0, CHART_SHOW_GRID, false);

// Show the ask line
   ChartSetInteger(0, CHART_SHOW_ASK_LINE, true);

// Apply the chart shift
   ChartSetInteger(0, CHART_SHIFT, 5);

// Change candle colors
   ChartSetInteger(0, CHART_COLOR_CHART_LINE, clrWhite);
   ChartSetInteger(0, CHART_COLOR_CANDLE_BULL, clrWhite);
   ChartSetInteger(0, CHART_COLOR_CHART_UP, clrWhite);
   ChartSetInteger(0, CHART_COLOR_CANDLE_BEAR, clrRed);
   ChartSetInteger(0, CHART_COLOR_CHART_DOWN, clrRed);
   ChartSetInteger(0, CHART_COLOR_VOLUME, clrGray);
   Print("Graph presets loaded");
  }
//+------------------------------------------------------------------+
