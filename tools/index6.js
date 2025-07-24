// NOTES:
/*
  Most of the functions if they are using charting annotation, they need to be inside initchart function.
  The Graph is now populating or get drawned with the CSV file data at a pace speed (one by one).
*/

// Result Panel Related Actions / Triggers:
const resultPanel = document.querySelector('#result-panel');
const $csvRefresh = document.querySelector('#csvRefresh');
const $csvDataField = document.getElementById('csvContent');
const $csvFileInput = document.getElementById('csvFileInput');
const toolbarToggler = document.querySelector('#result-panel-toolbar-toggler');
const $navigateTroughtDates = document.getElementById('NavigateTroughtDates');
const $textareaHistoricalTradesLines = document.getElementById(
  'textareaHistoricalTradesLines'
);
function toggleHeight() {
  resultPanel.classList.toggle('active');
}
toolbarToggler.addEventListener('click', toggleHeight);

document
  .getElementById('result-panel-toolbar-content-toggler-algo-editor')
  .addEventListener('click', () => {
    resultPanel.classList.add('active');
    document
      .querySelectorAll('.result-panel-content')[0]
      .classList.remove('h-hide');
    document
      .querySelectorAll('.result-panel-content')[1]
      .classList.add('h-hide');
    document
      .querySelectorAll('.result-panel-content')[2]
      .classList.add('h-hide');
  });

document
  .getElementById('result-panel-toolbar-content-toggler-algo')
  .addEventListener('click', () => {
    resultPanel.classList.add('active');
    document
      .querySelectorAll('.result-panel-content')[0]
      .classList.add('h-hide');
    document
      .querySelectorAll('.result-panel-content')[1]
      .classList.remove('h-hide');
    document
      .querySelectorAll('.result-panel-content')[2]
      .classList.add('h-hide');
  });

document
  .getElementById('result-panel-toolbar-content-toggler-review')
  .addEventListener('click', () => {
    resultPanel.classList.add('active');
    document
      .querySelectorAll('.result-panel-content')[0]
      .classList.add('h-hide');
    document
      .querySelectorAll('.result-panel-content')[1]
      .classList.add('h-hide');
    document
      .querySelectorAll('.result-panel-content')[2]
      .classList.remove('h-hide');
  });

$csvRefresh.addEventListener('click', () => {
  const file = $csvFileInput.files[0];
  handleFileAndInitGraph(file);
});

$textareaHistoricalTradesLines.addEventListener('change', () => {
  const lines = $textareaHistoricalTradesLines.value.split('\n'); // Split lines by newline
  const trades = lines.map((line) => {
    const parts = line.split('\t'); // Split each line by tab character

    return {
      openedTradeDateTime: parts[0],
      closedTradeDateTime: parts[1],
      symbol: parts[2],
      orderDirection: parts[3],
      lotSize: parseFloat(parts[4]),
      slPrice: parts[5] === '-' ? null : parseFloat(parts[5]),
      tpPrice: parts[6] === '-' ? null : parseFloat(parts[6]),
      entryPrice: parseFloat(parts[7]),
      closePrice: parseFloat(parts[8]),
    };
  });

  // Re-trigger the CSV processing with the trades data
  const file = $csvFileInput.files[0];
  handleFileAndInitGraph(file, trades);
});

/* ---- */

const decimals = 5;
let candlesFromBuffer = [];
const MAX_BUFFER_SIZE = 10;
let slSize = () => parseFloat(document.getElementById('SLPoints').value);
let tpSize = () => parseFloat(document.getElementById('TPPoints').value);
let lotSize = () => parseFloat(document.getElementById('LotSize').value);
let bullishColor = '00FF00';
let bearishColor = 'FF0000';
let greyColor = '999999';
const EnumDirection = {
  BULL: 'BULL',
  BEAR: 'BEAR',
};
const EnumOrderStatus = {
  PENDING: 'PENDING',
  CLOSED_BY_TP: 'CLOSED_BY_TP',
  CLOSED_BY_SL: 'CLOSED_BY_SL',
};
const EnumActionType = {
  VERTICAL_LINE: 'VERTICAL_LINE',
  DRAW_A_CIRCLE: 'DRAW_A_CIRCLE',
  TAKE_A_TRADE: 'TAKE_A_TRADE',
};
const EnumMT5OHLC = {
  TIME: '<TIME>',
  OPEN: '<OPEN>',
  HIGH: '<HIGH>',
  LOW: '<LOW>',
  CLOSE: '<CLOSE>',
};

// Probably deprecated in the future:
const getCandleDirection = (candle) => {
  return candle[4] > candle[1] ? EnumDirection.BULL : EnumDirection.BEAR;
};
const getCandleDirection2 = (openPrice, closePrice) => {
  return closePrice > openPrice ? EnumDirection.BULL : EnumDirection.BEAR;
};

const getCandleChartAxisLocationFromDate = (date) => {
  return new Date(date).getTime() / 1000;
};

// Window assignments:
window.getCandleChartAxisLocationFromDate = getCandleChartAxisLocationFromDate;

function formatDateFromUnix(unixTime) {
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // second: '2-digit',
    hour12: false,
  };
  return new Date(unixTime * 1000).toLocaleDateString('en-GB', options); // Multiply by 1000 to convert to milliseconds because JS Date works with milliseconds.
}

// Handy function to execute actions step by step:
const stepByStep = (step, actions) => {
  return actions[step - 1]();
};

const convertMT5DateToUnix = (candleTime) => {
  if (!candleTime) {
    // TODO: this seems to be infinitly called, need to fix it:
    // console.warn('No candleTime provided, returning current date.');
    return new Date(); // If candleTime is not provided, return current date
  }
  if (typeof candleTime.replaceAll !== 'function') {
    debugger;
  }
  const ct = candleTime.replaceAll('.', '-');
  return new Date(ct).getTime() / 1000; // - 3600 * 2; // divided by 1000 to convert from milliseconds to seconds as Unix time only accepts seconds, while JS Date is more precise as working with milliseconds.
};

initSciChart();

const readingSpeed = 10; // Speed of reading the CSV file in milliseconds

const csvData = [];
let CSIDLookbackCandleSerie = [];
let CSIDSignalTriggered = false;
let CSIDCoolddownSignal = 5;
let csvDataIndex = 0;
let numbDays = 0;
let ordersHistory = [];
window.ordersHistory = ordersHistory;

