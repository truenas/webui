import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { dygraphs } from 'dygraphs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { PlotterService } from 'app/pages/reports-dashboard/services/plotter.service';

const fakeLegend = {
  series: [],
} as dygraphs.LegendData;

describe('LineChartComponent', () => {
  let spectator: Spectator<LineChartComponent>;

  const createComponent = createComponentFactory({
    component: LineChartComponent,
    providers: [
      mockWebSocket(),
      mockProvider(ReportsService, {
        emitLegendEvent: jest.fn(),
      }),
      mockProvider(PlotterService, {
        getSmoothPlotter: () => {},
      }),
      provideMockStore(),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        chartId: 'chart-uuid-report',
      },
    });
  });

  it('sets legend formatter', () => {
    spectator.component.legendFormatter(fakeLegend);
    expect(spectator.inject(ReportsService).emitLegendEvent).toHaveBeenCalledWith({
      ...fakeLegend,
      chartId: 'chart-uuid-report',
    });
  });
});
