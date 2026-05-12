import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getTierJobStatusClass, getTierJobStatusLabel, isTierJobRunning,
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
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
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
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<DataMigrationStatusDialogComponent>);
  private dialogService = inject(DialogService);
  protected data = inject<DataMigrationStatusDialogData>(MAT_DIALOG_DATA);

  protected job: ZfsTierRewriteJobEntry = this.data.tierJob;
  protected progressPercent = 0;
  protected startTime: Date | null = null;
  protected finishedTime: Date | null = null;
  protected estimatedCompletion: Date | null = null;

  get isRunning(): boolean {
    return isTierJobRunning(this.job);
  }

  get statusLabel(): string {
    const label = getTierJobStatusLabel(this.job);
    return label ? this.translate.instant(label) : '';
  }

  get statusClass(): string {
    return getTierJobStatusClass(this.job);
  }

  get sourceTier(): string {
    return this.data.targetTier === DatasetTier.Performance
      ? this.translate.instant('Regular')
      : this.translate.instant('Performance');
  }

  get targetTierLabel(): string {
    return this.data.targetTier === DatasetTier.Performance
      ? this.translate.instant('Performance')
      : this.translate.instant('Regular');
  }

  ngOnInit(): void {
    this.updateProgress();
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

      this.api.call('zfs.tier.rewrite_job_cancel', [{ tier_job_id: this.job.tier_job_id }]).pipe(
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

    this.api.subscribe(`zfs.tier.rewrite_job_status:${JSON.stringify({ tier_job_id: tierJobId })}`).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (event) => {
        this.job = event.fields;
        this.updateProgress();
        this.cdr.markForCheck();
      },
    });
  }

  private updateProgress(): void {
    if (this.job?.stats) {
      this.startTime = new Date(this.job.stats.start_time * 1000);

      if (this.job.status === TierRewriteJobStatus.Complete) {
        this.finishedTime = new Date(this.job.stats.update_time * 1000);
      }

      if (this.job.stats.total_bytes > 0) {
        this.progressPercent = Math.round(
          (this.job.stats.count_bytes / this.job.stats.total_bytes) * 100,
        );

        this.estimatedCompletion = this.calculateEstimatedCompletion();
      }
    }
  }

  private calculateEstimatedCompletion(): Date | null {
    if (!this.startTime || !this.job?.stats || this.job.stats.count_bytes <= 0) {
      return null;
    }

    const now = this.job.stats.update_time * 1000;
    const elapsed = now - this.startTime.getTime();
    const fractionDone = this.job.stats.count_bytes / this.job.stats.total_bytes;
    const estimatedTotal = elapsed / fractionDone;
    return new Date(this.startTime.getTime() + estimatedTotal);
  }
}
