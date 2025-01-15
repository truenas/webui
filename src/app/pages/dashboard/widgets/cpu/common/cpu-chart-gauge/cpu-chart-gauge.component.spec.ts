import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { ViewChartGaugeComponent } from 'app/modules/charts/view-chart-gauge/view-chart-gauge.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';

describe('CpuChartGaugeComponent', () => {
  let spectator: Spectator<CpuChartGaugeComponent>;
  const createComponent = createComponentFactory({
    component: CpuChartGaugeComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponent(ViewChartGaugeComponent),
    ],
    providers: [
      mockProvider(
        WidgetResourcesService,
        {
          realtimeUpdates$: of({
            fields: {
              cpu: {
                core0_usage: { usage: 6 },
                core1_usage: { usage: 30 },
                core2_usage: { usage: 70 },
                core3_usage: { usage: 9 },
                aggregated_usage: 75,
              },
            },
          }),
        },
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a chart with cpu average usage', () => {
    const chart = spectator.query(ViewChartGaugeComponent)!;
    expect(chart).not.toBeNull();
    expect(chart.config).toEqual({
      data: ['Load', 75],
      diameter: 136,
      fontSize: 28,
      label: false,
      max: 100,
      subtitle: 'Avg Usage',
      units: '%',
    });
  });
});
