import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { format } from 'date-fns';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { Preferences } from 'app/interfaces/preferences.interface';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportComponent } from 'app/pages/reports-dashboard/components/report/report.component';
import { LegendDataWithStackedTotalHtml, Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { selectPreferences, selectTheme } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

const fakeLegendData = {
  chartId: 'chart-uuid-selected-report',
  x: Date.now(),
} as LegendDataWithStackedTotalHtml;

const mockReportingData: ReportingData = {
  name: 'cpu',
  legend: ['user', 'system', 'idle'],
  data: [
    [Date.now() / 1000 - 3600, 10, 5, 85],
    [Date.now() / 1000 - 1800, 15, 8, 77],
    [Date.now() / 1000, 12, 6, 82],
  ],
} as ReportingData;

const mockThemeColors = ['#ff0000', '#00ff00', '#0000ff'];

describe('ReportComponent', () => {
  let spectator: Spectator<ReportComponent>;
  let mockLineChart: jest.Mocked<LineChartComponent>;

  const createComponent = createComponentFactory({
    component: ReportComponent,
    providers: [
      mockProvider(FormatDateTimePipe, {
        transform: jest.fn((date) => {
          return format(typeof date === 'string' ? Date.parse(date) : date as number | Date, 'yyyy-MM-dd HH:mm:ss');
        }),
      }),
      mockProvider(ReportsService, {
        legendEventEmitterObs$: of(fakeLegendData),
        getNetData: jest.fn(() => of(mockReportingData)),
      }),
      mockProvider(ThemeService, {
        getColorPattern: jest.fn(() => mockThemeColors),
        currentTheme: jest.fn(() => ({ fg2: '#ffffff' })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              autoRefreshReports: false,
            } as Preferences,
          },
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
          {
            selector: selectTheme,
            value: 'ix-dark',
          },
        ],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    mockLineChart = {
      chart: { resize: jest.fn(), destroy: jest.fn() },
      render: jest.fn(),
      resize: jest.fn(),
    } as unknown as jest.Mocked<LineChartComponent>;
  });

  it('shows legend values only for the target report', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(require('uuid'), 'v4').mockReturnValue('uuid-selected-report');
    spectator = createComponent({
      props: {
        report: {
          name: 'cpu',
          title: 'CPU Usage',
          vertical_label: '%',
        } as Report,
      },
    });
    expect(spectator.component.shouldShowLegendValue).toBeTruthy();
  });

  it('hides legend values for other reports', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(require('uuid'), 'v4').mockReturnValue('uuid-another-report');
    spectator = createComponent({
      props: {
        report: {
          name: 'cpu',
          title: 'CPU Usage',
          vertical_label: '%',
        } as Report,
      },
    });
    expect(spectator.component.shouldShowLegendValue).toBeFalsy();
  });

  describe('resize functionality', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          report: {
            name: 'cpu',
            title: 'CPU Usage',
            vertical_label: '%',
          } as Report,
        },
      });
      // Mock the line chart component
      Object.defineProperty(spectator.component, 'lineChart', {
        value: jest.fn(() => mockLineChart),
        configurable: true,
      });
    });

    it('should initialize viewport change detection on init', () => {
      // Simply verify that ngOnInit completes without errors
      expect(() => {
        spectator.component.ngOnInit();
      }).not.toThrow();
    });

    it('should resize chart when window resize event occurs', async () => {
      spectator.component.ngOnInit();
      spectator.component.isReady = true;

      // Trigger window resize event
      const resizeEvent = new Event('resize');
      global.dispatchEvent(resizeEvent);

      // Wait for debounce
      await new Promise<void>((resolve): void => {
        setTimeout(() => resolve(), 150);
      });

      expect(mockLineChart.render).toHaveBeenCalledWith(true);
    });

    it('should not resize chart before component is ready', async () => {
      spectator.component.ngOnInit();
      spectator.component.isReady = false;

      // Trigger window resize event
      const resizeEvent = new Event('resize');
      global.dispatchEvent(resizeEvent);

      // Wait for debounce
      await new Promise<void>((resolve): void => {
        setTimeout(() => resolve(), 150);
      });

      expect(mockLineChart.render).not.toHaveBeenCalled();
    });

    it('should resize chart when menu state changes', () => {
      jest.useFakeTimers();

      // Mock the line chart first
      Object.defineProperty(spectator.component, 'lineChart', {
        value: jest.fn(() => mockLineChart),
        configurable: true,
      });
      spectator.component.ngOnInit();

      // Trigger resize manually - need to use setTimeout like the actual code
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (spectator.component as any).resizeChart();

      // Fast-forward timers to trigger the setTimeout in resizeChart
      jest.runAllTimers();

      expect(mockLineChart.render).toHaveBeenCalledWith(true);

      jest.useRealTimers();
    });

    it('should handle resize when line chart is not available', () => {
      Object.defineProperty(spectator.component, 'lineChart', {
        value: jest.fn((): null => null),
        configurable: true,
      });

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (spectator.component as any).resizeChart();
      }).not.toThrow();
    });

    it('should unsubscribe from resize events on destroy', () => {
      spectator.component.ngOnInit();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = (spectator.component as any).resizeSubscription;

      jest.spyOn(subscription, 'unsubscribe');
      spectator.component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('zoom functionality', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          report: {
            name: 'cpu',
            title: 'CPU Usage',
            vertical_label: '%',
          } as Report,
        },
      });
    });

    it('should zoom in when timeZoomIn is called', () => {
      spectator.component.ngOnInit();
      // Set zoom level to allow zooming in (not at max)
      spectator.component.zoomLevelIndex = 3;
      const initialZoomIndex = spectator.component.zoomLevelIndex;

      spectator.component.timeZoomIn();

      expect(spectator.component.zoomLevelIndex).toBe(initialZoomIndex + 1);
      expect(spectator.component.customZoom).toBe(false);
    });

    it('should zoom out when timeZoomOut is called', () => {
      spectator.component.ngOnInit();
      spectator.component.zoomLevelIndex = 2; // Set to a level that allows zooming out

      spectator.component.timeZoomOut();

      expect(spectator.component.zoomLevelIndex).toBe(1);
      expect(spectator.component.customZoom).toBe(false);
    });

    it('should reset zoom to maximum level when timeZoomReset is called', () => {
      spectator.component.ngOnInit();
      spectator.component.zoomLevelIndex = 1;
      spectator.component.customZoom = true;

      spectator.component.timeZoomReset();

      expect(spectator.component.zoomLevelIndex).toBe(spectator.component.zoomLevelMax);
      expect(spectator.component.customZoom).toBe(false);
    });

    it('should not zoom in beyond maximum level', () => {
      spectator.component.ngOnInit();
      spectator.component.zoomLevelIndex = spectator.component.zoomLevelMax;
      const initialIndex = spectator.component.zoomLevelIndex;

      spectator.component.timeZoomIn();

      expect(spectator.component.zoomLevelIndex).toBe(initialIndex);
    });

    it('should not zoom out beyond minimum level', () => {
      spectator.component.ngOnInit();
      spectator.component.zoomLevelIndex = 0;

      spectator.component.timeZoomOut();

      expect(spectator.component.zoomLevelIndex).toBe(0);
    });

    it('should handle custom zoom range changes', () => {
      spectator.component.ngOnInit();
      const startDate = Date.now() - 3600000;
      const endDate = Date.now();

      spectator.component.onZoomChange([startDate, endDate]);

      expect(spectator.component.currentStartDate).toBe(startDate);
      expect(spectator.component.currentEndDate).toBe(endDate);
      expect(spectator.component.customZoom).toBe(true);
    });
  });

  describe('chart data and rendering', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          report: {
            name: 'cpu',
            title: 'CPU Usage',
            vertical_label: '%',
          } as Report,
        },
      });
    });

    it('should determine if chart should be stacked', () => {
      spectator.component.data = { name: ReportingGraphName.Cpu } as ReportingData;
      expect(spectator.component.isStacked).toBe(true);

      spectator.component.data = { name: ReportingGraphName.Memory } as ReportingData;
      expect(spectator.component.isStacked).toBe(false);
    });

    it('should determine if total should be shown', () => {
      spectator.component.data = { name: ReportingGraphName.Memory } as ReportingData;
      expect(spectator.component.shouldShowTotal).toBe(true);

      spectator.component.data = { name: ReportingGraphName.Cpu } as ReportingData;
      expect(spectator.component.shouldShowTotal).toBe(false);
    });

    it('should format report title with identifier', () => {
      // Create a simple test without triggering ngOnChanges
      const component = spectator.component;

      // Directly test the reportTitle getter logic
      jest.spyOn(component, 'report').mockReturnValue({
        title: 'Disk {identifier} Usage',
      } as Report);
      jest.spyOn(component, 'identifier').mockReturnValue('sda');

      const result = component.reportTitle;
      expect(result).toBe('Disk sda Usage');
    });

    it('should handle report title without identifier placeholder', () => {
      const component = spectator.component;

      // Directly test the reportTitle getter logic
      jest.spyOn(component, 'report').mockReturnValue({
        title: 'CPU Usage',
      } as Report);
      jest.spyOn(component, 'identifier').mockReturnValue('cpu0');

      const result = component.reportTitle;
      expect(result).toBe('CPU Usage');
    });

    it('should set chart colors from theme service', () => {
      spectator.component.ngOnInit();

      expect(spectator.component.chartColors).toEqual(mockThemeColors);
    });

    it('should update timezone from store', () => {
      spectator.component.ngOnInit();

      expect(spectator.component.timezone).toBe('America/New_York');
    });
  });
});
