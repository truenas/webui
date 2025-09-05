import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import Dygraph, { dygraphs } from 'dygraphs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { ThemeService } from 'app/modules/theme/theme.service';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { PlotterService } from 'app/pages/reports-dashboard/services/plotter.service';

const fakeLegend = {
  series: [] as dygraphs.SeriesLegendData[],
} as dygraphs.LegendData;

const mockReportingData: ReportingData = {
  name: 'cpu',
  legend: ['user', 'system', 'idle'],
  data: [
    [Date.now() / 1000 - 3600, 10, 5, 85],
    [Date.now() / 1000 - 1800, 15, 8, 77],
    [Date.now() / 1000, 12, 6, 82],
  ],
} as ReportingData;

const mockReport: Report = {
  name: 'cpu',
  title: 'CPU Usage',
  vertical_label: '%',
} as Report;

const mockTheme = {
  fg2: '#ffffff',
};

const mockColors = ['#ff0000', '#00ff00', '#0000ff'];

// Mock Dygraph constructor
jest.mock('dygraphs', () => {
  const mockDygraph = jest.fn().mockImplementation(() => ({
    updateOptions: jest.fn(),
    resize: jest.fn(),
    destroy: jest.fn(),
    axes_: [{ maxyval: 100 }],
  }));

  return {
    __esModule: true,
    default: mockDygraph,
    dygraphs: {
      LegendData: {},
      SeriesLegendData: {},
    },
  };
});

describe('LineChartComponent', () => {
  let spectator: Spectator<LineChartComponent>;

  const createComponent = createComponentFactory({
    component: LineChartComponent,
    providers: [
      mockApi(),
      mockProvider(ReportsService, {
        emitLegendEvent: jest.fn(),
      }),
      mockProvider(PlotterService, {
        getSmoothPlotter: jest.fn(() => 'smoothPlotter'),
      }),
      mockProvider(ThemeService, {
        currentTheme: jest.fn(() => mockTheme),
      }),
      provideMockStore(),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        chartId: 'test-chart-id',
        chartColors: mockColors,
        data: mockReportingData,
        report: mockReport,
        timezone: 'America/New_York',
        stacked: false,
        labelY: 'Percentage',
      },
    });
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('sets legend formatter', () => {
    spectator.component.legendFormatter(fakeLegend);
    expect(spectator.inject(ReportsService).emitLegendEvent).toHaveBeenCalledWith({
      ...fakeLegend,
      chartId: 'test-chart-id',
    });
  });

  describe('rendering', () => {
    it('should render chart after view init', () => {
      const renderSpy = jest.spyOn(spectator.component, 'render');
      spectator.component.ngAfterViewInit();

      expect(renderSpy).toHaveBeenCalled();
    });

    it('should not render when no data is available', () => {
      spectator.setInput('data', undefined);

      expect(() => {
        spectator.component.render();
      }).not.toThrow();
    });
  });

  describe('resize functionality', () => {
    it('should resize existing chart', () => {
      const mockChart: Partial<Dygraph> = {
        resize: jest.fn(),
        destroy: jest.fn(),
      };
      spectator.component.chart = mockChart as Dygraph;

      spectator.component.resize();

      expect(mockChart.resize).toHaveBeenCalled();
    });

    it('should handle resize when chart is not available', () => {
      spectator.component.chart = null;

      expect(() => {
        spectator.component.resize();
      }).not.toThrow();
    });
  });

  describe('data processing', () => {
    it('should infer percentage units correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const units = (spectator.component as any).inferUnits('Percentage');
      expect(units).toBe('%');
    });

    it('should infer temperature units correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const units = (spectator.component as any).inferUnits('Temperature (Celsius)');
      expect(units).toBe('°');
    });

    it('should infer bytes units correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const units = (spectator.component as any).inferUnits('Memory Usage (bytes)');
      expect(units).toBe('bytes');
    });

    it('should infer load units correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const units = (spectator.component as any).inferUnits('System Load');
      expect(units).toBe('');
    });

    it('should format axis name for network interface', () => {
      spectator.setInput('report', { ...mockReport, name: ReportingGraphName.NetworkInterface });
      spectator.component.yLabelPrefix = 'Mb';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axisName = (spectator.component as any).formatAxisName();

      expect(axisName).toBe('Mb/s');
    });
  });

  describe('axisLabelFormatter', () => {
    it('returns default formatted value', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Set labelY to a value that will trigger the warning in inferUnits
      spectator.setInput('labelY', 'Unknown Label');

      expect(spectator.component.axisLabelFormatter(500000)).toBe('500k');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('returns formatted value when labelY is set', () => {
      spectator.setInput('labelY', 'Mebibytes');
      expect(spectator.component.axisLabelFormatter(500)).toBe('500');
    });

    it('returns formatted value when report name is NetworkInterface and less than 1000', () => {
      spectator.setInput('report', { name: ReportingGraphName.NetworkInterface } as Report);
      spectator.component.yLabelPrefix = 'Mb';
      expect(spectator.component.axisLabelFormatter(500)).toBe('0.5');
    });

    it('returns formatted value when report name is NetworkInterface and greater than 100', () => {
      spectator.setInput('report', { name: ReportingGraphName.NetworkInterface } as Report);
      spectator.component.yLabelPrefix = 'kb';
      expect(spectator.component.axisLabelFormatter(1500)).toBe('1.5');
    });
  });

  describe('value conversion', () => {
    it('should convert values by kilo correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (spectator.component as any).convertByKilo(1500);

      expect(result.value).toBe(1.5);
      expect(result.suffix).toBe('k');
    });

    it('should convert large values to millions', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (spectator.component as any).convertByKilo(2000000);

      expect(result.value).toBe(2);
      expect(result.suffix).toBe('m');
    });

    it('should not convert small values', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (spectator.component as any).convertByKilo(500);

      expect(result.value).toBe(500);
      expect(result.suffix).toBe('');
    });
  });

  describe('cleanup', () => {
    it('should destroy chart on component destroy', () => {
      const mockChart: Partial<Dygraph> = {
        destroy: jest.fn(),
      };
      spectator.component.chart = mockChart as Dygraph;

      spectator.component.ngOnDestroy();

      expect(mockChart.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when chart is null', () => {
      spectator.component.chart = null;

      expect(() => {
        spectator.component.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
