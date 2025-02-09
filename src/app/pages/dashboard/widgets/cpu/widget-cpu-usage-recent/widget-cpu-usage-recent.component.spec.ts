import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { LocaleService } from 'app/modules/language/locale.service';
import { ThemeService } from 'app/modules/theme/theme.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuUsageRecentComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-recent/widget-cpu-usage-recent.component';

describe('WidgetCpuUsageRecentComponent', () => {
  let spectator: Spectator<WidgetCpuUsageRecentComponent>;
  const startDate = new Date('2024-07-23'); // 1721692740000

  const createComponent = createComponentFactory({
    component: WidgetCpuUsageRecentComponent,
    imports: [NgxSkeletonLoaderModule],
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
      mockProvider(
        WidgetResourcesService,
        {
          cpuLastMinuteStats: jest.fn(() => of([
            {
              name: 'cpu',
              data: [
                [0, 80.1, 12.2],
                [0, 50.3, 15.9],
                [0, 55.2, 16.8],
              ],
              legend: ['time', 'usage'],
              start: 0,
              end: 0,
            },
          ])),
          realtimeUpdates$: of({
            fields: {
              cpu: {
                cpu: {
                  usage: 10,
                  temp: 20,
                },
              },
            },
          }),
        },
      ),
      mockProvider(ThemeService, {
        currentTheme: jest.fn(() => ({
          blue: 'blue',
          orange: 'orange',
        })),
      }),
      mockProvider(LocaleService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Half,
      },
    });
    const dateNowStub = jest.fn(() => startDate.getTime());
    global.Date.now = dateNowStub;
  });

  it('shows title', () => {
    expect(spectator.query('h3')).toHaveText('CPU Recent Usage');
  });

  it('shows a chart with cpu usage', () => {
    const chart = spectator.query(BaseChartDirective)!;
    expect(chart).not.toBeNull();
    expect(chart.type).toBe('line');

    const data = chart.data as ChartData<'line'>;
    expect(data).toMatchObject({
      datasets: [
        {
          label: 'Usage',
          data: [
            { x: 1721692740000, y: 80.1 },
            { x: 1721692741000, y: 50.3 },
            { x: 1721692742000, y: 55.2 },
          ],
          pointBackgroundColor: 'blue',
        },
      ],
    });
  });
});
