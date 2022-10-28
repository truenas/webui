import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconHarness } from '@angular/material/icon/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import {
  AutotrimDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';
import { ZfsHealthCardComponent } from 'app/pages/storage/components/dashboard-pool/zfs-health-card/zfs-health-card.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DialogService, WebSocketService } from 'app/services';

describe('ZfsHealthCardComponent', () => {
  let spectator: Spectator<ZfsHealthCardComponent>;
  let loader: HarnessLoader;
  const pool = {
    id: 45,
    name: 'tank',
    healthy: true,
    status: PoolStatus.Online,
    autotrim: {
      value: 'on',
    },
    scan: {
      state: PoolScanState.Finished,
      function: PoolScanFunction.Scrub,
      start_time: { $date: 1655917081000 },
      end_time: { $date: 1655917125000 },
      errors: 1,
    },
    topology: {
      data: [
        { stats: { read_errors: 0, checksum_errors: 0, write_errors: 1 } },
        { stats: { read_errors: 1, checksum_errors: 1, write_errors: 0 } },
      ],
    },
  } as Pool;
  const activeScrub = {
    state: PoolScanState.Scanning,
    function: PoolScanFunction.Scrub,
    percentage: 17.43,
    total_secs_left: 574,
  } as PoolScanUpdate;
  let websocket: WebSocketService;
  const websocketSubscription$ = new Subject<PoolScan>();

  const createComponent = createComponentFactory({
    component: ZfsHealthCardComponent,
    imports: [
      CoreComponents,
    ],
    providers: [
      mockProvider(PoolsDashboardStore),
      mockProvider(MatDialog),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(WebSocketService, {
        sub: jest.fn(() => websocketSubscription$),
        unsub: jest.fn(),
        call: jest.fn((method: string) => {
          if (method === 'pool.scrub.query') {
            return of([
              { id: 1 },
            ] as PoolScrubTask[]);
          }

          return of(undefined);
        }),
      }),
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { pool },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService);
  });

  describe('health indication', () => {
    it('shows an icon for pool status', async () => {
      const icon = await loader.getHarness(MatIconHarness.with({ ancestor: '.mat-card-title' }));
      expect(await icon.getName()).toBe('check_circle');
    });

    it('shows pool status string', () => {
      const detailsItem = spectator.query(byText('Pool Status:')).parentElement;
      expect(detailsItem.querySelector('.value')).toHaveText('Online');
    });

    it('shows total ZFS error count', () => {
      const detailsItem = spectator.query(byText('Total ZFS Errors:')).parentElement;
      expect(detailsItem.querySelector('.value')).toHaveText('3');
    });
  });

  describe('scrub tasks', () => {
    it('loads and shows if scrub task is set along with a link to view all scrub tasks', () => {
      expect(websocket.call).toHaveBeenCalledWith('pool.scrub.query', [[['pool_name', '=', 'tank']]]);

      const detailsItem = spectator.query(byText('Scheduled Scrub Task:')).parentElement;
      expect(detailsItem.querySelector('.value')).toHaveText('Set');

      const link = detailsItem.querySelector('a');
      expect(link).toHaveText('View All Scrub Tasks');
      expect(link).toHaveAttribute('href', '/data-protection/scrub');
    });

    it('shows information about last scan', () => {
      const lastScan = spectator.query(byText('Last Scan:')).parentElement;
      expect(lastScan.querySelector('.value')).toHaveText('Finished Scrub on 2022-06-22 19:58:45');

      const lastScanErrors = spectator.query(byText('Last Scan Errors:')).parentElement;
      expect(lastScanErrors.querySelector('.value')).toHaveText('1');

      const lastScanDuration = spectator.query(byText('Last Scan Duration:')).parentElement;
      expect(lastScanDuration.querySelector('.value')).toHaveText('44 seconds');
    });

    it('starts a scrub when Scrub is pressed', async () => {
      const scrubButton = await loader.getHarness(MatButtonHarness.with({ text: 'Scrub' }));
      await scrubButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(websocket.call).toHaveBeenCalledWith('pool.scrub', [45, PoolScrubAction.Start]);
    });

    it('shows information about an active scan task', async () => {
      expect(websocket.sub).toHaveBeenCalledWith('zfs.pool.scan', 'zfs.pool.scan - tank');

      websocketSubscription$.next({
        name: 'tank',
        scan: activeScrub,
      } as PoolScan);
      spectator.detectChanges();

      const scanInProgress = spectator.query('.scan-in-progress');
      expect(scanInProgress.querySelector('.scan-description')).toHaveText('Scrub In Progress:  17.43%');
      expect(scanInProgress.querySelector('.time-left')).toHaveText('9 minutes 34 seconds remaining');

      const progress = await loader.getHarness(MatProgressBarHarness.with({ ancestor: '.scan-in-progress' }));
      expect(await progress.getValue()).toBe(17.43);
    });

    it('stops a scrub task when scrub is running and Stop Scrub is pressed', async () => {
      spectator.setInput('pool', {
        ...pool,
        scan: activeScrub,
      });

      const stopScrubButton = await loader.getHarness(MatButtonHarness.with({ text: 'Stop Scrub' }));
      await stopScrubButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(websocket.call).toHaveBeenCalledWith('pool.scrub', [45, PoolScrubAction.Stop]);
    });

    it('shows information about an active resilver', () => {
      spectator.setInput('pool', {
        ...pool,
        scan: {
          ...activeScrub,
          function: PoolScanFunction.Resilver,
        },
      });

      const scanInProgress = spectator.query('.scan-in-progress');
      expect(scanInProgress.querySelector('.scan-description')).toHaveText('Resilvering:  17.43%');
    });
  });

  describe('auto TRIM', () => {
    it('shows current auto TRIM setting', () => {
      const detailsItem = spectator.query(byText('Auto TRIM:')).parentElement;
      expect(detailsItem.querySelector('.value')).toHaveText('On');
    });

    it('shows an AutotrimDialog when Edit auto Trim is pressed', () => {
      spectator.click(spectator.query(byText('Edit Auto TRIM')));

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AutotrimDialogComponent, {
        data: pool,
      });
    });
  });
});