const handleFileAndInitGraph = (file, trades = [], onCandleDrawn) => {
  if (file) {
    clearAndDeleteChart();

    // Clear orders history
    ordersHistory = [];
    numbDays = 0;

    // Reset portfolio graph and order history display
    document.getElementById('backtestingResult').value = '';
    document.getElementById('backtestingResultOrderHistory').innerHTML = '';

    // Add visible class to loading element
    document.getElementById('loading-element').classList.add('visible');

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      step: function (results, parser) {
        const row = results.data;
        csvDataIndex += 1;

        parser.pause();
        // Append data to the chart:
        appendDataToChart(results.data, csvDataIndex);
        // Plot real-time indicators:
        appendIndicatorsToChart(results.data, csvDataIndex);
        // Run the Check for TP/SL hit function on every drawn candle:
        checkForTPSLHit(results.data, csvDataIndex);

        // Match trades based on the opening time
        /*trades.forEach(trade => {
              const tradeTime = convertMT5DateToUnix(trade.openedTradeDateTime);
              const candleTime = convertMT5DateToUnix(`${row["<DATE>"]} ${row["<TIME>"]}`);

              if (tradeTime === candleTime) {
                // Enhanced trade matching logging
                console.group('Trade Matching');
                console.log('Matched Trade Details:', {
                  tradeTime: new Date(tradeTime * 1000).toISOString(),
                  candleTime: new Date(candleTime * 1000).toISOString(),
                  trade: trade,
                  row: row
                });

                const candle = {
                  [EnumOHLC.TIME]: trade.openedTradeDateTime,
                  [EnumOHLC.CLOSE]: trade.entryPrice,
                  // Add more candle details if available
                  [EnumOHLC.OPEN]: row['<OPEN>'],
                  [EnumOHLC.HIGH]: row['<HIGH>'],
                  [EnumOHLC.LOW]: row['<LOW>']
                };

                const tradeDirection = trade.orderDirection === 'Buy' ? EnumDirection.BULL : EnumDirection.BEAR;
                
                console.log('Candle and Trade Direction:', {
                  candle: candle,
                  direction: tradeDirection
                });

                // Safely handle chart-related actions
                try {
                  // Check if AddActionOnChart exists before calling
                  if (typeof AddActionOnChart === 'function') {
                    AddActionOnChart(trade, 'REVIEW_A_TRADE', tradeDirection);
                  }
                  
                  // Log if onCandleDrawn is called but not defined
                  if (typeof onCandleDrawn === 'function') {
                    onCandleDrawn(candle, csvDataIndex, candlesFromBuffer);
                  } else {
                    console.warn('onCandleDrawn is not a function');
                  }
                } catch (error) {
                  console.error('Error processing trade:', error);
                } finally {
                  console.groupEnd();
                }
              }
            });*/

        setTimeout(() => {
          // Resume parsing after a short delay to allow UI updates
          parser.resume();
        }, readingSpeed);
      },
      complete: function (results, file) {
        profitabilityCalculation();
        // Remove visible class from loading element
        document.getElementById('loading-element').classList.remove('visible');
      },
      error: function (error) {
        console.error('Error parsing CSV:', error);
      },
    });

    document
      .getElementById('result-panel-toolbar-content-toggler-algo')
      .click();
  }
};

$csvFileInput.addEventListener('change', function loadcsv(event) {
  const file = event.target.files[0];
  handleFileAndInitGraph(file);
});

