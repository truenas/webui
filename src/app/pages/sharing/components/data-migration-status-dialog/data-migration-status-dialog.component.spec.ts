import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
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

  describe('progress math', () => {
    it('renders progressPercent as 50 when half the bytes have been transferred', () => {
      build({ ...baseJob, stats: { ...baseStats } });

      const bar = spectator.query('mat-progress-bar')!;
      expect(bar.getAttribute('aria-valuenow') || bar.getAttribute('ng-reflect-value')).toBe('50');
    });

    it('emits 0 when total_bytes is 0', () => {
      build({ ...baseJob, stats: { ...baseStats, total_bytes: 0, count_bytes: 0 } });
      expect(spectator.component.progressPercent()).toBe(0);
    });
  });

  describe('startTime / finishedTime / ETA', () => {
    it('computes startTime from stats.start_time', () => {
      build({ ...baseJob, stats: { ...baseStats } });
      expect(spectator.component.startTime()).toEqual(new Date(1000 * 1000));
    });

    it('returns finishedTime when status is Complete', () => {
      build({ ...baseJob, status: TierRewriteJobStatus.Complete, stats: { ...baseStats } });
      expect(spectator.component.finishedTime()).toEqual(new Date(1100 * 1000));
    });

    it('returns null finishedTime when still running', () => {
      build({ ...baseJob, status: TierRewriteJobStatus.Running, stats: { ...baseStats } });
      expect(spectator.component.finishedTime()).toBeNull();
    });

    it('suppresses ETA below the 1% fraction threshold', () => {
      build({
        ...baseJob,
        stats: { ...baseStats, count_bytes: 1, total_bytes: 1_000_000 },
      });
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

      const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
      await cancelButton.click();

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith(
        'zfs.tier.rewrite_job_cancel',
        expect.any(Array),
      );
    });

    it('calls rewrite_job_cancel with the current tier_job_id when confirmed', async () => {
      build({ ...baseJob, stats: { ...baseStats } });

      const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
      await cancelButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'zfs.tier.rewrite_job_cancel',
        [{ tier_job_id: 'job-1' }],
      );
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
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

      expect(spectator.component.finishedTime()).toEqual(new Date(1100 * 1000));
    });
  });
});
