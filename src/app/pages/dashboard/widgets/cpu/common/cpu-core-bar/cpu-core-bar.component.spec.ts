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
                cpu0: { usage: 6, temp: 31 },
                cpu1: { usage: 30, temp: 43 },
                cpu2: { usage: 70, temp: 40 },
                cpu3: { usage: 9, temp: 39 },
                cpu: { usage: 75, temp: 43 },
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
        { data: [31, 43, 40, 39] },
      ],
    });
  });
});