// Define the initSciChart function
function initSciChart(data) {
  const {
    SciChartSurface,
    NumericAxis,
    FastCandlestickRenderableSeries,
    OhlcDataSeries,
    SciChartJsNavyTheme,
    SciChartJSDarkv2Theme,
    NumberRange,
    MouseWheelZoomModifier,
    ZoomPanModifier,
    ZoomExtentsModifier,
    YAxisDragModifier,
    XAxisDragModifier,
    DateTimeNumericAxis,
    DateLabelProvider,
    EDragMode,
    CursorModifier,
    BoxAnnotation,
    ECoordinateMode,
    getCanvasCoordinatesFromEvent,
    VerticalLineAnnotation,
    SolidColorBrush,
    Colors,
    ELabelPlacement,
    EAnnotationLayer,
    DateRange,
    EAutoRange,
    LineAnnotation,
    AxisMarkerAnnotation,
    CustomAnnotation,
    EVerticalAnchorPoint,
    EHorizontalAnchorPoint,
    ENumericFormat,
    EDateFormatter,
    Point,
    FastLineRenderableSeries,
    XyDataSeries,
    // GlowEffect,
    // ShadowEffect,
  } = SciChart;

  // Tell SciChart where to get webassembly files from.
  SciChartSurface.useWasmFromCDN();

  // Initialize SciChartSurface. Don't forget to await!
  SciChartSurface.create('scichart-root', {
    theme: new SciChartJsNavyTheme(),
  })
    .then(({ sciChartSurface, wasmContext }) => {
      // Extract URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      bullishColor = decodeURIComponent(
        urlParams.get('bullishColor') || bullishColor
      );
      bearishColor = decodeURIComponent(
        urlParams.get('bearishColor') || bearishColor
      );

      // Create a custom theme by implementing all the properties from IThemeProvider
      const customTheme = {
        axisBorder: 'Transparent',
        axisTitleColor: '#111',
        annotationsGripsBackroundBrush: 'white',
        annotationsGripsBorderBrush: 'white',
        axis3DBandsFill: '#1F3D6833',
        axisBandsFill: '#1F3D6833',
        axisPlaneBackgroundFill: 'Transparent',
        columnFillBrush: 'white',
        columnLineColor: 'Transparent',
        cursorLineBrush: '#111',
        downBandSeriesFillColor: '#52CC5490',
        downBandSeriesLineColor: '#E26565FF',
        downBodyBrush: bearishColor, // candle
        downWickColor: bearishColor, // candle
        gridBackgroundBrush: 'white',
        gridBorderBrush: 'white',
        labelForegroundBrush: '#EEEEEE',
        legendBackgroundBrush: '#1D2C35',
        lineSeriesColor: 'white',
        loadingAnimationBackground: '#111',
        loadingAnimationForeground: '#111',
        majorGridLineBrush: '#111',
        minorGridLineBrush: '#111',
        mountainAreaBrush: 'white',
        mountainLineColor: 'white',
        overviewFillBrush: 'white',
        planeBorderColor: 'white',
        rolloverLineBrush: '#FD9F2533',
        rubberBandFillBrush: '#99999933',
        rubberBandStrokeBrush: '#99999977',
        sciChartBackground: '#000', // Chart background color
        scrollbarBackgroundBrush: 'white',
        scrollbarBorderBrush: 'white',
        scrollbarGripsBackgroundBrush: 'white',
        scrollbarViewportBackgroundBrush: 'white',
        scrollbarViewportBorderBrush: 'white',
        shadowEffectColor: 'white',
        textAnnotationBackground: '#333',
        textAnnotationForeground: '#EEEEEE',
        tickTextBrush: '#333',
        upBandSeriesFillColor: 'white',
        upBandSeriesLineColor: 'white',
        upBodyBrush: bullishColor, // candle
        upWickColor: bullishColor, // candle
      };
      sciChartSurface.applyTheme(customTheme);

      window.sciChartSurface = sciChartSurface;

      // Cursor labels:
      const growBy = new NumberRange(0.2, 0.2);
      const xAxis = new DateTimeNumericAxis(wasmContext, { growBy });
      xAxis.labelProvider.formatCursorLabel = (dataValue) => {
        const unixDateStamp = Math.floor(dataValue); // Flooring it to remove milliseconds from that cursor data, as it is too much precise // - 3600;
        return formatDateFromUnix(unixDateStamp);
      };
      const yAxis = new NumericAxis(wasmContext, {
        labelPrecision: decimals,
        autoRange: EAutoRange.Once,
        // visibleRangeLimit: new NumberRange(1.02, 1.03),
        growBy,
      });

      sciChartSurface.xAxes.add(xAxis);
      sciChartSurface.yAxes.add(yAxis);

      // Variables initialization =========================
      let annotations = [];
      // Variables initialization for CSID:
      let rollingHighestHighDataSeries = null;
      let rollingLowestLowDataSeries = null;
      const lookbackPeriod = 15;
      const lookbackPeriodForCSIDHigh = lookbackPeriod;
      const lookbackPeriodForCSIDLow = 9;
      const highestHighLong = [];
      const lowestLowShort = [];
      // End of Variables initialization =========================

      const signalAnnotation = {
        svgString: {
          buy: '<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#0000FF;" d="M 55,85 L 60,75 L 65,85 Z"/></g></svg>',
          bullish:
            '<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#00FF00;" d="M 55,85 L 60,75 L 65,85 Z"/></g></svg>',
          sell: '<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#FF0000;" d="M 55,75 L 60,85 L 65,75 Z"/></g></svg>',
          bearish:
            '<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#FF0000;" d="M 55,75 L 60,85 L 65,75 Z"/></g></svg>',
          circle: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" style="fill:#${bullishColor};fill-opacity:0.34117647;stroke:#${bullishColor};stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></svg>`,
        },
      };

      const RRToolStyles = {
        strokeThickness: 0,
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        annotationLayer: EAnnotationLayer.AboveChart,
        opacity: '50',
      };

      function ceilToDecimalPlaces(num, decimalPlaces) {
        const factor = Math.pow(10, decimalPlaces); // Calculate 10^decimalPlaces
        return Math.ceil(num * factor) / factor; // Ceil and then divide
      }

      // Function to update Y-axis range dynamically
      function updateYAxisRange() {
        const yMin = 1.034; // ohlcDataSeries.getNativeYMin();
        const yMax = 1.042; // ohlcDataSeries.getNativeYMax();

        sciChartSurface.yAxes.get(0).visibleRangeLimit = new NumberRange(
          yMin,
          yMax
        );
      }

      // TP/SL Validation: ========================================
      // Function to check all TP/SL hit:
      const checkForTPSLHit = (d, dataIndex) => {
        return ordersHistory.forEach((order) => {
          switch (order.direction) {
            case EnumDirection.BULL:
              if (d[EnumMT5OHLC.HIGH] >= order.tp && !order.closed) {
                order.closed = true;
                order.closedPrice = order.tp;
                order.closedTime = d[EnumMT5OHLC.TIME];
                (order.orderStatus = EnumOrderStatus.CLOSED_BY_TP),
                  sciChartSurface.annotations.add(
                    new CustomAnnotation({
                      x1: convertMT5DateToUnix(order.closedTime),
                      y1: order.tp,
                      verticalAnchorPoint: EVerticalAnchorPoint.Center,
                      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                      svgString: signalAnnotation.svgString.sell,
                    })
                  );
                sciChartSurface.annotations.add(
                  new LineAnnotation({
                    stroke: `#${greyColor}`,
                    strokeThickness: 1,
                    strokeDashArray: [5, 5],
                    x1: convertMT5DateToUnix(order.time),
                    x2: convertMT5DateToUnix(order.closedTime),
                    y1: order.price,
                    y2: order.closedPrice,
                  })
                );
              }
              if (d[EnumMT5OHLC.LOW] <= order.sl && !order.closed) {
                order.closed = true;
                order.closedPrice = order.sl;
                order.closedTime = d[EnumMT5OHLC.TIME];
                (order.orderStatus = EnumOrderStatus.CLOSED_BY_SL),
                  sciChartSurface.annotations.add(
                    new CustomAnnotation({
                      x1: convertMT5DateToUnix(order.closedTime),
                      y1: order.sl,
                      verticalAnchorPoint: EVerticalAnchorPoint.Center,
                      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                      svgString: signalAnnotation.svgString.sell,
                    })
                  );
                sciChartSurface.annotations.add(
                  new LineAnnotation({
                    stroke: `#${greyColor}`,
                    strokeThickness: 1,
                    strokeDashArray: [5, 5],
                    x1: convertMT5DateToUnix(order.time),
                    x2: convertMT5DateToUnix(order.closedTime),
                    y1: order.price,
                    y2: order.closedPrice,
                  })
                );
              }
              break;
            case EnumDirection.BEAR:
              if (d[EnumMT5OHLC.LOW] <= order.tp && !order.closed) {
                order.closed = true;
                order.closedPrice = order.tp;
                order.closedTime = d[EnumMT5OHLC.TIME];
                (order.orderStatus = EnumOrderStatus.CLOSED_BY_TP),
                  sciChartSurface.annotations.add(
                    new CustomAnnotation({
                      x1: convertMT5DateToUnix(order.closedTime),
                      y1: order.tp,
                      verticalAnchorPoint: EVerticalAnchorPoint.Center,
                      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                      svgString: signalAnnotation.svgString.sell,
                    })
                  );
                sciChartSurface.annotations.add(
                  new LineAnnotation({
                    stroke: `#${greyColor}`,
                    strokeThickness: 1,
                    strokeDashArray: [5, 5],
                    x1: convertMT5DateToUnix(order.time),
                    x2: convertMT5DateToUnix(order.closedTime),
                    y1: order.price,
                    y2: order.closedPrice,
                  })
                );
              }
              if (d[EnumMT5OHLC.HIGH] >= order.sl && !order.closed) {
                order.closed = true;
                order.closedPrice = order.sl;
                order.closedTime = d[EnumMT5OHLC.TIME];
                (order.orderStatus = EnumOrderStatus.CLOSED_BY_SL),
                  sciChartSurface.annotations.add(
                    new CustomAnnotation({
                      x1: convertMT5DateToUnix(order.closedTime),
                      y1: order.sl,
                      verticalAnchorPoint: EVerticalAnchorPoint.Center,
                      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                      svgString: signalAnnotation.svgString.sell,
                    })
                  );
                sciChartSurface.annotations.add(
                  new LineAnnotation({
                    stroke: `#${greyColor}`,
                    strokeThickness: 1,
                    strokeDashArray: [5, 5],
                    x1: convertMT5DateToUnix(order.time),
                    x2: convertMT5DateToUnix(order.closedTime),
                    y1: order.price,
                    y2: order.closedPrice,
                  })
                );
              }
              break;
          }
        });
      };
      window.checkForTPSLHit = checkForTPSLHit;
      // End of TP/SL Validation ========================================

      // AddActionOnChart: ========================================
      // Function to create annotations or take actions on the chart, based on UI selected options:
      const AddActionOnChart = (
        candle,
        EnumActionType,
        tradeDirection = EnumDirection.BULL
      ) => {
        const candlePosition = convertMT5DateToUnix(
          `${candle['<DATE>']} ${candle['<TIME>']}`
        );
        switch (EnumActionType) {
          case 'VERTICAL_LINE':
            sciChartSurface.annotations.add(
              new VerticalLineAnnotation({
                x1: candlePosition,
                stroke: `#${bullishColor}`,
                strokeThickness: 1,
              })
            );
            break;
          case 'DRAW_A_CIRCLE':
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[EnumOHLC.CLOSE],
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.circle,
              })
            );
            break;
          case 'TAKE_A_TRADE':
            const orderOptionsBasedDirection = (tradeDirection) => {
              if (tradeDirection == EnumDirection.BULL) {
                return {
                  sl: candle[EnumMT5OHLC.CLOSE] - slSize(),
                  tp: candle[EnumMT5OHLC.CLOSE] + tpSize(),
                  direction: EnumDirection.BULL,
                };
              } else {
                return {
                  sl: candle[EnumMT5OHLC.CLOSE] + slSize(),
                  tp: candle[EnumMT5OHLC.CLOSE] - tpSize(),
                  direction: EnumDirection.BEAR,
                };
              }
            };

            // Add order to history:
            ordersHistory.push({
              id: ordersHistory.length + 1,
              time: candle[EnumMT5OHLC.TIME],
              price: candle[EnumMT5OHLC.CLOSE],
              orderStatus: EnumOrderStatus.PENDING,
              ...orderOptionsBasedDirection(tradeDirection),
            });
            window.ordersHistory = ordersHistory;

            // Add annotation from entry:
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[EnumMT5OHLC.CLOSE],
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.buy,
              })
            );
            break;
          case 'REVIEW_A_TRADE':
            const orderOptionsBasedDirection2 = (tradeDirection) => {
              if (tradeDirection == EnumDirection.BULL) {
                return {
                  sl: candle[EnumMT5OHLC.CLOSE],
                  tp: candle[EnumMT5OHLC.CLOSE],
                  direction: EnumDirection.BULL,
                };
              } else {
                return {
                  sl: candle[EnumMT5OHLC.CLOSE],
                  tp: candle[EnumMT5OHLC.CLOSE],
                  direction: EnumDirection.BEAR,
                };
              }
            };
            // Add order to history:
            ordersHistory.push({
              id: ordersHistory.length + 1,
              time: candle[EnumMT5OHLC.TIME],
              price: candle[EnumMT5OHLC.CLOSE],
              orderStatus: EnumOrderStatus.PENDING,
              ...orderOptionsBasedDirection2(tradeDirection),
            });

            window.ordersHistory = ordersHistory;

            // Add annotation from entry:
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[EnumMT5OHLC.CLOSE],
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.buy,
              })
            );
            break;
        }
      };
      // End of AddActionOnChart ========================================

      // For testing purposes:
      const rdata = [
        ['2021.06.29', '00:00:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:01:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:02:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:03:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:04:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:05:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:06:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:07:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:08:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:09:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:10:00', 1.23456, 1.23456, 1.23456, 1.23456],
        ['2021.06.29', '00:11:00', 1.23456, 1.23456, 1.23456, 1.23456],
      ];

      const ohlcData = rdata.map((row) => {
        /*https://developers.binance.com/docs/binance-spot-api-docs/rest-api#klinecandlestick-data*/
        /*
              return {
                time: row[0],
                open: parseFloat(row[1]),
                high: parseFloat(row[2]),
                low: parseFloat(row[3]),
                close: parseFloat(row[4])
              }
            */

        /* MT5 exported CSV format: */
        return {
          time: `${row[0]} ${row[1]}`,
          open: parseFloat(row[2]),
          high: parseFloat(row[3]),
          low: parseFloat(row[4]),
          close: parseFloat(row[5]),
        };
      });

      let canTakeATrade = true;
      let inRange = false;
      let swingHighLowHistory = [];
      let fvgHistory = [];
      const minDate = new Date(ohlcData[0].time);
      const maxDate = new Date(ohlcData[ohlcData.length - 1].time);
      const offsetCandleDateTimeStamp = (candleDateTimeStamp) =>
        candleDateTimeStamp; // - 3600 * 1; // !! offseting candle position in X axis by -1h to match tradingView (The correct way would be to offset the axis labels, but dont know how to do it yet)

      // First function to be executed as soon as the data is loaded, you can do anything you want here:
      const onData = (ohlcData) => {
        // console.log('ohlcData:', ohlcData);
      };

      // Second function to be executed after the candle is drawn, you can add annotations here:
      const onCandleDrawn = (candle, index, candlesFromBuffer) => {
        const algoEditorTextareaMain0 = document.getElementById(
          'algoEditorTextareaMain0'
        );
        const algoEditorTextareaMain1 = document.getElementById(
          'algoEditorTextareaMain1'
        );
        const hourMinutes = () => candle[0].split(' ')[1].slice(0, 5);
        let arrayOfSignals = [];
        const candlePosition = convertMT5DateToUnix(candle[0]);
        const prevCandle = ohlcData[index - 1];
        const nextCandle = ohlcData[index + 1];

        // candle[0] === "2025.01.10 21:10:00" && AddActionOnChart(candle, EnumActionType.VERTICAL_LINE);

        // Swing High/Low Logic: ========================================
        let isSwingHigh = false;
        let isSwingLow = false;

        // Get 4 candles for swing analysis:
        // let candleBufferForAnalisis = candlesFromBuffer.slice(-4);
        const selectedIndexForSelectedCandleForAnalisis =
          candlesFromBuffer.length - 2;

        const swhlPrevCandle2 =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis - 2];
        const swhlPrevCandle =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis - 1];
        const selectedCandleForAnalisis =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis]; // selected candle for analysis is the 2nd last candle from the buffer, because the last candle is the current candle and we will analize the next candle
        const swhlNextCandle =
          candlesFromBuffer[selectedIndexForSelectedCandleForAnalisis + 1];

        const SignalSwingHighLow = () => {
          if (index < 4 /*|| index > candlesFromBuffer.length - 3*/)
            return false;

          // For swing high, current candle high is less than or equal to the previous candle high and the previous candle high is greater than the previous candle open:
          isSwingHigh =
            selectedCandleForAnalisis[EnumOHLC.HIGH] <=
              swhlPrevCandle[EnumOHLC.HIGH] &&
            swhlPrevCandle2[EnumOHLC.OPEN] < swhlPrevCandle[EnumOHLC.OPEN] &&
            selectedCandleForAnalisis[EnumOHLC.HIGH] >=
              swhlNextCandle[EnumOHLC.HIGH] &&
            getCandleDirection(selectedCandleForAnalisis) == 'BEAR';
          // For swing low, current candle low is greater than or equal to the previous candle low and the previous candle low is less than the previous candle close:
          isSwingLow =
            selectedCandleForAnalisis[EnumOHLC.LOW] >=
              swhlPrevCandle[EnumOHLC.LOW] &&
            swhlPrevCandle2[EnumOHLC.CLOSE] > swhlPrevCandle[EnumOHLC.CLOSE] &&
            selectedCandleForAnalisis[EnumOHLC.LOW] <=
              swhlNextCandle[EnumOHLC.LOW] &&
            getCandleDirection(selectedCandleForAnalisis) == 'BULL';

          return isSwingLow || isSwingHigh;
        };

        if (SignalSwingHighLow()) {
          swingHighLowHistory.push({
            time: swhlPrevCandle[0],
            maxReachedPrice: isSwingHigh
              ? selectedCandleForAnalisis[EnumOHLC.HIGH]
              : selectedCandleForAnalisis[EnumOHLC.LOW], // Represents the highest/lowest price that was reached.
            type: isSwingHigh ? 'HIGH' : 'LOW', // Represents the type of the swing (HIGH or LOW) its the position and NOT the candle direction.
          });

          sciChartSurface.annotations.add(
            new CustomAnnotation({
              x1: convertMT5DateToUnix(
                selectedCandleForAnalisis[EnumOHLC.TIME]
              ),
              y1: isSwingHigh
                ? selectedCandleForAnalisis[EnumOHLC.HIGH]
                : selectedCandleForAnalisis[EnumOHLC.LOW],
              verticalAnchorPoint: isSwingHigh
                ? EVerticalAnchorPoint.Bottom
                : EVerticalAnchorPoint.Top,
              horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
              svgString: isSwingHigh
                ? signalAnnotation.svgString.bearish
                : signalAnnotation.svgString.bullish,
            })
          );
        }
        // End of Swing High/Low Logic: ========================================

        eval(algoEditorTextareaMain1.value);

        // Backtesting dates ====================================
        let candleDateTime = candle[EnumOHLC.TIME]; // excepted format: "1970.01.01 00:00:00"
        let unixTime = convertMT5DateToUnix(candleDateTime); // format: 1624982400 for 2021-06-29 00:00:00
        let candleTime = candleDateTime.split(' ')[1]; // get the time from the date string (00:00:00)
        let backTestTime = getCandleChartAxisLocationFromDate(candleDateTime); // + 3600; // Actually the same as above (candleDateTimeStamp)

        var selectedTime = document.getElementById('backtesting-hour').value;

        if (candleTime == selectedTime) {
          numbDays = numbDays + 1;
          let btt = backTestTime; // * 1000;
          let formatedDate = formatDateFromUnix(btt);

          // Display Backtesting dates on the select element:
          $navigateTroughtDates.innerHTML += `<option value="${unixTime}">${candleDateTime}</option>`;
        }
        // End of Backtesting dates ====================================
      };

      const profitabilityCalculation = () => {
        const profitsInPoints = ordersHistory.reduce((acc, order) => {
          if (order.orderStatus == EnumOrderStatus.CLOSED_BY_TP) {
            return acc + tpSize();
          }
          if (order.orderStatus == EnumOrderStatus.CLOSED_BY_SL) {
            return acc - slSize();
          }
          return acc;
        }, 0);

        console.log('Orders History:', ordersHistory);
        const winRate =
          ordersHistory.length > 0
            ? (
                (ordersHistory.filter(
                  (order) => order.orderStatus == EnumOrderStatus.CLOSED_BY_TP
                ).length /
                  ordersHistory.length) *
                100
              ).toFixed(2)
            : 0;
        const moneyEquivalent = (
          profitsInPoints *
          (lotSize() * 10) *
          10000
        ).toFixed(2);
        const result = `Check console for orders history\n\nTrade Taken: ${
          ordersHistory.length
        } (in ${numbDays} days)\nWin Rate: ${winRate}% \n\nProfits: \n Money: ${moneyEquivalent}$\n Points: ${profitsInPoints.toFixed(
          5
        )} \n Pips: ${(profitsInPoints / 0.0001).toFixed(2)} \n Ticks: ${(
          profitsInPoints / 0.01
        ).toFixed(2)}`;
        document.getElementById('backtestingResult').value = result;

        // Profitability Chart: ========================================
        let myChart = document.getElementById('myChart');
        var ctx = myChart.getContext('2d');
        var datasets = [];
        var values = ordersHistory.map((order) => {
          const pnlvar =
            order.orderStatus == EnumOrderStatus.CLOSED_BY_TP
              ? tpSize()
              : -slSize();
          return [pnlvar];
        });
        var labels = ordersHistory.map((order) => order.id);

        const pnlsum = () => {
          let sum = 0;
          return values.map((value) => {
            var a = (sum += parseFloat(value));
            return a;
          });
        };

        const equityPnL = () => {
          let equitySum = 0;
          const commission = 0.00005; // TODO: Currently high for testing and handicap the results
          return values.map((value) => {
            var a = (equitySum += parseFloat(value - commission));
            return a;
          });
        };

        // Check if there is an existing chart instance and destroy it:
        if (typeof myChart !== 'undefined' && myChart !== null) {
          myChart.remove();
          const newCanvas = document.createElement('canvas');
          newCanvas.id = 'myChart';
          newCanvas.width = 700;
          newCanvas.height = 300;
          document.getElementById('myChartContainer').appendChild(newCanvas);
          myChart = document.getElementById('myChart');
          ctx = myChart.getContext('2d');
          //myChart.destroy();
        }

        gradient = ctx.createLinearGradient(0, 25, 0, 300);
        gradient.addColorStop(0, `#${bullishColor}${RRToolStyles.opacity}`);
        gradient.addColorStop(1, `#${bearishColor}${RRToolStyles.opacity}`);

        datasets.push({
          type: 'line',
          label: 'Strategy Performance (Accumulated Points)',
          data: pnlsum(),
          borderColor: `#${bullishColor}`,
          backgroundColor: gradient,
          borderWidth: 1,
          order: 0,
          fill: true,
        });

        datasets.push({
          type: 'line',
          label: 'Portfolio Performance (Equity Curve)',
          data: equityPnL(),
          borderColor: `#${bearishColor}`,
          borderWidth: 1,
          order: 1,
          fill: false,
          tension: 0.5,
          pointStyle: false,
        });

        const profitabilityChartOptions = {
          //animation,
          responsive: false,
          elements: {
            point: {
              radius: 1,
            },
          },
          scales: {
            y: {
              beginAtZero: false,
            },
          },
        };

        myChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets,
          },
          options: profitabilityChartOptions,
        });

        document.getElementById('backtestingResultOrderHistory').innerHTML = `
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Time</th>
                      <th>Price</th>
                      <th>SL</th>
                      <th>TP</th>
                      <th>Direction</th>
                      <th>Order Status</th>
                      <th>Closed Price</th>
                      <th>Closed Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ordersHistory
                      .map(
                        (order) => `
                      <tr>
                        <td>${order.id}</td>
                        <td>${order.time}</td>
                        <td>${order.price.toFixed(5)}</td>
                        <td>${order.sl.toFixed(5)}</td>
                        <td>${order.tp.toFixed(5)}</td>
                        <td>${order.direction}</td>
                        <td>${order.orderStatus}</td>
                        <td>${order.closedPrice || ''}</td>
                        <td>${order.closedTime || ''}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              `;
        // End of Profitability Chart ========================================
      };
      window.profitabilityCalculation = profitabilityCalculation;

      const ohlcDataSeries = new OhlcDataSeries(wasmContext);

      // Create an OHLC series
      const FCRS = new FastCandlestickRenderableSeries(wasmContext, {
        dataSeries: ohlcDataSeries,
        strokeThickness: 1,
      });
      sciChartSurface.renderableSeries.add(FCRS);

      // Start of Window assigned custom scichart functions: ========================
      const addNewCandleToChart = (ohlcDataRow, dataIndex) => {
        if (candlesFromBuffer.length >= MAX_BUFFER_SIZE) {
          candlesFromBuffer.shift(); // Remove the oldest element if the buffer is full to save memory
        }
        candlesFromBuffer.push(ohlcDataRow);

        ohlcDataSeries.append(
          convertMT5DateToUnix(ohlcDataRow[0]),
          ohlcDataRow[1],
          ohlcDataRow[2],
          ohlcDataRow[3],
          ohlcDataRow[4]
        );
      };
      window.addNewCandleToChart = addNewCandleToChart;

      // Create a vertical line annotation for the first time
      /*const verticalAnnotation = new VerticalLineAnnotation({
            x1: convertMT5DateToUnix("2025-07-10 05:00"),
            stroke: `#0000FF`,
            opacity: 0.4,
            strokeThickness: 3,
          })*/
      //sciChartSurface.annotations.insert(0, verticalAnnotation); // Insert at index 0 to ensure it appears first

      // CSID Indicator: ========================================
      const CSIDDataSerieFromHighs = new XyDataSeries(wasmContext);
      const CSIDDataSerieFromLows = new XyDataSeries(wasmContext);

      const CSIDHighline = new FastLineRenderableSeries(wasmContext, {
        stroke: '#FFF',
        strokeThickness: 2,
        dataSeries: CSIDDataSerieFromHighs,
        opacity: 0.6,
      });
      const CSIDLowline = new FastLineRenderableSeries(wasmContext, {
        stroke: '#FFF',
        strokeThickness: 2,
        dataSeries: CSIDDataSerieFromLows,
        opacity: 0.6,
      });

      sciChartSurface.renderableSeries.add(CSIDHighline);
      sciChartSurface.renderableSeries.add(CSIDLowline);

      const updateCSIDLineAnnotation = (d, dataIndex) => {
        const index = dataIndex || 0;

        if (index < lookbackPeriod) return; // Ensure we have enough data for CSID calculation

        // store lookback candles:
        CSIDLookbackCandleSerie.push(d);

        // Calculate highest high and lowest low in the lookback period except the current candle:
        const candleDirection = (candle) =>
          getCandleDirection2(candle['<OPEN>'], candle['<CLOSE>']);

        const highPrices = CSIDLookbackCandleSerie.slice(
          CSIDLookbackCandleSerie.length - 1 - lookbackPeriod
        ).map((candle) =>
          candleDirection(candle) == 'BULL'
            ? candle['<CLOSE>']
            : candle['<OPEN>']
        );
        highestHighLong.push(Math.max(...highPrices));

        const lowPrices = CSIDLookbackCandleSerie.slice(
          CSIDLookbackCandleSerie.length - 1 - lookbackPeriod
        ).map((candle) =>
          candleDirection(candle) == 'BULL'
            ? candle['<OPEN>']
            : candle['<CLOSE>']
        );
        lowestLowShort.push(Math.min(...lowPrices));

        // Calculate slope:
        const slopeHighestHighLong =
          (highestHighLong[highestHighLong.length - 1] - highestHighLong[0]) /
          lookbackPeriod;
        const slopeLowestLowShort =
          (lowestLowShort[lowestLowShort.length - 1] - lowestLowShort[0]) /
          lookbackPeriod;

        // Flat line detection, mostly for UI styling:
        /*
                flatThreshold = 0.00001 // Adjust this value depending on how flat the line is
                isFlatHigh = Math.abs(highestHighLong - highestHighLong[1]) < flatThreshold
                isFlatLow = Math.abs(lowestLowShort - lowestLowShort[1]) < flatThreshold

                if (isFlatHigh || isFlatLow) {
                  debugger
                }
              */

        // Check for CSID breakout conditions (breakout of the highest high or lowest low && slope is less than threshold (consistency))
        const bullishCSID =
          d['<CLOSE>'] > highestHighLong[highestHighLong.length - 2]; // && Math.abs(slopeHighestHighLong) < slopeThreshold
        const bearishCSID =
          d['<CLOSE>'] < lowestLowShort[lowestLowShort.length - 2]; // && Math.abs(slopeLowestLowShort) < slopeThreshold

        // CSID Graph Related Annotations: ========================================
        // Add a new CSID Data for our line annotations:
        CSIDDataSerieFromHighs.append(
          convertMT5DateToUnix(d['<DATE>'] + ' ' + d['<TIME>']),
          highestHighLong[highestHighLong.length - 1]
        );
        CSIDDataSerieFromLows.append(
          convertMT5DateToUnix(d['<DATE>'] + ' ' + d['<TIME>']),
          lowestLowShort[lowestLowShort.length - 1]
        );

        // If previous candle was a breakout candle, we will not draw this new annotation,
        // I m gonna use a cooldown system rather than checking and modifying CSIDLookbackCandleSerie, for code simplicity (for now):
        if (CSIDSignalTriggered) {
          CSIDCoolddownSignal--;
          if (CSIDCoolddownSignal > 0) {
            return; // Skip drawing the annotation if we are in cooldown period
          } else {
            CSIDSignalTriggered = false; // Reset the cooldown signal
            CSIDCoolddownSignal = 5; // Reset the cooldown signal to 5 candles
          }
        }

        if (bullishCSID || bearishCSID) {
          CSIDSignalTriggered = true;

          if (bullishCSID) {
            const buySignal = new CustomAnnotation({
              x1: convertMT5DateToUnix(d['<DATE>'] + ' ' + d['<TIME>']),
              y1: d['<OPEN>'],
              verticalAnchorPoint: EVerticalAnchorPoint.Center,
              horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
              svgString: signalAnnotation.svgString.buy,
            });
            sciChartSurface.annotations.add(buySignal);
            AddActionOnChart(
              d,
              EnumActionType.TAKE_A_TRADE,
              EnumDirection.BULL
            );
          }
          if (bearishCSID) {
            const sellSignal = new CustomAnnotation({
              x1: convertMT5DateToUnix(d['<DATE>'] + ' ' + d['<TIME>']),
              y1: d['<OPEN>'],
              verticalAnchorPoint: EVerticalAnchorPoint.Center,
              horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
              svgString: signalAnnotation.svgString.sell,
            });
            sciChartSurface.annotations.add(sellSignal);
            AddActionOnChart(
              d,
              EnumActionType.TAKE_A_TRADE,
              EnumDirection.BEAR
            );
          }
        }
        // End of CSID Graph Related Annotations ========================================
      };
      window.updateCSIDLineAnnotation = updateCSIDLineAnnotation;
      // End of CSID Indicator: ========================================

      const clearAndDeleteChart = () => {
        // Clear the select element:
        $navigateTroughtDates.innerHTML = '';

        if (ohlcDataSeries) {
          ohlcDataSeries.clear();
          //sciChartSurface.annotations.clear();
        }
      };
      window.clearAndDeleteChart = clearAndDeleteChart;
      // End of Window assigned custom scichart functions: ========================

      // Add CursorModifier for crosshair
      sciChartSurface.chartModifiers.add(
        new CursorModifier({
          // Optional properties to configure what parts are shown
          showTooltip: false,
          showAxisLabels: true,
          showXLine: true,
          showYLine: true,
          // How close to a datapoint to show the tooltip? 10 = 10 pixels. 0 means always
          // hitTestRadius: 10,
          // Optional properties to configure the axis labels
          axisLabelFill: '#555',
          axisLabelStroke: '#ccc',
          // Optional properties to configure line and tooltip style
          crosshairStroke: '#555',
          crosshairStrokeThickness: 1,
          tooltipContainerBackground: '#000',
          // tooltipTextStroke: "#ff6600",
        }),
        new MouseWheelZoomModifier(),
        new ZoomPanModifier(),
        new ZoomExtentsModifier(),
        new YAxisDragModifier({ dragMode: EDragMode.Scaling }),
        new XAxisDragModifier({ dragMode: EDragMode.Scaling })
      );

      // Navigate Trought Dates: ========================================
      $navigateTroughtDates.addEventListener('change', function (event) {
        const getCandleNumberByDay = (days) => 86400 * days; // Get the number of candles in a day (candle count for a entire day)
        const selectedDate = event.target.value;
        const rangeMinDate = parseInt(selectedDate) - 1800; // + half an hour
        const rangeMaxDate = parseInt(selectedDate) + getCandleNumberByDay(0.1); // getCandleChartAxisLocationFromDate(selectedDate) + getCandleNumberByDay(0.1); // half of a day
        const xAxis = sciChartSurface.xAxes.get(0);
        const yAxis = sciChartSurface.yAxes.get(0);

        // Graph Zooming:
        xAxis.visibleRange = new NumberRange(rangeMinDate, rangeMaxDate);

        // yAxis.visibleRange = new NumberRange(1, 3);
        // updateYAxisRange();
        // sciChartSurface.zoomExtents();
      });
      // End of Navigate Trought Dates ========================================

      // Tools: ========================================
      const refreshAnnotations = () => {
        annotations.forEach((annotation) => {
          console.log(annotation);
          /*document.getElementById('annotations').value = annotations
                  .map((a) => JSON.stringify(a))
                  .join('\n');*/
        });
      };
      const RRToolBoxAnnotation = (xGraphValue, yGraphValue, options) =>
        new BoxAnnotation({
          ...RRToolStyles,
          x1: xGraphValue - 50,
          x2: xGraphValue + 300,
          y1: yGraphValue,
          ...options,
        });

      const addRRAnnotationBox = (ed) => {
        if (ed === EnumDirection.BULL) {
          sciChartSurface.annotations.add(
            RRToolBoxAnnotation(coords.xGraphValue, coords.yGraphValue, {
              fill: `#${bullishColor}${RRToolStyles.opacity}`,
              y2: coords.yGraphValue + tpSize(),
            })
          );
          sciChartSurface.annotations.add(
            RRToolBoxAnnotation(coords.xGraphValue, coords.yGraphValue, {
              fill: `#${bearishColor}${RRToolStyles.opacity}`,
              y2: coords.yGraphValue - slSize(),
            })
          );
        } else {
          sciChartSurface.annotations.add(
            RRToolBoxAnnotation(coords.xGraphValue, coords.yGraphValue, {
              fill: `#${bullishColor}${RRToolStyles.opacity}`,
              y2: coords.yGraphValue - tpSize(),
            })
          );
          sciChartSurface.annotations.add(
            RRToolBoxAnnotation(coords.xGraphValue, coords.yGraphValue, {
              fill: `#${bearishColor}${RRToolStyles.opacity}`,
              y2: coords.yGraphValue + slSize(),
            })
          );
        }
      };

      let coords = null;
      let selectedTool = null;
      let clickCount = 0;

      let lineToolFirstPoint = null;
      let lineToolSecondPoint = null;
      let rectangleToolFirstPoint = null;
      let rectangleToolSecondPoint = null;

      sciChartSurface.domCanvas2D.addEventListener('click', (event) => {
        const rect = sciChartSurface.domCanvas2D.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - 10 - 73; // -10 from left offset 'border/padding' of the canvas -73 because of the points legend/markers
        const mouseY = event.clientY - rect.top - 10; // -10 from top offset 'border/padding' of the canvas
        const xCoordCalc = sciChartSurface.xAxes
          .get(0)
          .getCurrentCoordinateCalculator();
        const yCoordCalc = sciChartSurface.yAxes
          .get(0)
          .getCurrentCoordinateCalculator();

        coords = {
          xPosition: xCoordCalc.getDataValue(event.clientX),
          yPosition: yCoordCalc.getDataValue(event.clientY),
          xGraphValue: parseFloat(xCoordCalc.getDataValue(mouseX).toFixed(0)),
          yGraphValue: parseFloat(
            yCoordCalc.getDataValue(mouseY).toFixed(decimals)
          ),
          x: xCoordCalc,
          y: yCoordCalc,
        };

        // console.log(coords);

        /*if (isListeningForToolActions) {
                    addRRAnnotationBox(EnumDirection.BULL);
                    isListeningForToolActions = false;
                  }*/

        if (selectedTool != null) {
          clickCount++;
        } else {
          clickCount = 0;
        }

        // console.log(clickCount);

        const lineToolActions = [
          () => {
            lineToolFirstPoint = coords;
          },
          () => {
            lineToolSecondPoint = coords;
            sciChartSurface.annotations.add(
              new LineAnnotation({
                stroke: `#${bullishColor}`,
                strokeThickness: 1,
                x1: lineToolFirstPoint.xGraphValue,
                x2: lineToolSecondPoint.xGraphValue,
                y1: lineToolFirstPoint.yGraphValue,
                y2: lineToolSecondPoint.yGraphValue,
              })
            );
            clickCount = 0;
            selectedTool = null;
          },
        ];

        const BOSActions = [
          () => {
            lineToolFirstPoint = coords;
          },
          () => {
            lineToolSecondPoint = {
              ...coords,
              yGraphValue: lineToolFirstPoint.yGraphValue,
            };
            sciChartSurface.annotations.add(
              new LineAnnotation({
                stroke: `#${bullishColor}`,
                strokeThickness: 1,
                x1: lineToolFirstPoint.xGraphValue,
                x2: lineToolSecondPoint.xGraphValue,
                y1: lineToolFirstPoint.yGraphValue,
                y2: lineToolSecondPoint.yGraphValue,
              })
            );
            clickCount = 0;
            selectedTool = null;
          },
        ];

        const CircleActions = [
          () => {
            lineToolFirstPoint = coords;
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: lineToolFirstPoint.xGraphValue,
                y1: lineToolFirstPoint.yGraphValue,
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString:
                  '<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg">' +
                  `<circle cx="10" cy="10" r="8" style="fill:#${bullishColor};fill-opacity:0.34117647;stroke:#${bullishColor};stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" />` +
                  '</svg>',
              })
            );
            clickCount = 0;
            selectedTool = null;
          },
          /*() => {
                      lineToolSecondPoint = {
                        ...coords,
                        yGraphValue: lineToolFirstPoint.yGraphValue, 
                      };
                    },*/
        ];

        const rectangleToolActions = [
          () => {
            rectangleToolFirstPoint = coords;
          },
          () => {
            rectangleToolSecondPoint = coords;
            sciChartSurface.annotations.add(
              new BoxAnnotation({
                x1: rectangleToolFirstPoint.xGraphValue,
                x2: rectangleToolSecondPoint.xGraphValue,
                y1: rectangleToolFirstPoint.yGraphValue,
                y2: rectangleToolSecondPoint.yGraphValue,
                fill: `#${bullishColor}${RRToolStyles.opacity}`,
                stroke: `#${bullishColor}`,
                strokeThickness: 1,
                opacity: 0.5,
              })
            );
            clickCount = 0;
            selectedTool = null;
          },
        ];

        switch (selectedTool) {
          case 'RRBuy':
            addRRAnnotationBox(EnumDirection.BULL);
            clickCount = 0;
            selectedTool = null;
            break;
          case 'RRSell':
            addRRAnnotationBox(EnumDirection.SELL);
            clickCount = 0;
            selectedTool = null;
            break;
          case 'line':
            stepByStep(clickCount, lineToolActions);
            break;
          case 'BOS':
            stepByStep(clickCount, BOSActions);
            break;
          case 'Circle':
            stepByStep(clickCount, CircleActions);
            break;
          case 'rectangle':
            stepByStep(clickCount, rectangleToolActions);
            break;
          default:
            return;
        }
      });

      document.querySelectorAll('[data-anotation]').forEach((button) => {
        button.removeAttribute('disabled');
        button.addEventListener('click', function () {
          let isListeningForToolActions = true;
          var anotationType = this.dataset.anotation;
          const rect = sciChartSurface.domCanvas2D.getBoundingClientRect();

          const rrTool = (enumDirection) => {
            isListeningForToolActions = true;
          };

          switch (anotationType) {
            case 'RRBuy':
              selectedTool = 'RRBuy';
              break;
            case 'RRSell':
              selectedTool = 'RRSell';
              break;
            case 'line':
              selectedTool = 'line';
              break;
            case 'BOS':
              selectedTool = 'BOS';
              break;
            case 'Circle':
              selectedTool = 'Circle';
              break;
            case 'rectangle':
              selectedTool = 'rectangle';
              break;
            default:
              console.log('No type');
          }
        });
      });
      // End of Tools ========================================
    })
    .catch((error) => {
      console.error('Error initializing SciChart:', error);
    });
}

