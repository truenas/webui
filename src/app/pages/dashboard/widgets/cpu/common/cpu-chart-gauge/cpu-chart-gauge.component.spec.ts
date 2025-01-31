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
                cpu0: { usage: 6, temp: null },
                cpu1: { usage: 30, temp: null },
                cpu2: { usage: 70, temp: null },
                cpu3: { usage: 9, temp: null },
                cpu: { usage: 75, temp: null },
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
