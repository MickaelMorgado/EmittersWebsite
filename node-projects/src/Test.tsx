import React, { useEffect } from 'react';
import { SciChartSurface, NumericAxis, XyDataSeries, FastCandlestickRenderableSeries, ENumericFormat } from 'scichart';
// import { appTheme } from './SciChartTheme';  // Assuming you have a theme file
import axios from 'axios';

const Test = () => {
    useEffect(() => {
        const initSciChart = async () => {
            const { sciChartSurface, wasmContext } = await SciChartSurface.create('scichart-root');
        }
    })

    const url = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=EURUSD&interval=1min&apikey=UWFE4L3M53KZ4YEX';

axios.get(url)
    .then(response => {
        debugger
        const timeSeries = response.data['Time Series (1min)'];
        if (!timeSeries) {
            console.error('Time Series data is not available');
            return;
        }
        const data = Object.keys(timeSeries).map(time => ({
            date: new Date(time),
            open: parseFloat(timeSeries[time]['1. open']),
            high: parseFloat(timeSeries[time]['2. high']),
            low: parseFloat(timeSeries[time]['3. low']),
            close: parseFloat(timeSeries[time]['4. close']),
        }));

          const xValues = data.map(d => d.date.getTime());
          const openValues = data.map(d => d.open);
          const highValues = data.map(d => d.high);
          const lowValues = data.map(d => d.low);
          const closeValues = data.map(d => d.close);

          const dataSeries = new XyDataSeries(wasmContext, {
            xValues,
            openValues,
            highValues,
            lowValues,
            closeValues,
          });

          const candlestickSeries = new FastCandlestickRenderableSeries(wasmContext, {
            dataSeries,
            strokeThickness: 1,
            dataPointWidth: 0.7,
            // upStroke: appTheme.VividGreen,
            // upFill: appTheme.VividGreen,
            // downStroke: appTheme.MutedRed,
            // downFill: appTheme.MutedRed,
          });

          sciChartSurface.renderableSeries.add(candlestickSeries);
        })
        .catch(error => {
          console.error(error);
        });

      // Dispose of SciChartSurface when the component is unmounted
      //return () => initSciChart();

  return (
    <div id="scichart-root" style={{ width: '100%', height: '350px' }}></div>
  );
}

export default Test