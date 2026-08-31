import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnProgressBarComponent } from '@truenas/ui-components';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import {
  getTierJobEndTimeLabelKey, getTierJobStatusClass, getTierJobStatusLabelKey, getTierLabelKey, isTierJobRunning,
} from 'app/pages/sharing/components/tier-status.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface DataMigrationStatusDialogData {
  tierJob: ZfsTierRewriteJobEntry;
  targetTier: DatasetTier;
}

@Component({
  selector: 'ix-data-migration-status-dialog',
  templateUrl: './data-migration-status-dialog.component.html',
  styleUrls: ['./data-migration-status-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TnProgressBarComponent,
    TranslateModule,
    NgClass,
    FormatDateTimePipe,
    FileSizePipe,
  ],
})
export class DataMigrationStatusDialogComponent implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  protected dialogRef = inject(DialogRef<unknown, DataMigrationStatusDialogComponent>);
  private dialogService = inject(DialogService);
  private tierService = inject(SharingTierService);
  protected data = inject<DataMigrationStatusDialogData>(DIALOG_DATA);

  protected job = signal<ZfsTierRewriteJobEntry>(this.data.tierJob);

  protected isRunning = computed(() => isTierJobRunning(this.job()));

  protected statusLabel = computed(() => {
    const key = getTierJobStatusLabelKey(this.job());
    return key ? this.translate.instant(key) : '';
  });

  protected statusClass = computed(() => getTierJobStatusClass(this.job()));

  protected sourceTier = computed(() => {
    const sourceTier = this.data.targetTier === DatasetTier.Performance
      ? DatasetTier.Regular
      : DatasetTier.Performance;
    const key = getTierLabelKey(sourceTier);
    return key ? this.translate.instant(key) : '';
  });

  protected targetTierLabel = computed(() => {
    const key = getTierLabelKey(this.data.targetTier);
    return key ? this.translate.instant(key) : '';
  });

  protected startTime = computed<Date | null>(() => {
    const stats = this.job()?.stats;
    return stats ? new Date(stats.start_time * 1000) : null;
  });

  /**
   * Label for `endTime`, which doubles as the "has this job ended?" test: it is
   * null exactly for the statuses a job can still leave (running, queued).
   */
  protected endTimeLabel = computed<string | null>(() => {
    const key = getTierJobEndTimeLabelKey(this.job());
    return key ? this.translate.instant(key) : null;
  });

  /**
   * When a job stopped. The backend has no dedicated end timestamp, so this uses
   * the last stats update, which for any ended job is its final progress report.
   * Shown for every terminal status, not just Complete, so a cancelled or failed
   * migration says when it stopped instead of leaving the reader guessing.
   */
  protected endTime = computed<Date | null>(() => {
    const job = this.job();
    if (!this.endTimeLabel() || !job?.stats) {
      return null;
    }
    return new Date(job.stats.update_time * 1000);
  });

  /**
   * Progress is measured in items, not bytes. `count_bytes` is the byte count
   * the job has *claimed*, not written — it reaches `total_bytes` as soon as
   * the job has enumerated the dataset, and can even exceed it, so a byte-based
   * bar reads 100% on a job that has rewritten nothing.
   *
   * Items *processed*, not items succeeded: `failures` is a counter disjoint
   * from `success` (the Failures card reports it separately), so a job that
   * ends having failed an item would otherwise stall the bar short of full
   * next to a terminal status badge. A failed item is finished work either way.
   */
  protected progressFraction = computed(() => {
    const stats = this.job()?.stats;
    if (!stats || stats.total_items <= 0) return 0;
    return Math.min(1, Math.max(0, (stats.success + stats.failures) / stats.total_items));
  });

  /**
   * Floor, not round: at 999 of 1000 items `Math.round` reads 100 while the job
   * is still running and still showing an ETA, so the bar would claim to be
   * done ahead of every other element on screen. `progressFraction` is clamped,
   * so flooring can only reach 100 when the job genuinely is.
   */
  protected progressPercent = computed(() => Math.floor(this.progressFraction() * 100));

  /**
   * A single-item job has no expressible middle: `success` is 0 until the one
   * file lands, then 1. Rather than pin the bar at 0% for the whole rewrite,
   * show motion without a false number while it runs.
   */
  protected hasIndeterminateProgress = computed(() => {
    const stats = this.job()?.stats;
    return !!stats && this.isRunning() && stats.total_items <= 1;
  });

  /**
   * Below this fraction the ETA is too unstable to display — at <1% complete,
   * a brief stall at the start can extrapolate to days/years out, which is
   * worse than showing nothing.
   */
  private static readonly minFractionForEta = 0.01;

  protected estimatedCompletion = computed<Date | null>(() => {
    const job = this.job();
    const start = this.startTime();
    if (!start || !job?.stats) {
      return null;
    }
    const fractionDone = this.progressFraction();
    // At >=100% there is nothing left to estimate, and extrapolating from a
    // fraction of 1 just returns the elapsed time — which is how the ETA used
    // to render as the start time itself.
    if (fractionDone < DataMigrationStatusDialogComponent.minFractionForEta || fractionDone >= 1) {
      return null;
    }
    const now = job.stats.update_time * 1000;
    const elapsed = now - start.getTime();
    // The first status tick can land in the same second the job started.
    if (elapsed <= 0) {
      return null;
    }
    const estimatedTotal = elapsed / fractionDone;
    return new Date(start.getTime() + estimatedTotal);
  });

  ngOnInit(): void {
    this.subscribeToJobUpdates();
  }

  protected onCancel(): void {
    this.dialogService.confirm({
      message: this.translate.instant(
        'Are you sure you want to cancel this data migration? The storage tier change has already been applied and is not reverted by cancelling. Data already transferred will remain at its destination.',
      ),
      buttonText: this.translate.instant('Stop migration'),
      buttonColor: 'warn',
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((confirmed) => {
      if (!confirmed) return;

      this.api.call('zfs.tier.rewrite_job_cancel', [{ tier_job_id: this.job().tier_job_id }]).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
        },
      });
    });
  }

  private subscribeToJobUpdates(): void {
    this.tierService.subscribeTierJobStatus(this.data.tierJob.tier_job_id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job) => this.job.set(job));
  }
}
