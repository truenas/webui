import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { MemoryUpdate } from 'app/interfaces/reporting.interface';
import { ThemeService } from 'app/modules/theme/theme.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetMemoryComponent } from 'app/pages/dashboard/widgets/memory/widget-memory/widget-memory.component';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('WidgetMemoryComponent', () => {
  let spectator: Spectator<WidgetMemoryComponent>;
  const memoryData = {
    physical_memory_total: 16 * GiB,
    physical_memory_available: 9 * GiB,
    arc_size: 0.2 * GiB,
    arc_available_memory: GiB,
    arc_free_memory: 0.8 * GiB,
  } as MemoryUpdate;

  const createComponent = createComponentFactory({
    component: WidgetMemoryComponent,
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
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

  it('renders total amount of memory on the system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            memoryUpdatesWithStaleDetection: () => of({
              value: memoryData,
              isStale: false,
            }),
          },
        ),
      ],
    });

    expect(spectator.query('.total-memory')).toHaveText('16.0 GiB');
  });

  it('shows whether system has ECC memory', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            memoryUpdatesWithStaleDetection: () => of({
              value: memoryData,
              isStale: false,
            }),
          },
        ),
      ],
    });

    expect(spectator.query('.memory-used-caption')).toHaveText('(ECC)');
  });

  it('shows memory stats for the system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            memoryUpdatesWithStaleDetection: () => of({
              value: memoryData,
              isStale: false,
            }),
          },
        ),
      ],
    });

    const stats = spectator.queryAll('.stats-item');
    expect(stats).toHaveLength(3);
    expect(stats[0]).toHaveText('Free: 9.0 GiB');
    expect(stats[1]).toHaveText('ZFS Cache: 0.2 GiB');
    expect(stats[2]).toHaveText('Services: 6.8 GiB');
  });

  it('shows a chart with memory stats', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            memoryUpdatesWithStaleDetection: () => of({
              value: memoryData,
              isStale: false,
            }),
          },
        ),
      ],
    });

    const chart = spectator.query(BaseChartDirective)!;
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

  it('shows stale data notice when data is stale', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(
          WidgetResourcesService,
          {
            memoryUpdatesWithStaleDetection: () => of({
              value: null,
              isStale: true,
            }),
          },
        ),
      ],
    });

    expect(spectator.query('ix-widget-stale-data-notice')).toExist();
    expect(spectator.query('.header')).not.toExist();
  });
});
