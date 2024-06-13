import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuUsageRecentComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-recent/widget-cpu-usage-recent.component';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('WidgetCpuUsageRecentComponent', () => {
  let spectator: Spectator<WidgetCpuUsageRecentComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuUsageRecentComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
      mockProvider(
        WidgetResourcesService,
        {
          cpuUpdate: jest.fn(() => of([
            {
              name: 'cpu',
              data: [
                [1714583020, 80.1, 12.2],
                [1714586020, 50.3, 15.9],
                [1714589020, 55.2, 16.8],
              ],
              legend: ['time', 'user', 'system'],
              start: 1714583020,
              end: 1714589020,
            },
          ])),
        },
      ),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              model: 'Intel(R) Xeon(R) Silver 4210R CPU',
              cores: 4,
              physical_cores: 2,
            },
          },
        ],
      }),
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
  });

  it('shows title', () => {
    expect(spectator.query('h3')).toHaveText('CPU Recent Usage');
  });

  it('shows a chart with cpu usage', () => {
    const chart = spectator.query(BaseChartDirective);
    expect(chart).not.toBeNull();
    expect(chart.type).toBe('line');

    const data = chart.data as ChartData<'line'>;
    expect(data).toMatchObject({
      datasets: [
        {
          label: 'User',
          data: [
            { x: 1714583020000, y: 80.1 },
            { x: 1714586020000, y: 50.3 },
            { x: 1714589020000, y: 55.2 },
          ],
          pointBackgroundColor: 'blue',
        },
        {
          label: 'System',
          data: [
            { x: 1714583020000, y: 12.2 },
            { x: 1714586020000, y: 15.9 },
            { x: 1714589020000, y: 16.8 },
          ],
          pointBackgroundColor: 'orange',
        },
      ],
    });
  });
});
