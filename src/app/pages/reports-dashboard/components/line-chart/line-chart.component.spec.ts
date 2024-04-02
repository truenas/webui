import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { dygraphs } from 'dygraphs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { PlotterService } from 'app/pages/reports-dashboard/services/plotter.service';
import { ThemeService } from 'app/services/theme/theme.service';

const fakeLegend = {
  series: [],
} as dygraphs.LegendData;

describe('LineChartComponent', () => {
  let spectator: Spectator<LineChartComponent>;

  const createComponent = createComponentFactory({
    component: LineChartComponent,
    providers: [
      mockWebsocket(),
      mockProvider(ReportsService, {
        emitLegendEvent: jest.fn(),
      }),
      mockProvider(PlotterService, {
        getSmoothPlotter: () => {},
      }),
      mockProvider(ThemeService),
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

  describe('axisLabelFormatter', () => {
    it('returns default formatted value', () => {
      expect(spectator.component.axisLabelFormatter(500000).trim()).toBe('500 k');
    });

    it('returns formatted value when labelY is set', () => {
      spectator.component.labelY = 'Mebibytes';
      expect(spectator.component.axisLabelFormatter(500).trim()).toBe('500');
    });

    it('returns formatted value when report name is NetworkInterface and less than 1000', () => {
      spectator.component.report = { name: ReportingGraphName.NetworkInterface } as Report;
      spectator.component.yLabelPrefix = 'Mb';
      expect(spectator.component.axisLabelFormatter(500).trim()).toBe('0.5');
    });

    it('returns formatted value when report name is NetworkInterface and greater than 100', () => {
      spectator.component.report = { name: ReportingGraphName.NetworkInterface } as Report;
      spectator.component.yLabelPrefix = 'Kb';
      expect(spectator.component.axisLabelFormatter(1500).trim()).toBe('1.5');
    });
  });
});
