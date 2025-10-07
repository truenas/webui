import { PercentPipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { format } from 'date-fns';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetStorageComponent } from 'app/pages/dashboard/widgets/storage/widget-storage/widget-storage.component';

const fakePools: Pool[] = [
  {
    id: 1,
    name: 'dozer',
    status: PoolStatus.Online,
    healthy: true,
    scan: {
      function: PoolScanFunction.Scrub,
      state: PoolScanState.Finished,
      start_time: {
        $date: 1714892401000,
      },
      end_time: {
        $date: 1714892413000,
      },
      pause: null,
      errors: 0,
      total_secs_left: null,
    },
    topology: {
      data: [
        {
          children: [] as VDevItem[],
          type: TopologyItemType.Disk,
          stats: {
            read_errors: 0,
            write_errors: 0,
            checksum_errors: 0,
          },
        } as VDevItem,
        {
          children: [] as VDevItem[],
          type: TopologyItemType.Disk,
          stats: {
            read_errors: 1,
            write_errors: 2,
            checksum_errors: 3,
          },
        } as VDevItem,
      ] as VDevItem[],
      log: [] as VDevItem[],
      cache: [] as VDevItem[],
      spare: [{
        children: [] as VDevItem[],
      }] as VDevItem[],
      special: [] as VDevItem[],
      dedup: [] as VDevItem[],
    } as PoolTopology,
  },
] as Pool[];

describe('WidgetStorageComponent', () => {
  let spectator: Spectator<WidgetStorageComponent>;
  const createComponent = createComponentFactory({
    component: WidgetStorageComponent,
    imports: [
      NgxSkeletonLoaderModule,
      MatGridListModule,
    ],
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
      mockProvider(
        WidgetResourcesService,
        {
          pools$: of(fakePools),
          poolUpdatesWithStaleDetection: () => of({
            value: {
              dozer: {
                available: 1625071616,
                used: 2267242496,
                total: 3892314112,
              },
            },
            isStale: false,
          }),
        },
      ),
      mockProvider(FormatDateTimePipe, {
        transform: jest.fn((date) => {
          return format(typeof date === 'string' ? Date.parse(date) : date as number | Date, 'yyyy-MM-dd HH:mm:ss');
        }),
      }),
      mockProvider(PercentPipe),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
    });
  });

  it('sets poolsInfo', () => {
    expect(spectator.component.poolsInfo()).toMatchObject([
      {
        name: 'dozer',
        status: {
          icon: 'check_circle',
          label: 'Pool Status',
          level: 'safe',
          value: 'ONLINE',
        },
        usedSpace: {
          icon: 'check_circle',
          label: 'Used Space',
          level: 'safe',
          value: '58.25%',
        },
        disksWithError: {
          icon: 'error',
          label: 'Disks with Errors',
          level: 'warn',
          value: '1 of 2',
        },
        scan: {
          icon: 'check_circle',
          label: 'Last Scrub',
          level: 'safe',
          value: '2024-05-05 10:00:13',
        },
        freeSpace: '1.51 GiB',
        totalDisks: '2',
      },
    ]);
  });

  it('shows storage tiles', () => {
    const tiles = spectator.queryAll('.tile');
    expect(tiles).toHaveLength(1);

    const headers = tiles.map((tile) => tile.querySelector('.tile-header-title')!.textContent!.trim());
    expect(headers).toEqual(['dozer']);

    const contents = tiles.map((tile) => {
      const labels: (string | null)[] = [];
      const values: (string | null)[] = [];
      tile.querySelectorAll('li').forEach((row) => {
        const label = row.querySelector('.label')!;
        const value = row.querySelector('.value')!;
        labels.push(label ? label.textContent!.trim() : null);
        values.push(value ? value.getAttribute('ng-reflect-content')! || value.textContent!.trim() : null);
      });
      return { labels, values };
    });

    expect(contents).toEqual([
      {
        labels: [
          'Pool Status:',
          'Used Space:',
          'Disks with Errors:',
          'Last Scrub:',
          'Free Space:',
          'Total Disks:',
          'Data:',
          'Caches:',
          'Spares:',
        ],
        values: [
          'ONLINE',
          '58.25%',
          '1 of 2',
          null,
          '1.51 GiB',
          '2',
          '2 vdev',
          '0',
          '1',
        ],
      },
    ]);
  });
});
