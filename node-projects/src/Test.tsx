import axios from 'axios';
import { useEffect } from 'react';
import {
  CategoryAxis,
  FastOhlcRenderableSeries,
  NumericAxis,
  OhlcDataSeries,
  SciChartDefaults,
  SciChartJsNavyTheme,
  SciChartSurface
} from 'scichart';

SciChartDefaults.enableResampling = false;
SciChartDefaults.performanceWarnings = false;

const Test = () => {
  
  // const url = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=EURUSD&interval=1min&apikey=UWFE4L3M53KZ4YEX';
  const url = 'https://api.binance.com/api/v3/klines?symbol=LTCBTC&interval=1m';

  enum DataConversionEnum {
    Binance = 'BINANCE',
    AlphaVantage = 'ALPHAVANTAGE'
  }

  interface IPriceData {
    time: number,
    open: number,
    high: number,
    low: number,
    close: number
  }
  
  let structuredData: IPriceData[] = [];

  const structuringData = (dataResponse: any, dataConversionEnum: DataConversionEnum): IPriceData[] => {
    switch (dataConversionEnum) {
      case DataConversionEnum.Binance:
        return dataResponse.map((item: any) => ({
          /* https://developers.binance.com/docs/binance-spot-api-docs/rest-api#klinecandlestick-data
            [
              1499040000000,      // Kline open time
              "0.01634790",       // Open price
              "0.80000000",       // High price
              "0.01575800",       // Low price
              "0.01577100",       // Close price
              "148976.11427815",  // Volume
              1499644799999,      // Kline Close time
              "2434.19055334",    // Quote asset volume
              308,                // Number of trades
              "1756.87402397",    // Taker buy base asset volume
              "28.46694368",      // Taker buy quote asset volume
              "0"                 // Unused field, ignore.
            ]
          */
            time: item[0], // Unix timestamp in milliseconds
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4])
        }));
      case DataConversionEnum.AlphaVantage:
        return [];
      default:
        return [];
    }
  };

  // Dispose of SciChartSurface when the component is unmounted
  // return () => initSciChart();

  useEffect(() => {
    const initSciChart = async () => {
      SciChartSurface.UseCommunityLicense()
      const { sciChartSurface, wasmContext } = await SciChartSurface.create('scichart-root', {
        theme: new SciChartJsNavyTheme(),
      });

      // Create an X,Y Axis and add to the chart
      sciChartSurface.xAxes.add(new CategoryAxis(wasmContext));
      sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { labelPrefix: "$", labelPrecision: 2 }));

      axios.get(url)
        .then(response => {
          structuringData(
            response.data,
            DataConversionEnum.Binance,
          )

          /*
            const timeSeries = response.data['1m'];
            if (!timeSeries) {
              console.error('Time Series data is not available');
              return;
            }
          */

          /*
            const data = Object.keys(structuredData).map((key: string, value, object) => {
              date: new Date(item[0]),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              // object[key]
            });
          */
          
          // const xValues = structuredData.map(d => d.time.getTime());
          const xValues = structuredData.map(d => d.time);
          const openValues = structuredData.map(d => d.open);
          const highValues = structuredData.map(d => d.high);
          const lowValues = structuredData.map(d => d.low);
          const closeValues = structuredData.map(d => d.close);

          // Create a OhlcDataSeries with open, high, low, close values
          /*
            const dataSeries = new OhlcDataSeries(wasmContext, {
              xValues: xValues,
              openValues: openValues,
              lowValues: lowValues,          
              highValues: highValues,
              closeValues: closeValues,
            });
          */

          const dataSeries = new OhlcDataSeries(wasmContext, {
            xValues: xValues,
            openValues: openValues,
            lowValues: lowValues,
            closeValues: closeValues,
            highValues: highValues,
          });
          
          // Create and add the OhlcSeries series
          const ohlcSeries = new FastOhlcRenderableSeries(wasmContext, {
            dataSeries,
            strokeThickness: 1,
            dataPointWidth: 0.7,
          });

          sciChartSurface.renderableSeries.add(ohlcSeries);
          
        })
        .catch(error => {
          console.error(error);
        });
    }

    initSciChart();
  }, []);

  return (
    <div id="scichart-root" style={{ width: '100%', height: '100%' }}></div>
  );
}

export default Test;