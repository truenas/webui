import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent, MockComponents } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ScrubFormComponent,
} from 'app/pages/storage/components/dashboard-pool/disk-health-card/scrub-form/scrub-form.component';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  ActivePoolScanComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/active-pool-scan/active-pool-scan.component';
import {
  DeduplicationStatsComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/deduplication-stats/deduplication-stats.component';
import {
  LastPoolScanComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/last-pool-scan/last-pool-scan.component';
import { StorageHealthCardComponent } from 'app/pages/storage/components/dashboard-pool/storage-health-card/storage-health-card.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';

describe('StorageHealthCardComponent', () => {
  let spectator: Spectator<StorageHealthCardComponent>;
  let loader: HarnessLoader;

  const completedScrub = {
    state: PoolScanState.Finished,
    function: PoolScanFunction.Scrub,
    start_time: { $date: 1655917081000 },
    end_time: { $date: 1655917125000 },
    errors: 1,
  };
  const pool = {
    id: 45,
    name: 'tank',
    healthy: true,
    status: PoolStatus.Online,
    autotrim: {
      value: 'on',
    },
    scan: completedScrub,
    topology: {
      data: [
        {
          guid: '123456789',
          disk: 'sda',
          stats: { read_errors: 0, checksum_errors: 0, write_errors: 1 },
        },
        {
          guid: '987654321',
          disk: 'sdb',
          stats: { read_errors: 1, checksum_errors: 1, write_errors: 0 },
        },
      ],
    },
  } as Pool;
  const scrubTask = {
    id: 1,
    enabled: true,
    schedule: {
      minute: '0',
      hour: '15',
      dom: '*',
      dow: '7',
      month: '*',
    },
  } as ScrubTask;

  let api: ApiService;
  const websocketSubscription$ = new Subject<ApiEvent<PoolScan>>();

  const createComponent = createComponentFactory({
    component: StorageHealthCardComponent,
    imports: [
      MapValuePipe,
      MockComponents(
        ActivePoolScanComponent,
        DeduplicationStatsComponent,
        LastPoolScanComponent,
      ),
    ],
    providers: [
      mockProvider(PoolsDashboardStore, {
        scrubForPool: jest.fn(() => scrubTask),
      }),
      mockProvider(Router, {
        navigate: jest.fn(),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(LocaleService, {
        timezone: 'America/New_York',
      }),
      mockProvider(ApiService, {
        subscribe: jest.fn(() => websocketSubscription$),
        call: jest.fn((method: string) => {
          if (method === 'pool.scrub.query') {
            return of([
              { id: 1 },
            ] as ScrubTask[]);
          }

          return of(undefined);
        }),
        startJob: jest.fn(() => of(undefined)),
      }),
      mockAuth(),
    ],
    declarations: [
      FakeFormatDateTimePipe,
      MockComponent(PoolCardIconComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { pool },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  describe('health indication', () => {
    const degradedPool = {
      ...pool,
      status: PoolStatus.Degraded,
    } as Pool;

    const faultedPool = {
      ...pool,
      status: PoolStatus.Faulted,
    } as Pool;

    const unhealthyPool = {
      ...pool,
      healthy: false,
    } as Pool;

    const unhealthyUnknownPool = {
      ...pool,
      healthy: false,
      status: PoolStatus.Unknown,
    } as Pool;

    it('shows an icon for pool status', () => {
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Safe);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Everything is fine');
    });

    it('shows the correct icon/tooltip for unhealthy/degraded/faulted pools', () => {
      // degraded pool should show warning
      spectator.setInput('pool', degradedPool);
      spectator.detectChanges();
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Warn);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe(
        'Pool status is Degraded',
      );

      // faulted pool should show error
      spectator.setInput('pool', faultedPool);
      spectator.detectChanges();
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Error);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe(
        'Pool status is Faulted',
      );

      // unhealthy pool that's still online should show warning
      spectator.setInput('pool', unhealthyPool);
      spectator.detectChanges();
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Warn);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe(
        'Pool is Online with errors',
      );

      // unhealthy pool that has some other status should show error and say 'Pool is not healthy.'
      spectator.setInput('pool', unhealthyUnknownPool);
      spectator.detectChanges();
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Error);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe(
        'Pool is not healthy',
      );
    });
  });

  describe('error display and navigation', () => {
    it('shows pool status string with error counts', () => {
      const statusEl = spectator.query('.status');
      expect(statusEl).toHaveText('Online, 3 errors.');
    });

    it('shows "no errors" message when pool has no errors', () => {
      spectator.setInput('pool', {
        ...pool,
        topology: {
          data: [
            { stats: { read_errors: 0, checksum_errors: 0, write_errors: 0 } },
            { stats: { read_errors: 0, checksum_errors: 0, write_errors: 0 } },
          ],
        },
      });
      spectator.detectChanges();

      const statusElement = spectator.query('.status');
      expect(statusElement).toHaveText('Online, no errors.');
    });

    it('shows error count for both VDEV and disk errors when both present', () => {
      spectator.setInput('pool', {
        ...pool,
        topology: {
          data: [
            {
              type: 'MIRROR',
              stats: { read_errors: 1, checksum_errors: 0, write_errors: 0 },
              children: [
                { type: 'DISK', stats: { read_errors: 2, checksum_errors: 1, write_errors: 0 } },
              ],
            },
          ],
        },
      });
      spectator.detectChanges();

      const statusElement = spectator.query('.status');
      expect(statusElement).toHaveText('Online, 4 errors.');
    });

    it('shows "View" link when there are errors', () => {
      const viewLink = spectator.query(byText('View'));
      expect(viewLink).toBeTruthy();
    });

    it('does not show "View" link when there are no errors', () => {
      spectator.setInput('pool', {
        ...pool,
        topology: {
          data: [
            { stats: { read_errors: 0, checksum_errors: 0, write_errors: 0 } },
          ],
        },
      });
      spectator.detectChanges();

      const viewLink = spectator.query(byText('View'));
      expect(viewLink).toBeFalsy();
    });

    it('navigates to the pool VDEVs page when clicking "View"', () => {
      const router = spectator.inject(Router);
      const viewLink = spectator.query(byText('View'));
      expect(viewLink).toBeTruthy();

      spectator.click(viewLink);

      expect(router.navigate).toHaveBeenCalledWith([
        '/storage',
        pool.id.toString(),
        'vdevs',
      ]);
    });

    describe('scrub tasks', () => {
      it('shows if scrub task is set along with a link to view all scrub tasks', () => {
        const detailsItem = spectator.query(byText('Scheduled Scrub:'))!.parentElement!;
        expect(detailsItem.querySelector('.value')).toHaveText('At 15:00 (03:00 PM), only on Sunday');
      });

      it('opens the form to create/edit scrub task when Configure link is pressed', () => {
        const detailsItem = spectator.query(byText('Scheduled Scrub:'))!.parentElement!;

        const link = detailsItem.querySelector('a')!;
        expect(link).toHaveText('Configure');

        spectator.click(link);

        expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ScrubFormComponent, {
          data: {
            poolId: pool.id,
            existingScrubTask: scrubTask,
          },
        });
      });

      it('starts a scrub when Scrub Now is pressed', async () => {
        const scrubButton = await loader.getHarness(MatButtonHarness.with({ text: 'Scrub Now' }));
        await scrubButton.click();

        expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
        expect(api.startJob).toHaveBeenCalledWith('pool.scrub', [45, PoolScrubAction.Start]);
      });

      it('shows information about an active scan task', () => {
        const activeScrub = {
          name: 'tank',
          scan: {
            state: PoolScanState.Scanning,
            function: PoolScanFunction.Scrub,
            percentage: 17.43,
            total_secs_left: 574,
          },
        } as PoolScan;

        websocketSubscription$.next({
          fields: activeScrub,
        } as ApiEvent<PoolScan>);

        spectator.detectChanges();

        const activePoolScan = spectator.query(ActivePoolScanComponent);
        expect(activePoolScan).toBeTruthy();
        expect(activePoolScan.scan).toEqual(activeScrub.scan);
        expect(activePoolScan.pool).toEqual(pool);
      });

      it('shows information about last scan results', () => {
        const lastPoolScan = spectator.query(LastPoolScanComponent);
        expect(lastPoolScan).toBeTruthy();
        expect(lastPoolScan.scan).toEqual(completedScrub);
      });
    });

    describe('auto TRIM', () => {
      it('shows current auto TRIM setting', () => {
        const detailsItem = spectator.query(byText('Auto TRIM:'))!.parentElement!;
        expect(detailsItem.querySelector('.value')).toHaveText('On');
      });

      it('shows Auto TRIM when enabled', () => {
        expect(spectator.query(byText('Auto TRIM:'))).toBeTruthy();
      });

      it('hides Auto TRIM when disabled', () => {
        spectator.setInput('pool', {
          ...pool,
          autotrim: { value: 'off' },
        });
        spectator.detectChanges();

        expect(spectator.query(byText('Auto TRIM:'))).toBeFalsy();
      });
    });
  });

  describe('deduplication', () => {
    it('does not show deduplication line if there are no deduplication stats', () => {
      const detailsItem = spectator.query(byText('Deduplication Table:'));
      expect(detailsItem).not.toExist();
    });
  });
});
