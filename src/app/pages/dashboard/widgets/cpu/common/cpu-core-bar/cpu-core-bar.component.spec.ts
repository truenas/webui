import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('CpuCoreBarComponent', () => {
  let spectator: Spectator<CpuCoreBarComponent>;
  const createComponent = createComponentFactory({
    component: CpuCoreBarComponent,
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
          realtimeUpdates$: of({
            fields: {
              cpu: {
                0: { usage: 6 },
                1: { usage: 30 },
                2: { usage: 70 },
                3: { usage: 9 },
                average: { usage: 75 },
                temperature_celsius: [31, 83],
              },
            },
          }),
        },
      ),
      mockProvider(ThemeService, {
        getRgbBackgroundColorByIndex: () => [0, 0, 0],
      }),
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a chart with cpu stats', () => {
    const chart = spectator.query(BaseChartDirective);
    expect(chart).not.toBeNull();
    expect(chart.type).toBe('bar');

    const data = chart.data as ChartData<'bar'>;
    expect(data).toMatchObject({
      labels: ['1', '2'],
      datasets: [
        { data: [36, 79] },
        { data: [31, 83] },
      ],
    });
  });
});
