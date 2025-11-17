import { PercentPipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { format } from 'date-fns';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of, map, BehaviorSubject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetStorageComponent } from 'app/pages/dashboard/widgets/storage/widget-storage/widget-storage.component';

// ~3.63GiB
const totalData = 3892314112;
// ~2.11GiB
const usedData = 2267242496;


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
  percentage: 65.19,
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

describe('WidgetStorageComponent', () => {
  let spectator: Spectator<WidgetStorageComponent>;
  const pools$ = new BehaviorSubject<Pool[]>([]);
  const scans$ = new BehaviorSubject<PoolScan>(null);
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
          pools$,
          poolUpdatesWithStaleDetection: () => of({
            value: {
              // since we only ever check the size values of the pool with a finished scrub,
              // we only define the size for the pool with a finished scrub.
              poolWithFinishedScrub: {
                available: totalData - usedData,
                used: usedData,
                total: totalData,
              },
            },
            isStale: false,
          }),
          scans$,
          // instead of *actually* doing any stale detection, just always say it's not stale.
          scanUpdatesWithStaleDetection: () => scans$.pipe(
            map((update) => { return { isStale: false, value: update }; }),
          ),
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

  describe('Single Pool Configuration', () => {
    // within each describe block, we change the `pools$` subject to contain whichever pools
    // we want to test with. for this specific block, we
    // *only* want the pool with a finished scrub (and a size defined).
    beforeEach(() => {
      pools$.next([poolWithFinishedScrub]);
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
      });
    });

    it('sets poolsInfo', () => {
      const poolsInfo = spectator.component.poolsInfo();
      expect(poolsInfo).toMatchObject([{
        name: 'poolWithFinishedScrub',
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
      }]);
    });

    it('shows storage tiles', () => {
      const tiles = spectator.queryAll('.tile');
      expect(tiles).toHaveLength(1);

      const headers = tiles.map((tile) => tile.querySelector('.tile-header-title')!.textContent!.trim());
      expect(headers).toEqual(['poolWithFinishedScrub']);

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

      expect(contents[0]).toEqual(
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
      );
    });
  });

  describe('Multiple Pools - Scrub Status', () => {
    beforeEach(() => {
      pools$.next([poolWithFinishedScrub, poolWithOngoingScrub, poolWithNeverRunScrub]);
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
      });
    });

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
        value: '65.19%',
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

  describe('Live Updates', () => {
    beforeEach(() => {
      pools$.next([poolWithOngoingScrub]);
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
      });
    });

    it('updates the percentage live', () => {
      let poolsInfo = spectator.component.poolsInfo();
      expect(poolsInfo[0].scan).toMatchObject({
        icon: 'arrow_circle_right',
        label: 'Last Scrub',
        level: 'safe',
        value: '65.19%',
      });

      scans$.next({
        name: 'poolWithOngoingScrub',
        scan: {
          ...poolWithOngoingScrub.scan,
          percentage: 71.234,
        },
      });

      spectator.detectChanges();
      poolsInfo = spectator.component.poolsInfo();

      expect(poolsInfo[0].scan).toMatchObject({
        icon: 'arrow_circle_right',
        label: 'Last Scrub',
        level: 'safe',
        value: '71.23%',
      });
    });
  });
});
