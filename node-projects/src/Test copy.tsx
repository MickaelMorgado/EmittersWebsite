import { useEffect, useRef } from 'react';
import {
  EllipsePointMarker,
  FastLineRenderableSeries,
  MouseWheelZoomModifier,
  NumberRange,
  NumericAxis,
  SciChartDefaults,
  SciChartJsNavyTheme,
  SciChartSurface,
  SweepAnimation,
  XyDataSeries,
  ZoomExtentsModifier,
  ZoomPanModifier
} from 'scichart';

const Test = () => {
  const sciChartSurfaceRef = useRef<SciChartSurface | null>(null);

  SciChartDefaults.enableResampling = false;
  SciChartDefaults.performanceWarnings = false;
  
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

  const structuringData = (dataResponse: any, dataConversionEnum: DataConversionEnum): IPriceData[] => {
    switch (dataConversionEnum) {
      case DataConversionEnum.Binance:
        return dataResponse.map((item: any) => ({
          time: item[0],
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

  useEffect(() => {
    const initSciChart = async () => {
      SciChartSurface.useWasmFromCDN();
      SciChartSurface.UseCommunityLicense();

      const { sciChartSurface, wasmContext } = await SciChartSurface.create('scichart-root', {
        theme: new SciChartJsNavyTheme(),
        title: "SciChart.js OHLC Chart",
        titleStyle: { fontSize: 22 }
      });

      sciChartSurfaceRef.current = sciChartSurface;

      const growBy = new NumberRange(0.1, 0.1);
      sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { axisTitle: "Time", growBy }));
      sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { axisTitle: "Price", growBy }));

      /*
      axios.get(url)
        .then(response => {
          const structuredData = structuringData(response.data, DataConversionEnum.Binance);

          const xValues = structuredData.map(d => d.time);
          const openValues = structuredData.map(d => d.open);
          const highValues = structuredData.map(d => d.high);
          const lowValues = structuredData.map(d => d.low);
          const closeValues = structuredData.map(d => d.close);

          if (xValues.length && openValues.length) {
            const dataSeries = new OhlcDataSeries(wasmContext, {
              xValues,
              openValues,
              highValues,
              lowValues,
              closeValues,
            });

            const ohlcSeries = new FastOhlcRenderableSeries(wasmContext, {
              dataSeries,
              strokeThickness: 1,
              dataPointWidth: 0.7,
            });

            // Create a static line data series
            const lineDataSeries = new XyDataSeries(wasmContext, {
              xValues: [0,1,2,3,4,5,6,7,8,9],
              yValues: [0, 0.0998, 0.1986, 0.2955, 0.3894, 0.4794, 0.5646, 0.6442, 0.7173, 0.7833],
            });

            // Create and add the static line series
            const lineSeries = new FastLineRenderableSeries(wasmContext, {
              stroke: "steelblue",
              strokeThickness: 3,
              dataSeries: lineDataSeries,
              pointMarker: new EllipsePointMarker(wasmContext, { width: 11, height: 11, fill: "#fff" }),
              animation: new SweepAnimation({ duration: 300, fadeEffect: true })
            });

            sciChartSurface.renderableSeries.add(ohlcSeries);
            sciChartSurface.renderableSeries.add(lineSeries);
          } else {
            console.error("Data series arrays are empty!");
          }
        })
        .catch(error => {
          console.error('Error fetching or processing data:', error);
        });
      */

      // Create a line series with some initial data
      sciChartSurface.renderableSeries.add(new FastLineRenderableSeries(wasmContext, {
        stroke: "steelblue",
        strokeThickness: 3,
        dataSeries: new XyDataSeries(wasmContext, {
          xValues: [0,1,2,3,4,5,6,7,8,9],
          yValues: [0, 0.0998, 0.1986, 0.2955, 0.3894, 0.4794, 0.5646, 0.6442, 0.7173, 0.7833]
        }),
        pointMarker: new EllipsePointMarker(wasmContext, { width: 11, height: 11, fill: "#fff" }),
        animation: new SweepAnimation({ duration: 300, fadeEffect: true })
      }));

      // Add some interaction modifiers to show zooming and panning
      sciChartSurface.chartModifiers.add(new MouseWheelZoomModifier(), new ZoomPanModifier(), new ZoomExtentsModifier());
    };

    initSciChart();

    /*return () => {
      if (sciChartSurfaceRef.current) {
        console.log('delete');
        //sciChartSurfaceRef.current.delete();
      }
    };*/
  }, []);

  return (
    <div id="scichart-root" style={{ width: '100%', height: '500px' }}></div>
  );
}

export default Test;
