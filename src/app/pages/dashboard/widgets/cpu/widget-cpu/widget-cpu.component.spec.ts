import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { WidgetCpuComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.component';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('WidgetCpuComponent', () => {
  let spectator: Spectator<WidgetCpuComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponent(CpuChartGaugeComponent),
      MockComponent(CpuCoreBarComponent),
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
    expect(stats).toHaveLength(4);
    expect(stats[0]).toHaveText('Cores: 2 cores');
    expect(stats[1]).toHaveText('Threads: 4 threads');
    expect(stats[2]).toHaveText('Highest Usage: 70% (Thread #3)');
    expect(stats[3]).toHaveText('Hottest: 83°C (Core #2)');
  });
});
