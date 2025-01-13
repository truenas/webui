import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { ThemeService } from 'app/modules/theme/theme.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';

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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a chart with cpu stats', () => {
    const chart = spectator.query(BaseChartDirective)!;
    expect(chart).not.toBeNull();
    expect(chart.type).toBe('bar');

    const data = chart.data as ChartData<'bar'>;
    expect(data).toMatchObject({
      labels: ['1', '2', '3', '4'],
      datasets: [
        { data: [6, 30, 70, 9] },
        { data: [31, 83, 0, 0] },
      ],
    });
  });
});
