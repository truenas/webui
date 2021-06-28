import 'jest-canvas-mock';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
/* import { Subject } from 'rxjs';
import { CoreService } from 'app/core/services/core.service';
import { CoreEvent } from 'app/interfaces/events';
import { WebSocketService } from 'app/services/ws.service';
import { DiskStateService } from './disk-state.service'; */
import { ViewChartAreaComponent, ChartData } from './viewchartarea.component';

describe('ViewChartAreaComponent', () => {
  let spectator: Spectator<ViewChartAreaComponent>;

  const createComponent = createComponentFactory(ViewChartAreaComponent);

  // let dataStream: ReturnType<typeof setInterval>;
  // let latestData: any;

  const generateColumns = (dataSources: number, dataPoints: number): any[] => {
    const output = [];

    for (let i = 0; i < dataPoints; i++) {
      const row = [];

      for (let x = 0; x < dataSources; x++) {
        const dataPoint = 1;
        row.push(dataPoint);
      }

      output.push(row);
    }

    return output;
  };

  const generateRows = (dataSources: number, dataPoints: number): any[] => {
    const output = [];

    for (let i = 0; i < dataPoints; i++) {
      const row = [];

      for (let x = 0; x < dataSources; x++) {
        const dataPoint = Math.floor(Math.random() * 100);
        row.push(dataPoint);
      }

      output.push(row);
    }

    return output;
  };

  const generateData = (dataSources: number, dataPoints: number, structure: string): ChartData => {
    const data = structure == 'columns' ? generateColumns(dataSources, dataPoints) : generateRows(dataSources, dataPoints);

    return {
      structure,
      data,
    };
  };

  /*
   * Test Methods
   * */

  beforeEach(() => {
    spectator = createComponent();
  });

  afterEach(() => {
    // if(dataStream) clearInterval(dataStream);
  });

  it('should instantiate', () => {
    expect(spectator).toBeTruthy();
  });

  it('should not handle more than 8 data points', () => {
    expect(spectator.component.maxSources).toBe(8);
  });

  it('should render chart when data arrives', () => {
    spectator.setInput('chartData', generateData(2, 24, 'rows'));

    spectator.component.render(spectator.component.chartData);

    expect(spectator.component.chart).toBeTruthy();
  });
});
