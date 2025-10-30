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
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetStorageComponent } from 'app/pages/dashboard/widgets/storage/widget-storage/widget-storage.component';

/**
 * helper function to create a fake pool for testing. in this file, we make a few different
 * fake pools with different scan states, so this function reduces the boilerplate.
 * @returns a `Pool` object.
 */
function makeFakePool(name: string, id: number, scan: PoolScanUpdate): Pool {
  return {
    id,
    name,
    scan,
    status: PoolStatus.Online,
    healthy: true,
    topology: {
      data: [
        {
          children: [],
          type: TopologyItemType.Disk,
          stats: {
            read_errors: 0,
            write_errors: 0,
            checksum_errors: 0,
          },
        },
        {
          children: [],
          type: TopologyItemType.Disk,
          stats: {
            read_errors: 1,
            write_errors: 2,
            checksum_errors: 3,
          },
        },
      ],
      log: [],
      cache: [],
      spare: [{
        children: [],
      }],
      special: [],
      dedup: [],
    },
  } as Pool;
}

const poolWithFinishedScrub = makeFakePool('poolWithFinishedScrub', 1, {
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
} as PoolScanUpdate);

const poolWithOngoingScrub = makeFakePool('poolWithOngoingScrub', 2, {
  function: PoolScanFunction.Scrub,
  state: PoolScanState.Scanning,
  start_time: {
    $date: Date.now(),
  },
  end_time: null,
  pause: null,
  errors: 0,
  percentage: 58.25,
  total_secs_left: 1200,
} as PoolScanUpdate);

const poolWithNeverRunScrub = makeFakePool('poolWithNeverRunScrub', 3, {
  function: PoolScanFunction.Scrub,
  state: PoolScanState.Finished,
  start_time: null,
  end_time: null,
  pause: null,
  errors: 0,
  percentage: 0,
  total_secs_left: null,
} as PoolScanUpdate);

const fakePools = [
  poolWithFinishedScrub,
  poolWithOngoingScrub,
  poolWithNeverRunScrub,
];

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
              poolWithFinishedScrub: {
                available: 1625071616,
                used: 2267242496,
                total: 3892314112,
              },
              poolWithOngoingScrub: {
                available: 1625071616,
                used: 2267242496,
                total: 3892314112,
              },
              poolWithNeverRunScrub: {
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
      mockProvider(PercentPipe, {
        transform: jest.fn((value: number) => `${(value * 100).toFixed(2)}%`),
      }),
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

  it('shows storage tiles', () => {
    const tiles = spectator.queryAll('.tile');
    expect(tiles).toHaveLength(3);

    const headers = tiles.map((tile) => tile.querySelector('.tile-header-title')!.textContent!.trim());
    expect(headers).toEqual(['poolWithFinishedScrub', 'poolWithOngoingScrub', 'poolWithNeverRunScrub']);
  });

  describe('scan status', () => {
    it('shows completed scrub with date', () => {
      const poolsInfo = spectator.component.poolsInfo();
      // fakePools[0] - poolWithFinishedScrub
      expect(poolsInfo[0].scan).toMatchObject({
        icon: 'check_circle',
        label: 'Last Scrub',
        level: 'safe',
        value: '2024-05-05 10:00:13',
      });
    });

    it('shows progress percentage when scrub is in progress', () => {
      const poolsInfo = spectator.component.poolsInfo();
      // fakePools[1] - poolWithOngoingScrub
      expect(poolsInfo[1].scan).toMatchObject({
        icon: 'arrow_circle_right',
        label: 'Last Scrub',
        level: 'safe',
        value: '58.25%',
      });
    });

    it('shows "Never" when scrub has never been run', () => {
      const poolsInfo = spectator.component.poolsInfo();
      // fakePools[2] - poolWithNeverRunScrub
      expect(poolsInfo[2].scan).toMatchObject({
        icon: 'mdi-minus-circle',
        label: 'Last Scrub',
        level: 'neutral',
        value: 'Never',
      });
    });
  });
});
