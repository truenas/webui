import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { Subject, of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';
import { ApiEvent } from 'app/interfaces/api-event.interface';
import { ZfsTierRewriteJobEntry, ZfsTierRewriteJobStats } from 'app/interfaces/zfs-tier.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const baseJob: ZfsTierRewriteJobEntry = {
  tier_job_id: 'job-1',
  dataset_name: 'pool1/ds',
  job_uuid: 'uuid-1',
  status: TierRewriteJobStatus.Running,
  error: null,
};

const baseStats: ZfsTierRewriteJobStats = {
  start_time: 1000,
  initial_time: 1000,
  update_time: 1100,
  count_items: 5,
  count_bytes: 5_000_000,
  total_items: 10,
  total_bytes: 10_000_000,
  failures: 0,
  success: 5,
  parent: '',
  name: '',
};

describe('DataMigrationStatusDialogComponent', () => {
  let spectator: Spectator<DataMigrationStatusDialogComponent>;
  let loader: HarnessLoader;
  let updates$: Subject<ApiEvent<ZfsTierRewriteJobEntry>>;

  const createComponent = createComponentFactory({
    component: DataMigrationStatusDialogComponent,
    providers: [
      mockApi([
        mockCall('zfs.tier.rewrite_job_cancel'),
      ]),
      mockProvider(DialogRef, { close: jest.fn() }),
      mockProvider(ErrorHandlerService),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
    ],
  });

  function build(job: ZfsTierRewriteJobEntry, targetTier = DatasetTier.Performance): void {
    updates$ = new Subject();
    spectator = createComponent({
      detectChanges: false,
      providers: [
        { provide: DIALOG_DATA, useValue: { tierJob: job, targetTier } },
      ],
    });
    jest.spyOn(spectator.inject(ApiService), 'subscribe').mockReturnValue(updates$);
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('stats', () => {
    it('splits each pair into its own unbreakable part, so a long value wraps instead of overlapping', () => {
      build({ ...baseJob, stats: { ...baseStats } });

      const parts = spectator.queryAll('.stat-value .stat-part').map((part) => part.textContent.trim());

      expect(parts).toEqual(['4.77 MiB /', '9.54 MiB', '5 /', '10', '0']);

      // The separator between the parts must survive Angular's whitespace
      // removal, or the pair renders as "4.77 MiB /9.54 MiB".
      const values = spectator.queryAll('.stat-value').map((value) => value.textContent.trim());

      expect(values).toEqual(['4.77 MiB / 9.54 MiB', '5 / 10', '0']);
    });
  });

  describe('progress math', () => {
    it('renders progressPercent as 50 when half the items are done', () => {
      build({ ...baseJob, stats: { ...baseStats } });

      const bar = spectator.query('tn-progress-bar')!;
      expect(bar.getAttribute('aria-valuenow') || bar.getAttribute('ng-reflect-value')).toBe('50');
    });

    it('emits 0 when total_items is 0', () => {
      build({ ...baseJob, stats: { ...baseStats, total_items: 0, success: 0 } });
      expect(spectator.component.progressPercent()).toBe(0);
    });

    it('ignores byte counts, which reach the total before anything is rewritten', () => {
      build({
        ...baseJob,
        stats: {
          ...baseStats, count_bytes: 4_000_000, total_bytes: 4_000_000, success: 0, total_items: 10,
        },
      });

      expect(spectator.component.progressPercent()).toBe(0);
    });

    it('clamps an item count that overshoots its total', () => {
      build({ ...baseJob, stats: { ...baseStats, success: 12, total_items: 10 } });

      expect(spectator.component.progressPercent()).toBe(100);
    });

    it('floors the percentage, so a nearly-done job does not read 100 while it runs', () => {
      build({ ...baseJob, stats: { ...baseStats, success: 999, total_items: 1000 } });

      expect(spectator.component.progressPercent()).toBe(99);
    });

    it('counts failed items as processed, so a terminal job reaches 100%', () => {
      build({
        ...baseJob,
        status: TierRewriteJobStatus.Complete,
        stats: {
          ...baseStats, total_items: 10, success: 9, failures: 1,
        },
      });

      expect(spectator.component.progressPercent()).toBe(100);
    });

    it('runs the bar indeterminate while a single-item job is in flight', () => {
      build({ ...baseJob, stats: { ...baseStats, total_items: 1, success: 0 } });

      expect(spectator.query('tn-progress-bar')).toHaveAttribute('mode', 'indeterminate');
    });

    it('settles a single-item job back to a determinate bar once it ends', () => {
      build({
        ...baseJob,
        status: TierRewriteJobStatus.Complete,
        stats: { ...baseStats, total_items: 1, success: 1 },
      });

      expect(spectator.query('tn-progress-bar')).toHaveAttribute('mode', 'determinate');
      expect(spectator.component.progressPercent()).toBe(100);
    });
  });

  describe('startTime / endTime / ETA', () => {
    it('computes startTime from stats.start_time', () => {
      build({ ...baseJob, stats: { ...baseStats } });
      expect(spectator.component.startTime()).toEqual(new Date(1000 * 1000));
    });

    it.each([
      [TierRewriteJobStatus.Complete, 'Finished'],
      [TierRewriteJobStatus.Cancelled, 'Cancelled'],
      [TierRewriteJobStatus.Stopped, 'Stopped'],
      [TierRewriteJobStatus.Error, 'Failed'],
    ])('shows when the job ended for status %s', (status, label) => {
      build({ ...baseJob, status, stats: { ...baseStats } });

      expect(spectator.component.endTime()).toEqual(new Date(1100 * 1000));
      expect(spectator.query('.time-info')).toHaveText(`${label}: `);
    });

    it.each([
      TierRewriteJobStatus.Running,
      TierRewriteJobStatus.Queued,
    ])('returns null endTime for status %s', (status) => {
      build({ ...baseJob, status, stats: { ...baseStats } });

      expect(spectator.component.endTime()).toBeNull();
      expect(spectator.component.endTimeLabel()).toBeNull();
    });

    it('returns null endTime when an ended job never reported stats', () => {
      build({ ...baseJob, status: TierRewriteJobStatus.Cancelled });
      expect(spectator.component.endTime()).toBeNull();
    });

    it('suppresses ETA below the 1% fraction threshold', () => {
      build({
        ...baseJob,
        stats: { ...baseStats, success: 1, total_items: 1000 },
      });
      expect(spectator.component.estimatedCompletion()).toBeNull();
    });

    it('suppresses ETA once every item is done, instead of extrapolating to the start time', () => {
      build({
        ...baseJob,
        stats: { ...baseStats, success: 10, total_items: 10 },
      });

      expect(spectator.component.estimatedCompletion()).toBeNull();
    });

    it('suppresses ETA when the first tick lands in the same second the job started', () => {
      build({ ...baseJob, stats: { ...baseStats, update_time: 1000 } });

      expect(spectator.component.estimatedCompletion()).toBeNull();
    });

    it('returns an ETA Date when fractionDone >= 1%', () => {
      // 50% done in 100s => total 200s => ETA at start_time + 200000ms
      build({ ...baseJob, stats: { ...baseStats } });
      expect(spectator.component.estimatedCompletion())
        .toEqual(new Date(1000 * 1000 + 200_000));
    });
  });

  describe('cancel flow', () => {
    it('does not call rewrite_job_cancel when the user declines the confirmation', async () => {
      build({ ...baseJob, stats: { ...baseStats } });
      (spectator.inject(DialogService).confirm as jest.Mock).mockReturnValueOnce(of(false));

      const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
      await cancelButton.click();

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith(
        'zfs.tier.rewrite_job_cancel',
        expect.any(Array),
      );
    });

    it('calls rewrite_job_cancel with the current tier_job_id when confirmed', async () => {
      build({ ...baseJob, stats: { ...baseStats } });

      const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
      await cancelButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'zfs.tier.rewrite_job_cancel',
        [{ tier_job_id: 'job-1' }],
      );
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    });

    it('warns in the confirmation that the tier change itself is not reverted', async () => {
      build({ ...baseJob, stats: { ...baseStats } });

      const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
      await cancelButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('The storage tier change has already been applied and is not reverted by cancelling.'),
      }));
    });
  });

  describe('live job updates', () => {
    it('updates the job signal when a status event arrives', () => {
      build({ ...baseJob, stats: { ...baseStats } });

      updates$.next({
        msg: 'changed',
        collection: 'zfs.tier.rewrite_job_status',
        id: 'job-1',
        fields: { ...baseJob, status: TierRewriteJobStatus.Complete, stats: { ...baseStats } },
      } as ApiEvent<ZfsTierRewriteJobEntry>);
      spectator.detectChanges();

      expect(spectator.component.endTime()).toEqual(new Date(1100 * 1000));
    });

    it('shows the cancelled timestamp when the job is cancelled while the dialog is open', () => {
      build({ ...baseJob, stats: { ...baseStats } });

      updates$.next({
        msg: 'changed',
        collection: 'zfs.tier.rewrite_job_status',
        id: 'job-1',
        fields: { ...baseJob, status: TierRewriteJobStatus.Cancelled, stats: { ...baseStats } },
      } as ApiEvent<ZfsTierRewriteJobEntry>);
      spectator.detectChanges();

      expect(spectator.query('.time-info')).toHaveText('Cancelled: ');
    });
  });
});
