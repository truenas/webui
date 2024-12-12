import 'jest-canvas-mock';
import { fakeAsync } from '@angular/core/testing';
import {
  createComponentFactory, Spectator,
} from '@ngneat/spectator/jest';
import {
  CategoryScale, Chart, ChartData,
  ChartDataset, LinearScale, LineController,
  LineElement,
  PointElement,
} from 'chart.js';
import { ViewChartAreaComponent } from 'app/modules/charts/view-chart-area/view-chart-area.component';

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
    Chart.register(LineController, CategoryScale, LinearScale, PointElement, LineElement);
  });

  /*
   * Test Methods
   * */

  it('should handle more than 8 data points and show maximum sources', fakeAsync(() => {
    const data = generateChartData(10, 2);
    expect(spectator.component.maxSources).toBe(8);

    spectator.setInput('data', data);
    spectator.setInput('options', { });
    expect(spectator.component.data().datasets).toHaveLength(8);
  }));

  it('should render chart when data arrives', () => {
    const data = { labels: [], datasets: [] } as ChartData<'line'>;
    spectator.setInput('data', data);

    // Make sure expected values are present after input is set
    expect(spectator.component.data()).toEqual({ datasets: [], labels: [] });
    expect(spectator.component.canvas().nativeElement).toBeTruthy();
    expect(spectator.component.chart).toBeTruthy();
    expect(spectator.component.chart.data).toMatchObject(data);
  });
});
