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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface DataMigrationStatusDialogData {
  tierJob: ZfsTierRewriteJobEntry;
  tierType: DatasetTier;
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

  protected job: ZfsTierRewriteJobEntry;
  protected progressPercent = 0;
  protected startTime: Date | null = null;
  protected estimatedCompletion: Date | null = null;

  get isRunning(): boolean {
    return this.job?.status === TierRewriteJobStatus.Running
      || this.job?.status === TierRewriteJobStatus.Queued;
  }

  get statusLabel(): string {
    switch (this.job?.status) {
      case TierRewriteJobStatus.Complete:
        return this.translate.instant('Complete');
      case TierRewriteJobStatus.Running:
        return this.translate.instant('Running');
      case TierRewriteJobStatus.Queued:
        return this.translate.instant('Queued');
      case TierRewriteJobStatus.Error:
        return this.translate.instant('Error');
      case TierRewriteJobStatus.Cancelled:
        return this.translate.instant('Cancelled');
      case TierRewriteJobStatus.Stopped:
        return this.translate.instant('Stopped');
      default:
        return '';
    }
  }

  get statusClass(): string {
    switch (this.job?.status) {
      case TierRewriteJobStatus.Complete:
        return 'fn-theme-green';
      case TierRewriteJobStatus.Running:
        return 'fn-theme-orange';
      case TierRewriteJobStatus.Queued:
        return 'fn-theme-primary';
      case TierRewriteJobStatus.Error:
        return 'fn-theme-red';
      case TierRewriteJobStatus.Cancelled:
      case TierRewriteJobStatus.Stopped:
        return 'fn-theme-grey';
      default:
        return '';
    }
  }

  get sourceTier(): string {
    return this.data.tierType === DatasetTier.Performance
      ? this.translate.instant('Regular')
      : this.translate.instant('Performance');
  }

  get targetTier(): string {
    return this.data.tierType === DatasetTier.Performance
      ? this.translate.instant('Performance')
      : this.translate.instant('Regular');
  }

  ngOnInit(): void {
    this.job = this.data.tierJob;
    this.loadJobDetails();
  }

  protected onAbort(): void {
    this.dialogService.confirm({
      message: this.translate.instant('Are you sure you want to abort this data migration? Data already transferred will remain at its destination.'),
      buttonText: this.translate.instant('Abort'),
      buttonColor: 'warn',
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((confirmed) => {
      if (!confirmed) return;

      this.api.call('zfs.tier.rewrite_job_abort', [this.job.tier_job_id]).pipe(
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

  private loadJobDetails(): void {
    this.api.call('zfs.tier.rewrite_job_status', [this.data.tierJob.tier_job_id]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (job) => {
        this.job = job;
        this.updateProgress();
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private updateProgress(): void {
    if (this.job?.stats) {
      this.startTime = new Date(this.job.stats.start_time * 1000);

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
