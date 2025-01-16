import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LocaleService } from 'app/modules/language/locale.service';
import { ThemeService } from 'app/modules/theme/theme.service';
import { InstanceMetricsLineChartComponent } from './instance-metrics-linechart.component';

describe('InstanceMetricsLineChartComponent', () => {
  let spectator: Spectator<InstanceMetricsLineChartComponent>;
  const startDate = new Date('2024-07-23').getTime();

  const createComponent = createComponentFactory({
    component: InstanceMetricsLineChartComponent,
    imports: [NgxSkeletonLoaderModule],
    declarations: [MockDirective(BaseChartDirective)],
    providers: [
      mockProvider(ThemeService, {
        currentTheme: jest.fn(() => ({
          blue: 'blue',
        })),
      }),
      mockProvider(LocaleService, {
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'HH:mm:ss',
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        title: 'Test Metrics',
        data: [10, 20, 30],
        labels: [startDate, startDate + 1000, startDate + 2000],
        isLoading: false,
      },
    });
    const dateNowStub = jest.fn(() => startDate);
    global.Date.now = dateNowStub;
  });

  it('shows title', () => {
    expect(spectator.query('h4')).toHaveText('Test Metrics');
  });

  it('shows skeleton loader when loading', () => {
    spectator.setInput('isLoading', true);
    expect(spectator.query('ngx-skeleton-loader')).toBeTruthy();
    expect(spectator.query('canvas')).toBeNull();
  });

  it('renders chart when not loading', () => {
    spectator.setInput('isLoading', false);
    expect(spectator.query('ngx-skeleton-loader')).toBeNull();
    const chart = spectator.query(BaseChartDirective);
    expect(chart).not.toBeNull();
  });

  it('configures chart data correctly', () => {
    const chart = spectator.query(BaseChartDirective)!;
    const data = chart.data as ChartData<'line'>;

    expect(data).toMatchObject({
      datasets: [
        {
          label: 'Test Metrics',
          data: [
            { x: startDate, y: 10 },
            { x: startDate + 1000, y: 20 },
            { x: startDate + 2000, y: 30 },
          ],
          pointBackgroundColor: 'blue',
        },
      ],
    });
  });

  it('uses correct chart options', () => {
    const chart = spectator.query(BaseChartDirective)!;
    const options = chart.options;

    expect(options).toMatchObject({
      interaction: {
        intersect: false,
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: expect.any(Function),
          },
        },
      },
      animation: {
        duration: 0,
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second',
            displayFormats: {
              second: 'HH:mm:ss',
            },
          },
          ticks: {
            maxTicksLimit: 3,
            maxRotation: 0,
          },
        },
        y: {
          type: 'linear',
          beginAtZero: true,
        },
      },
    });
  });
});
