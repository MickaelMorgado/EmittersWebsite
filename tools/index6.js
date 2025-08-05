// NOTES:
/*
  Most of the functions if they are using charting annotation, they need to be inside initchart function.
  - The Graph is now populating or get drawned with the CSV file data at a pace speed (one by one).
  - When dealing with times for candles never forget this pattern: `${d[EnumMT5OHLC.DATE]} $d[EnumMT5OHLC.TIME]}`
*/

// Result Panel Related Actions / Triggers:
const resultPanel = document.querySelector('#result-panel');
const $csvRefresh = document.querySelector('#csvRefresh');
//const $csvDataField = document.getElementById('csvContent');
const $csvFileInput = document.getElementById('csvFileInput');
const toolbarToggler = document.querySelector('#result-panel-toolbar-toggler');
const $navigateTroughtDates = document.getElementById('NavigateTroughtDates');
const $SLPointsInput = document.getElementById('SLPoints');
const $TPPointsInput = document.getElementById('TPPoints');
const $LotSizeInput = document.getElementById('LotSize');
const $textareaHistoricalTradesLines = document.getElementById(
  'textareaHistoricalTradesLines'
);
const $firstDate = document.getElementById('firstDate');
const $lastDate = document.getElementById('lastDate');
const $currentReadingDate = document.getElementById('currentReadingDate');
//const audioTick = new Audio('squirrel_404_click_tick.wav');
const audioNotify = new Audio('joseegn_ui_sound_select.wav');

const $backTestingPauseButton = document.getElementById(
  'backTestingPauseButton'
);
let backTestingPaused = $backTestingPauseButton.checked;

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

$SLPointsInput.addEventListener('change', () => {
  animateActiveClass($csvRefresh);
});
$TPPointsInput.addEventListener('change', () => {
  animateActiveClass($csvRefresh);
});
$LotSizeInput.addEventListener('change', () => {
  animateActiveClass($csvRefresh);
});
$backTestingPauseButton.addEventListener('change', () => {
  backTestingPaused = $backTestingPauseButton.checked;

  if (!backTestingPaused) {
    animateActiveClass($csvRefresh);
  }
});
/* ---- */

const decimals = 5;
let candlesFromBuffer = [];
const MAX_BUFFER_SIZE = 10;
let slSize = () => parseFloat($SLPointsInput.value);
let tpSize = () => parseFloat($TPPointsInput.value);
let lotSize = () => parseFloat($LotSizeInput.value);
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
  DATE: '<DATE>',
  TIME: '<TIME>',
  OPEN: '<OPEN>',
  HIGH: '<HIGH>',
  LOW: '<LOW>',
  CLOSE: '<CLOSE>',
};

// Get candle direction based on open and close prices:
const getCandleDirection = (openPrice = 0, closePrice = 0) => {
  if (openPrice == 0 || closePrice == 0) {
    return EnumDirection.BULL; // Default to BULL if no prices are provided
  }
  return closePrice > openPrice ? EnumDirection.BULL : EnumDirection.BEAR;
};
// Get candle direction from candle object:
const getCandleDirectionFromCandle = (candle) =>
  getCandleDirection(candle[EnumMT5OHLC.OPEN], candle[EnumMT5OHLC.CLOSE]);

const getCandleChartAxisLocationFromDate = (date) => {
  return new Date(date).getTime() / 1000;
};
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

const readingSpeed = 0; // Speed of reading the CSV file in milliseconds

const csvData = [];
let CSIDLookbackCandleSerie = [];
let CSIDSignalTriggered = false;
let CSIDCoolddownSignal = 5;
let csvDataIndex = 0;
let numbDays = 0;
let ordersHistory = [];
let firstDate = new Date();
let lastDate = new Date();
window.ordersHistory = ordersHistory;

