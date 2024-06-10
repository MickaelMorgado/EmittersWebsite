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

  useEffect(() => {
    const initSciChart = async () => {
      // Enable resampling for better performance
      SciChartDefaults.enableResampling = true;

      // Tell SciChart where to get webassembly files from
      SciChartSurface.useWasmFromCDN();
      SciChartSurface.UseCommunityLicense();
      
      // Initialize SciChartSurface
      const { sciChartSurface, wasmContext } = await SciChartSurface.create('scichart-root', {
        theme: new SciChartJsNavyTheme(),
        title: 'SciChart.js First Chart',
        titleStyle: { fontSize: 22 }
      });

      sciChartSurfaceRef.current = sciChartSurface;

      // Create XAxis and YAxis
      const growBy = new NumberRange(0.1, 0.1);
      sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { axisTitle: 'X Axis', growBy }));
      sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { axisTitle: 'Y Axis', growBy }));

      // Create a line series with some initial data
      const lineSeries = new FastLineRenderableSeries(wasmContext, {
        stroke: 'steelblue',
        strokeThickness: 3,
        dataSeries: new XyDataSeries(wasmContext, {
          xValues: [0, 1, 2, 3, 4, 5, 6, 7, 8],
          yValues: [0, 0.0998, 0.1986, 0.2955, 0.3894, 0.4794, 0.5646, 0.6442, 0.7173]
        }),
        pointMarker: new EllipsePointMarker(wasmContext, { width: 11, height: 11, fill: '#fff' }),
        animation: new SweepAnimation({ duration: 300, fadeEffect: true })
      });

      sciChartSurface.renderableSeries.add(lineSeries);

      // Add interaction modifiers
      sciChartSurface.chartModifiers.add(
        new MouseWheelZoomModifier(),
        new ZoomPanModifier(),
        new ZoomExtentsModifier()
      );
    };

    initSciChart();

    // Cleanup
    return () => {
      if (sciChartSurfaceRef.current) {
        sciChartSurfaceRef.current.delete();
      }
    };
  }, []);

  return <div id="scichart-root" style={{ width: '100%', height: '500px' }} />;
};

export default Test;
