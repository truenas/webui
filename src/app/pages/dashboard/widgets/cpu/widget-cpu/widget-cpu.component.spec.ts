import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ChartData } from 'chart.js';
import { MockComponent, MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.component';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('WidgetCpuComponent', () => {
  let spectator: Spectator<WidgetCpuComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockDirective(BaseChartDirective),
      MockComponent(ViewChartGaugeComponent),
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
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
    });
  });

  it('shows cpu model', () => {
    expect(spectator.query('.cpu-model')).toHaveText('Intel(R) Xeon(R) Silver 4210R CPU');
  });

  it('shows cpu stats for the system', () => {
    const stats = spectator.queryAll('.cpu-data mat-list-item');
    expect(stats).toHaveLength(3);
    expect(stats[0]).toHaveText('Cores: 2 cores');
    expect(stats[1]).toHaveText('Highest Usage: 70% (Thread #2)');
    expect(stats[2]).toHaveText('Hottest: 83°C (2 cores at 83°C)');
  });

  it('shows a chart with cpu stats', () => {
    const chart = spectator.query(BaseChartDirective);
    expect(chart).not.toBeNull();
    expect(chart.type).toBe('bar');

    const data = chart.data as ChartData<'bar'>;
    expect(data).toMatchObject({
      labels: ['1', '2', '3', '4'],
      datasets: [
        { data: [6, 30, 70, 9] },
        { data: [31, 31, 83, 83] },
      ],
    });
  });

  it('shows a chart with cpu average usage', () => {
    const chart = spectator.query(ViewChartGaugeComponent);
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