const handleFileAndInitGraph = (file) => {
  if (file) {
    reinitializeChart();

    // Clear orders history
    ordersHistory = [];
    numbDays = 0;

    // Reset portfolio graph and order history display
    document.getElementById('backtestingResult').value = '';
    document.getElementById('backtestingResultOrderHistory').innerHTML = '';

    // Add visible class to loading element
    document.getElementById('loading-element').classList.add('visible');

    // Read the CSV file just to get the first and last dates:
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);

      const firstLine = lines[1];
      const lastLine = lines[lines.length - 1];

      firstDate = firstLine.split('\t')[0];
      lastDate = lastLine.split('\t')[0];

      $firstDate.textContent = firstDate;
      $lastDate.textContent = lastDate;
    };
    reader.readAsText(file);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      step: function (results, parser) {
        if (backTestingPaused) {
          parser.pause();
          document
            .getElementById('loading-element')
            .classList.remove('visible');
          return;
        }

        const row = results.data;
        csvDataIndex += 1;

        parser.pause();
        // Dynamic infos:
        updateDynamicInfos(results.data, csvDataIndex);
        // Append data to the chart:
        appendDataToChart(results.data, csvDataIndex);
        // Backtesting date time logics (annotation on chart and select element population):
        addBacktestingDateTimeToChart(results.data, csvDataIndex);
        // Plot real-time indicators:
        appendIndicatorsToChart(results.data, csvDataIndex);
        // Run the Check for TP/SL hit function on every drawn candle:
        checkForTPSLHit(results.data, csvDataIndex);
        // Calculate and Display profitability statistics:
        profitabilityCalculation();

        //audioTick.play();

        setTimeout(() => {
          parser.resume();
        }, readingSpeed);
      },
      complete: function (results, file) {
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

$csvRefresh.addEventListener('click', () => {
  const file = $csvFileInput.files[0];
  $backTestingPauseButton.checked = false;
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
    TextAnnotation,
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
    //theme: new SciChartJsNavyTheme(),
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
        axis3DBandsFill: '#000', //'#1F3D6833', // Bands (Not sure if used)
        axisBandsFill: '#030300', // Bands
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
        majorGridLineBrush: '#111', // Major grid lines color
        minorGridLineBrush: '#000', // Minor grid lines color
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
      let arrayOfSignals = [false, true]; // 2 signals required
      // Variables initialization for CSID:
      let rollingHighestHighDataSeries = null;
      let rollingLowestLowDataSeries = null;
      const lookbackPeriod = 15;
      const lookbackPeriodForCSIDHigh = lookbackPeriod;
      const lookbackPeriodForCSIDLow = 9;
      const highestHighLong = [];
      const lowestLowShort = [];
      // End of Variables initialization =========================

      const signalOffset = 20;
      const signalAnnotation = {
        svgString: {
          buy: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#0000FF;" d="M 55,85 L 60,75 L 65,85 Z"/></g></svg>`,
          bullish: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" transform="translate(0, ${signalOffset})"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#00FF00; opacity:0.3;" d="M 55,85 L 60,75 L 65,85 Z"/></g></svg>`,
          sell: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#FF0000;" d="M 55,75 L 60,85 L 65,75 Z"/></g></svg>`,
          bearish: `<svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" transform="translate(0, -${signalOffset})"><g transform="translate(-54.616083,-75.548914)"><path style="fill:#FF0000; opacity:0.3;" d="M 55,75 L 60,85 L 65,75 Z"/></g></svg>`,
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

      // Take trades when signals are valid:
      const checkSignalsForTrade = (d, direction) => {
        const takeTradeSignal =
          arrayOfSignals[0] == true &&
          arrayOfSignals[1] == true &&
          arrayOfSignals[2] == true; // CSID, TTR, ATR
        if (takeTradeSignal) {
          AddActionOnChart(d, EnumActionType.TAKE_A_TRADE, direction);
        }
      };

      // TP/SL Validation: ========================================
      // Function to check all TP/SL hit:
      // TODO: Pretty sure that we can reduce and optimze this function.
      const checkForTPSLHit = (d, dataIndex) => {
        ordersHistory.forEach((order) => {
          if (order.closed) return;

          const isBull = order.direction === EnumDirection.BULL;
          const high = d[EnumMT5OHLC.HIGH];
          const low = d[EnumMT5OHLC.LOW];
          const currentTime = `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`;
          const orderOpenTime = convertMT5DateToUnix(order.time);

          const closeOrder = (level, status, color) => {
            order.closed = true;
            order.closedPrice = level;
            order.closedTime = currentTime;
            order.orderStatus = status;

            const orderCloseTime = convertMT5DateToUnix(order.closedTime);

            // Marker + Label
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: orderCloseTime,
                y1: level,
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.sell,
              }),
              new TextAnnotation({
                text: order.id,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
                x1: orderCloseTime,
                y1: level,
              })
            );

            // Line
            sciChartSurface.annotations.add(
              new LineAnnotation({
                stroke: `#${color}`,
                strokeThickness: 1,
                strokeDashArray: [5, 5],
                x1: orderOpenTime,
                x2: orderCloseTime,
                y1: order.price,
                y2: level,
              })
            );
          };

          // Check TP
          if ((isBull && high >= order.tp) || (!isBull && low <= order.tp)) {
            closeOrder(order.tp, EnumOrderStatus.CLOSED_BY_TP, bullishColor);
          }

          // Check SL
          if ((isBull && low <= order.sl) || (!isBull && high >= order.sl)) {
            closeOrder(order.sl, EnumOrderStatus.CLOSED_BY_SL, bearishColor);
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
            const definedCandleMoment = EnumMT5OHLC.OPEN;
            const orderOptionsBasedDirection = (tradeDirection) => {
              if (tradeDirection == EnumDirection.BULL) {
                return {
                  sl: candle[definedCandleMoment] - slSize(),
                  tp: candle[definedCandleMoment] + tpSize(),
                  direction: EnumDirection.BULL,
                };
              } else {
                return {
                  sl: candle[definedCandleMoment] + slSize(),
                  tp: candle[definedCandleMoment] - tpSize(),
                  direction: EnumDirection.BEAR,
                };
              }
            };

            // Add order to history:
            ordersHistory.push({
              id: ordersHistory.length + 1,
              time: `${candle[EnumMT5OHLC.DATE]} ${candle[EnumMT5OHLC.TIME]}`,
              price: candle[definedCandleMoment],
              orderStatus: EnumOrderStatus.PENDING,
              ...orderOptionsBasedDirection(tradeDirection),
            });
            window.ordersHistory = ordersHistory;

            // Add annotation from entry:
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[definedCandleMoment],
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
                  sl: candle[definedCandleMoment],
                  tp: candle[definedCandleMoment],
                  direction: EnumDirection.BULL,
                };
              } else {
                return {
                  sl: candle[definedCandleMoment],
                  tp: candle[definedCandleMoment],
                  direction: EnumDirection.BEAR,
                };
              }
            };
            // Add order to history:
            ordersHistory.push({
              id: ordersHistory.length + 1,
              time: candle[EnumMT5OHLC.TIME],
              price: candle[definedCandleMoment],
              orderStatus: EnumOrderStatus.PENDING,
              ...orderOptionsBasedDirection2(tradeDirection),
            });

            window.ordersHistory = ordersHistory;

            // Add annotation from entry:
            sciChartSurface.annotations.add(
              new CustomAnnotation({
                x1: candlePosition,
                y1: candle[definedCandleMoment],
                verticalAnchorPoint: EVerticalAnchorPoint.Center,
                horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
                svgString: signalAnnotation.svgString.buy,
              })
            );
            break;
        }
      };
      // End of AddActionOnChart ========================================

      let canTakeATrade = true;
      let inRange = false;
      let savedTradeDirectionForNextCandleEntry = null;
      let swingHighLowHistory = [];
      let fvgHistory = [];
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
            selectedCandleForAnalisis[EnumMT5OHLC.HIGH] <=
              swhlPrevCandle[EnumMT5OHLC.HIGH] &&
            swhlPrevCandle2[EnumMT5OHLC.OPEN] <
              swhlPrevCandle[EnumMT5OHLC.OPEN] &&
            selectedCandleForAnalisis[EnumMT5OHLC.HIGH] >=
              swhlNextCandle[EnumMT5OHLC.HIGH] &&
            getCandleDirectionFromCandle(selectedCandleForAnalisis) ==
              EnumDirection.BEAR;
          // For swing low, current candle low is greater than or equal to the previous candle low and the previous candle low is less than the previous candle close:
          isSwingLow =
            selectedCandleForAnalisis[EnumMT5OHLC.LOW] >=
              swhlPrevCandle[EnumMT5OHLC.LOW] &&
            swhlPrevCandle2[EnumMT5OHLC.CLOSE] >
              swhlPrevCandle[EnumMT5OHLC.CLOSE] &&
            selectedCandleForAnalisis[EnumMT5OHLC.LOW] <=
              swhlNextCandle[EnumMT5OHLC.LOW] &&
            getCandleDirectionFromCandle(selectedCandleForAnalisis) ==
              EnumDirection.BULL;

          return isSwingLow || isSwingHigh;
        };

        if (SignalSwingHighLow()) {
          swingHighLowHistory.push({
            time: swhlPrevCandle[0],
            maxReachedPrice: isSwingHigh
              ? selectedCandleForAnalisis[EnumMT5OHLC.HIGH]
              : selectedCandleForAnalisis[EnumMT5OHLC.LOW], // Represents the highest/lowest price that was reached.
            type: isSwingHigh ? 'HIGH' : 'LOW', // Represents the type of the swing (HIGH or LOW) its the position and NOT the candle direction.
          });

          sciChartSurface.annotations.add(
            new CustomAnnotation({
              x1: convertMT5DateToUnix(
                selectedCandleForAnalisis[EnumMT5OHLC.TIME]
              ),
              y1: isSwingHigh
                ? selectedCandleForAnalisis[EnumMT5OHLC.HIGH]
                : selectedCandleForAnalisis[EnumMT5OHLC.LOW],
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

        //console.log('Orders History:', ordersHistory);
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
          animation: {
            duration: 0,
          },
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
                      <tr class="historical-order-line">
                        <td>${order.id}</td>
                        <td>${order.time}</td>
                        <td>${order.price.toFixed(5)}</td>
                        <td>${order.sl.toFixed(5)}</td>
                        <td>${order.tp.toFixed(5)}</td>
                        <td>${order.direction}</td>
                        <td class="order-status-${order.orderStatus}">${
                          order.orderStatus
                        }</td>
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
      const addNewCandleToChart = (d, dataIndex) => {
        if (candlesFromBuffer.length >= MAX_BUFFER_SIZE) {
          candlesFromBuffer.shift(); // Remove the oldest element if the buffer is full to save memory
        }
        candlesFromBuffer.push(d);

        ohlcDataSeries.append(
          convertMT5DateToUnix(`${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`),
          d[EnumMT5OHLC.OPEN],
          d[EnumMT5OHLC.HIGH],
          d[EnumMT5OHLC.LOW],
          d[EnumMT5OHLC.CLOSE]
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

      // Create a vertical line annotation for backtesting date time:
      const bttVerticalLineAnnotation = (btt) => {
        const bttLine = new VerticalLineAnnotation({
          labelPlacement: ELabelPlacement.TopRight,
          showLabel: true,
          stroke: '#666666',
          strokeThickness: 2,
          x1: btt,
          axisLabelFill: '#666666',
          axisLabelStroke: '#333',
        });
        sciChartSurface.annotations.add(bttLine);
        animateActiveClass(document.getElementById('ntd-notify'));
      };
      window.bttVerticalLineAnnotation = bttVerticalLineAnnotation;

      // ATR Indicator: ========================================
      const calcATR = (d, dataIndex) => {
        const ATRLength = MAX_BUFFER_SIZE; // ATR period

        if (dataIndex < ATRLength) return; // Ensure we have enough data for ATR calculation

        //console.log('candlesFromBuffer:', candlesFromBuffer); // candlesFromBuffer

        // Calculate True Range (TR) for each candle
        const tr = candlesFromBuffer.map((c, i) => {
          if (i === 0) return 0; // No TR for the first candle
          const prevCandle = candlesFromBuffer[i - 1];
          return Math.max(
            c[EnumMT5OHLC.HIGH] - c[EnumMT5OHLC.LOW],
            Math.abs(c[EnumMT5OHLC.HIGH] - prevCandle[EnumMT5OHLC.CLOSE]),
            Math.abs(c[EnumMT5OHLC.LOW] - prevCandle[EnumMT5OHLC.CLOSE])
          );
        });
        // console.log('tr:', tr); // tr

        // Calculate Average True Range (ATR)
        const atr = tr.reduce((acc, val) => acc + val, 0) / ATRLength;
        // // TODO: this is currently the average and not current candle institutional move (comparing current candle against atr)
        const atrAboveThreshold = atr > 0.0001; // Example threshold, adjust as needed
        //console.table([atr, atrAboveThreshold]); // atr

        arrayOfSignals[2] = atrAboveThreshold;
      };
      window.calcATR = calcATR;
      // End of ATR Indicator: ========================================

      // TTR Indicator: ========================================
      const inTradingTimeRange = (d) => {
        const startRangeTime = new Date(`${d[EnumMT5OHLC.DATE]} 09:50:00`);
        const endRangeTime = new Date(`${d[EnumMT5OHLC.DATE]} 12:00:00`);
        const currentTime = new Date(
          `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`
        );
        const inTradingTimeRange =
          currentTime >= startRangeTime && currentTime <= endRangeTime;
        //console.table([startRangeTime, currentTime, endRangeTime, currentTime >= startRangeTime && currentTime <= endRangeTime, inTradingTimeRange, arrayOfSignals]);
        arrayOfSignals[1] = inTradingTimeRange;
      };
      window.inTradingTimeRange = inTradingTimeRange;
      // End of TTR Indicator: ========================================

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
        // This validation to fake next candle:
        if (arrayOfSignals[0] == true) {
          checkSignalsForTrade(d, savedTradeDirectionForNextCandleEntry);
          arrayOfSignals[0] = false;
        } else {
          arrayOfSignals[0] = false;
        }

        if (index < lookbackPeriod) return; // Ensure we have enough data for CSID calculation

        // store lookback candles:
        CSIDLookbackCandleSerie.push(d);

        // Calculate highest high and lowest low in the lookback period except the current candle:
        const highPrices = CSIDLookbackCandleSerie.slice(
          CSIDLookbackCandleSerie.length - 1 - lookbackPeriod
        ).map((candle) =>
          getCandleDirectionFromCandle(candle) == EnumDirection.BULL
            ? candle[EnumMT5OHLC.CLOSE]
            : candle[EnumMT5OHLC.OPEN]
        );
        highestHighLong.push(Math.max(...highPrices));

        const lowPrices = CSIDLookbackCandleSerie.slice(
          CSIDLookbackCandleSerie.length - 1 - lookbackPeriod
        ).map((candle) =>
          getCandleDirectionFromCandle(candle) == EnumDirection.BULL
            ? candle[EnumMT5OHLC.OPEN]
            : candle[EnumMT5OHLC.CLOSE]
        );
        lowestLowShort.push(Math.min(...lowPrices));

        /*
          // Calculate slope:
          const slopeHighestHighLong =
            (highestHighLong[highestHighLong.length - 1] - highestHighLong[0]) /
            lookbackPeriod;
          const slopeLowestLowShort =
            (lowestLowShort[lowestLowShort.length - 1] - lowestLowShort[0]) /
            lookbackPeriod;
        */

        /*
          // Flat line detection, mostly for UI styling:
            flatThreshold = 0.00001 // Adjust this value depending on how flat the line is
            isFlatHigh = Math.abs(highestHighLong - highestHighLong[1]) < flatThreshold
            isFlatLow = Math.abs(lowestLowShort - lowestLowShort[1]) < flatThreshold

            if (isFlatHigh || isFlatLow) {
              debugger
            }
        */

        // Check for CSID breakout conditions (breakout of the highest high or lowest low && slope is less than threshold (consistency))
        const bullishCSID =
          d[EnumMT5OHLC.CLOSE] > highestHighLong[highestHighLong.length - 2]; // && Math.abs(slopeHighestHighLong) < slopeThreshold
        const bearishCSID =
          d[EnumMT5OHLC.CLOSE] < lowestLowShort[lowestLowShort.length - 2]; // && Math.abs(slopeLowestLowShort) < slopeThreshold

        // CSID Graph Related Annotations: ========================================
        // Add a new CSID Data for our line annotations:
        CSIDDataSerieFromHighs.append(
          convertMT5DateToUnix(d[EnumMT5OHLC.DATE] + ' ' + d[EnumMT5OHLC.TIME]),
          highestHighLong[highestHighLong.length - 1]
        );
        CSIDDataSerieFromLows.append(
          convertMT5DateToUnix(d[EnumMT5OHLC.DATE] + ' ' + d[EnumMT5OHLC.TIME]),
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

          const isBull = bullishCSID;
          const svgString = isBull
            ? signalAnnotation.svgString.bullish
            : signalAnnotation.svgString.bearish;
          const svgCandleLocation = isBull ? EnumMT5OHLC.LOW : EnumMT5OHLC.HIGH;
          const direction = isBull ? EnumDirection.BULL : EnumDirection.BEAR;

          const signal = new CustomAnnotation({
            x1: convertMT5DateToUnix(
              d[EnumMT5OHLC.DATE] + ' ' + d[EnumMT5OHLC.TIME]
            ),
            y1: d[svgCandleLocation],
            verticalAnchorPoint: EVerticalAnchorPoint.Center,
            horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
            svgString,
          });
          sciChartSurface.annotations.add(signal);

          // Update first signal then check signals validation:
          arrayOfSignals[0] = true;
          savedTradeDirectionForNextCandleEntry = direction;
          //checkSignalsForTrade(d, direction);
          //AddActionOnChart(d, EnumActionType.TAKE_A_TRADE, direction);
        }
        // End of CSID Graph Related Annotations ========================================
      };
      window.updateCSIDLineAnnotation = updateCSIDLineAnnotation;
      // End of CSID Indicator: ========================================

      const reinitializeChart = () => {
        // Clear the select element:
        $navigateTroughtDates.innerHTML = '';
        //sciChartSurface.annotations.clear();
        //sciChartSurface.renderableSeries.clear() // Clear the series, like chart and indicators
        sciChartSurface.renderableSeries.remove(CSIDHighline);
        sciChartSurface.renderableSeries.remove(CSIDLowline);
        //console.log('RS: Chart cleared');
        initSciChart();
        //initializeCSIDIndicator();
      };
      window.reinitializeChart = reinitializeChart;

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

// Notify ===============================
const animateActiveClass = (element) => {
  audioNotify.play();
  element.classList.add('active');
  setTimeout(() => {
    element.classList.remove('active');
  }, 3000);
};
// End of Notify ===============================

function updateFileReadingProgression(valueInPercentage) {
  const progressionBar = document.querySelector(
    '#fileReadingProgression .progression'
  );
  progressionBar.style.width = `${valueInPercentage}%`;
}
window.updateFileReadingProgression = updateFileReadingProgression;

let prevDate = null;
const updateDynamicInfos = (d) => {
  if (prevDate !== d['<DATE>']) {
    $currentReadingDate.innerText = d['<DATE>'];

    // Update progression bar:
    const numberOfDays = Math.ceil(
      (new Date(lastDate) - new Date(firstDate)) / (1000 * 60 * 60 * 24)
    );
    updateFileReadingProgression((numbDays * 100) / numberOfDays);

    animateActiveClass($currentReadingDate);
    prevDate = d['<DATE>'];
  }
};

const appendDataToChart = (d, dataIndex) => {
  //$csvDataField.value += JSON.stringify(d);
  addNewCandleToChart(d, dataIndex);
};

const addBacktestingDateTimeToChart = (d) => {
  // Backtesting dates ====================================
  let candleDateTime = `${d[EnumMT5OHLC.DATE]} ${d[EnumMT5OHLC.TIME]}`; // excepted format: "1970.01.01 00:00:00"
  let unixTime = convertMT5DateToUnix(candleDateTime); // format: 1624982400 for 2021-06-29 00:00:00
  let candleTime = candleDateTime.split(' ')[1]; // get the time from the date string (00:00:00)
  let backTestTime = getCandleChartAxisLocationFromDate(candleDateTime); // + 3600; // Actually the same as above (candleDateTimeStamp)

  var selectedTime = document.getElementById('backtesting-hour').value;

  if (candleTime == selectedTime) {
    numbDays = numbDays + 1;
    let btt = backTestTime; // * 1000;
    //let formatedDate = formatDateFromUnix(btt);

    bttVerticalLineAnnotation(btt);
    // Display Backtesting dates on the select element:
    $navigateTroughtDates.innerHTML += `<option value="${unixTime}">${candleDateTime}</option>`;
  }
  // End of Backtesting dates ====================================
};

const CSIDIndicator = (d, dataIndex) => {
  updateCSIDLineAnnotation(d, dataIndex);
};

// Create Indicators as the chart goes along:
const appendIndicatorsToChart = (d, dataIndex) => {
  // Example of appending indicators to the chart
  // This is a placeholder function, you can implement your own logic
  CSIDIndicator(d, dataIndex);
  inTradingTimeRange(d);
  calcATR(d, dataIndex);
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
