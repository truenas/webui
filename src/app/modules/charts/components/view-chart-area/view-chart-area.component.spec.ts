import 'jest-canvas-mock';
import {
  createComponentFactory, Spectator,
} from '@ngneat/spectator/jest';
import { ChartData, ChartDataset } from 'chart.js';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';

describe('ViewChartAreaComponent', () => {
  let spectator: Spectator<ViewChartAreaComponent>;

  const createComponent = createComponentFactory({
    component: ViewChartAreaComponent,
    detectChanges: false,
  });

  const generateDatasets = (dataSources: number, dataPoints: number): ChartDataset<'line'>[] => {
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

  const generateChartData = (dataSources: number, dataPoints: number): ChartData<'line'> => {
    const datasets = generateDatasets(dataSources, dataPoints);
    const data: ChartData<'line'> = {
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
    const data = generateChartData(9, 2);
    expect(spectator.component.maxSources).toBe(8);
    expect(() => spectator.setInput('data', data)).toThrow();
  });

  it('should render chart when data arrives', () => {
    const data = { labels: [], datasets: [] } as ChartData<'line'>;
    spectator.setInput('data', data);

    // Manually trigger change detection
    spectator.component.ngOnChanges({
      data: {
        currentValue: data,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    } as IxSimpleChanges<ViewChartAreaComponent>);

    // Make sure expected values are present after input is set
    expect(spectator.component.data).toBeTruthy();
    expect(spectator.component.canvas).toBeTruthy();
    expect(spectator.component.chart).toBeTruthy();
    expect(spectator.component.chart.data).toMatchObject(data);
  });
});
