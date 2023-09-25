import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  AutotrimDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';
import { ZfsHealthCardComponent } from 'app/pages/storage/components/dashboard-pool/zfs-health-card/zfs-health-card.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

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
  const websocketSubscription$ = new Subject<ApiEvent<PoolScan>>();

  const createComponent = createComponentFactory({
    component: ZfsHealthCardComponent,
    imports: [
      CoreComponents,
    ],
    providers: [
      mockProvider(PoolsDashboardStore),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of()),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(WebSocketService, {
        subscribe: jest.fn(() => websocketSubscription$),
        call: jest.fn((method: string) => {
          if (method === 'pool.scrub.query') {
            return of([
              { id: 1 },
            ] as PoolScrubTask[]);
          }

          return of(undefined);
        }),
        startJob: jest.fn(() => of(undefined)),
      }),
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
    websocket = spectator.inject(WebSocketService);
  });

  describe('health indication', () => {
    it('shows an icon for pool status', () => {
      expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Safe);
      expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Everything is fine');
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
      expect(websocket.startJob).toHaveBeenCalledWith('pool.scrub', [45, PoolScrubAction.Start]);
    });

    it('shows information about an active scan task', async () => {
      expect(websocket.subscribe).toHaveBeenLastCalledWith('zfs.pool.scan');

      websocketSubscription$.next({
        id: 2,
        collection: 'zfs.pool.scan',
        msg: IncomingApiMessageType.Changed,
        fields: {
          name: 'tank',
          scan: activeScrub,
        } as PoolScan,
      });
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
      expect(websocket.startJob).toHaveBeenCalledWith('pool.scrub', [45, PoolScrubAction.Stop]);
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

  describe('pausing scrub', () => {
    it('pauses scrub when it was started and then Pause was pressed', async () => {
      websocketSubscription$.next({
        id: 2,
        collection: 'zfs.pool.scan',
        msg: IncomingApiMessageType.Changed,
        fields: {
          name: 'tank',
          scan: activeScrub,
        } as PoolScan,
      });
      spectator.detectChanges();

      const pauseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Pause Scrub' }));
      await pauseButton.click();

      expect(spectator.inject(WebSocketService).startJob).toHaveBeenCalledWith('pool.scrub', [45, PoolScrubAction.Pause]);
    });

    it('resumes scrub after it was previously paused and Resume was pressed', async () => {
      websocketSubscription$.next({
        id: 2,
        collection: 'zfs.pool.scan',
        msg: IncomingApiMessageType.Changed,
        fields: {
          name: 'tank',
          scan: {
            ...activeScrub,
            pause: {
              $date: 1655917081000,
            },
          },
        } as PoolScan,
      });
      spectator.detectChanges();

      const resumeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Resume Scrub' }));
      await resumeButton.click();

      expect(spectator.inject(WebSocketService).startJob).toHaveBeenCalledWith('pool.scrub', [45, PoolScrubAction.Start]);
    });
  });
});
