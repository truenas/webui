import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetMemoryComponent } from 'app/pages/dashboard/widgets/memory/widget-memory/widget-memory.component';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('WidgetMemoryComponent', () => {
  let spectator: Spectator<WidgetMemoryComponent>;
  const createComponent = createComponentFactory({
    component: WidgetMemoryComponent,
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
      mockProvider(
        WidgetResourcesService,
        {
          realtimeUpdates$: of({
            fields: {
              virtual_memory: {
                total: 16 * GiB,
                free: 9 * GiB,
              },
              zfs: {
                arc_size: 0.2 * GiB,
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
              ecc_memory: true,
            },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders total amount of memory on the system', () => {
    expect(spectator.query('.total-memory')).toHaveText('16.0 GiB');
  });

  it('shows whether system has ECC memory', () => {
    expect(spectator.query('.memory-used-caption')).toHaveText('(ECC)');
  });

  it('shows memory stats for the system', () => {
    const stats = spectator.queryAll('.stats-item');
    expect(stats).toHaveLength(3);
    expect(stats[0]).toHaveText('Free: 9.0 GiB');
    expect(stats[1]).toHaveText('ZFS Cache: 0.2 GiB');
    expect(stats[2]).toHaveText('Services: 6.8 GiB');
  });

  it('shows a chart with memory stats', () => {
    const chart = spectator.query(BaseChartDirective);
    expect(chart).not.toBeNull();
    expect(chart.type).toBe('doughnut');

    const data = chart.data as ChartData<'doughnut'>;
    expect(data).toMatchObject({
      labels: ['Free', 'ZFS Cache', 'Services'],
      datasets: [{
        data: [9 * GiB, 0.2 * GiB, 6.8 * GiB],
      }],
    });
  });
});
