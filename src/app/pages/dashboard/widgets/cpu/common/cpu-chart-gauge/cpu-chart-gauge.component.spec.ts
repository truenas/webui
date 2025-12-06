import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { ViewChartGaugeComponent } from 'app/modules/charts/view-chart-gauge/view-chart-gauge.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';

describe('CpuChartGaugeComponent', () => {
  let spectator: Spectator<CpuChartGaugeComponent>;
  const cpuData = {
    user: 0,
    nice: 0,
    system: 0,
    idle: 0,
    iowait: 0,
    irq: 0,
    softirq: 0,
    steal: 0,
    guest: 0,
    guest_nice: 0,
    cpu0: { usage: 6, temp: 0 },
    cpu1: { usage: 30, temp: 0 },
    cpu2: { usage: 70, temp: 0 },
    cpu3: { usage: 9, temp: 0 },
    cpu: { usage: 75, temp: 0 },
  } as AllCpusUpdate;

  const createComponent = createComponentFactory({
    component: CpuChartGaugeComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponent(ViewChartGaugeComponent),
    ],
  });

  it('shows a chart with cpu average usage', () => {
    spectator = createComponent({
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            cpuUpdatesWithStaleDetection: () => of({
              value: cpuData,
              isStale: false,
            }),
          },
        ),
      ],
    });

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

  it('shows stale data notice when data is stale', () => {
    spectator = createComponent({
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            cpuUpdatesWithStaleDetection: () => of({
              value: null,
              isStale: true,
            }),
          },
        ),
      ],
    });

    expect(spectator.query('ix-widget-stale-data-notice')).toExist();
    expect(spectator.query(ViewChartGaugeComponent)).not.toExist();
  });

  it('shows loading skeleton when data is not available and not stale', () => {
    spectator = createComponent({
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            cpuUpdatesWithStaleDetection: () => of({
              value: null,
              isStale: false,
            }),
          },
        ),
      ],
    });

    expect(spectator.query('ngx-skeleton-loader')).toExist();
    expect(spectator.query('ix-widget-stale-data-notice')).not.toExist();
    expect(spectator.query(ViewChartGaugeComponent)).not.toExist();
  });
});
