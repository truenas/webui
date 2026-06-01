import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getTierJobStatusClass, getTierJobStatusLabelKey, getTierLabelKey, isTierJobRunning,
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
    MatButton,
    MatProgressBar,
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
  private dialogRef = inject(DialogRef<unknown, DataMigrationStatusDialogComponent>);
  private dialogService = inject(DialogService);
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

  protected finishedTime = computed<Date | null>(() => {
    const job = this.job();
    if (job?.status === TierRewriteJobStatus.Complete && job.stats) {
      return new Date(job.stats.update_time * 1000);
    }
    return null;
  });

  protected progressPercent = computed(() => {
    const stats = this.job()?.stats;
    if (!stats || stats.total_bytes <= 0) return 0;
    return Math.round((stats.count_bytes / stats.total_bytes) * 100);
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
    if (!start || !job?.stats || job.stats.count_bytes <= 0 || job.stats.total_bytes <= 0) {
      return null;
    }
    const fractionDone = job.stats.count_bytes / job.stats.total_bytes;
    if (fractionDone < DataMigrationStatusDialogComponent.minFractionForEta) {
      return null;
    }
    const now = job.stats.update_time * 1000;
    const elapsed = now - start.getTime();
    const estimatedTotal = elapsed / fractionDone;
    return new Date(start.getTime() + estimatedTotal);
  });

  ngOnInit(): void {
    this.subscribeToJobUpdates();
  }

  protected onCancel(): void {
    this.dialogService.confirm({
      message: this.translate.instant('Are you sure you want to cancel this data migration? Data already transferred will remain at its destination.'),
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
    const tierJobId = this.data.tierJob.tier_job_id;

    // Topic format is contract'd with middleware: `zfs.tier.rewrite_job_status:<json-args>`,
    // where <json-args> is the JSON-stringified call args. tier_job_id is server-generated
    // and safe to embed without further escaping.
    this.api.subscribe(`zfs.tier.rewrite_job_status:${JSON.stringify({ tier_job_id: tierJobId })}`).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (event) => {
        this.job.set(event.fields);
      },
    });
  }
}