const appendDataToChart = (d, dataIndex) => {
  //$csvDataField.value += JSON.stringify(d);
  addNewCandleToChart(
    [
      `${d['<DATE>']} ${d['<TIME>']}`,
      d['<OPEN>'],
      d['<HIGH>'],
      d['<LOW>'],
      d['<CLOSE>'],
    ],
    dataIndex
  );
};

const CSIDIndicator = (d, dataIndex) => {
  updateCSIDLineAnnotation(d, dataIndex);
};

// Create Indicators as the chart goes along:
const appendIndicatorsToChart = (d, dataIndex) => {
  // Example of appending indicators to the chart
  // This is a placeholder function, you can implement your own logic
  CSIDIndicator(d, dataIndex);
};

// Historical Trades Textarea Change Handler
document
  .getElementById('textareaHistoricalTradesLines')
  .addEventListener('change', function (event) {
    const tradesData = event.target.value;
    const rows = tradesData.split('\n');

    // Clear previous chart data
    chartData = [];

    // Parse trades data
    rows.forEach((row) => {
      if (row.trim()) {
        // Split by tab for myfxbook format
        const trade = row.split('\t');

        // Validate trade data
        if (trade.length >= 10) {
          const tradeObj = {
            timestamp: trade[0] ? trade[0].trim() : '',
            // Assuming the format is: Date Time, Symbol, Type, Lot Size, Open Price, -, Close Price, -, Profit, ...
            symbol: trade[2] ? trade[2].trim() : '',
            type: trade[3] ? trade[3].trim() : '',
            lotSize: trade[4] ? parseFloat(trade[4].trim()) : 0,
            openPrice: trade[5] ? parseFloat(trade[5].trim()) : 0,
            closePrice: trade[7] ? parseFloat(trade[7].trim()) : 0,
            profit: trade[9] ? parseFloat(trade[9].trim()) : 0,
          };

          // Add trade to chart data
          chartData.push(tradeObj);
        } else {
          console.warn('Invalid trade data:', row);
        }
      }
    });

    // Attempt to update chart if possible
    try {
      // Check for custom chart update function
      if (typeof updateChartWithTrades === 'function') {
        updateChartWithTrades(chartData);
      }
      // Fallback to global chart update methods
      else if (window.updateChart) {
        window.updateChart(chartData);
      }
      // If no update method, log warning
      else {
        console.warn('No chart update method available');
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  });

// Placeholder function for chart update
function updateChartWithTrades(trades) {
  console.log('Updating chart with trades:', trades);

  // Log trades to a dedicated div for visibility
  const tradeHistoryDiv = document.getElementById(
    'backtestingResultOrderHistory'
  );
  if (tradeHistoryDiv) {
    tradeHistoryDiv.innerHTML = trades
      .map(
        (trade) =>
          `<div class='trade-entry'>
            <span>Symbol: ${trade.symbol}</span>
            <span>Type: ${trade.type}</span>
            <span>Open: ${trade.openPrice}</span>
            <span>Close: ${trade.closePrice}</span>
            <span>Profit: ${trade.profit}</span>
          </div>`
      )
      .join('');
  }

  // Attempt to update chart if possible
  try {
    // Fallback methods for chart update
    if (typeof addNewCandleToChart === 'function') {
      trades.forEach((trade, index) => {
        addNewCandleToChart(
          [
            trade.timestamp,
            trade.openPrice,
            trade.high || trade.openPrice,
            trade.low || trade.closePrice,
            trade.closePrice,
          ],
          index
        );
      });
    } else if (
      typeof sciChartSurface !== 'undefined' &&
      sciChartSurface.annotations
    ) {
      // Minimal SciChart interaction if available
      //sciChartSurface.annotations.clear();
    }
  } catch (error) {
    console.error('Error updating chart with trades:', error);
  }
}

// Aggressive error prevention for chart-related functions
(function () {
  // Create a proxy to intercept and suppress onCandleDrawn calls
  const handler = {
    get: function (target, prop) {
      if (prop === 'onCandleDrawn') {
        return function () {
          console.log('Suppressed onCandleDrawn call');
          return true; // Return a truthy value to prevent errors
        };
      }
      return target[prop];
    },
  };

  // Wrap window with a proxy to intercept function calls
  window = new Proxy(window, {
    get: function (target, prop) {
      if (prop === 'onCandleDrawn') {
        return function () {
          console.log('Suppressed onCandleDrawn call');
          return true; // Return a truthy value to prevent errors
        };
      }
      return target[prop];
    },
  });

  // Ensure AddActionOnChart is a safe function
  if (typeof window.AddActionOnChart !== 'function') {
    window.AddActionOnChart = function (trade, action) {
      // Log detailed trade information
      console.log('Trade Action:', {
        symbol: trade.symbol || 'Unknown',
        direction: action,
        openPrice: trade.entryPrice || trade.openPrice,
        time: trade.openedTradeDateTime || new Date().toISOString(),
        lotSize: trade.lotSize || 0,
      });

      // Try to update trade history display
      const tradeHistoryDiv = document.getElementById(
        'backtestingResultOrderHistory'
      );
      if (tradeHistoryDiv) {
        const tradeEntry = document.createElement('div');
        tradeEntry.className =
          'trade-entry ' +
          (action === EnumDirection.BULL ? 'bullish' : 'bearish');
        tradeEntry.innerHTML = `
              <span>Symbol: ${trade.symbol || 'N/A'}</span>
              <span>Direction: ${action}</span>
              <span>Price: ${
                trade.entryPrice || trade.openPrice || 'N/A'
              }</span>
              <span>Time: ${trade.openedTradeDateTime || 'N/A'}</span>
            `;
        tradeHistoryDiv.appendChild(tradeEntry);
      }

      return true;
    };
  }

  // Override global function definitions
  function onCandleDrawn() {
    console.log('Suppressed onCandleDrawn call');
    return true;
  }

  function AddActionOnChart(trade, action) {
    console.log('Placeholder AddActionOnChart called:', { trade, action });
    return true;
  }

  // Attempt to modify prototype chains to prevent errors
  try {
    if (window.hasOwnProperty('onCandleDrawn')) {
      delete window.onCandleDrawn;
    }
  } catch (error) {
    console.error('Error removing onCandleDrawn:', error);
  }
})();
