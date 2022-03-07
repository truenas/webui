import 'jest-canvas-mock';
import {
  createComponentFactory, Spectator,
} from '@ngneat/spectator/jest';
import { ChartData, ChartDataSets } from 'chart.js';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';

describe('ViewChartAreaComponent', () => {
  /*
  * Component Setup
  * */

  let spectator: Spectator<ViewChartAreaComponent>;

  const createComponent = createComponentFactory({
    component: ViewChartAreaComponent,
    detectChanges: false,
  });

  /*
  * Generate Mock Data
  * */

  const generateDatasets = (dataSources: number, dataPoints: number): ChartDataSets[] => {
    const datasets = [];

    for (let i = 0; i < dataSources; i++) {
      const data = [];

      for (let x = 0; x < dataPoints; x++) {
        const dataPoint = Math.floor(Math.random() * 100);
        data.push(dataPoint);
      }
      const dataset = {
        label: 'Item ' + i.toString(),
        data,
      };

      datasets.push(dataset);
    }

    return datasets;
  };

  const generateChartData = (dataSources: number, dataPoints: number): ChartData => {
    const datasets = generateDatasets(dataSources, dataPoints);
    const data: ChartData = {
      labels: [],
      datasets,
    };

    return data;
  };

  /*
   * Test Setup
   * */

  beforeEach(() => {
    spectator = createComponent();
  });

  /*
   * Test Methods
   * */

  it('should not handle more than 8 data points', () => {
    const data: ChartData = generateChartData(9, 2);
    expect(spectator.component.maxSources).toBe(8);
    expect(() => spectator.setInput('data', data)).toThrow();
  });

  it('should render chart when data arrives', () => {
    const data: ChartData = { labels: [], datasets: [] };
    spectator.setInput('data', data);

    // Manually trigger change detection
    spectator.component.ngOnChanges({
      data: {
        currentValue: data,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    // Make sure expected values are present after input is set
    expect(spectator.component.data).toBeTruthy();
    expect(spectator.component.canvas).toBeTruthy();
    expect(spectator.component.chart).toBeTruthy();
    expect(spectator.component.chart.data).toMatchObject(data);
  });
});
