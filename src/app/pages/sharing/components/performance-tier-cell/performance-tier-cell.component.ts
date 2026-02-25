import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { TierRewriteJobStatus } from 'app/enums/tier-rewrite-job-status.enum';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';

interface HasTier {
  tier?: SharingTierInfo | null;
}

@Component({
  selector: 'ix-performance-tier-cell',
  templateUrl: './performance-tier-cell.component.html',
  styleUrls: ['./performance-tier-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatButton,
    NgClass,
  ],
})
export class PerformanceTierCellComponent<T extends HasTier> extends ColumnComponent<T> {
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);

  protected tierLabel = computed(() => {
    const row = this.row();
    if (!row?.tier) {
      return '-';
    }
    switch (row.tier.tier_type) {
      case DatasetTier.Performance:
        return this.translate.instant('Performance');
      case DatasetTier.Regular:
        return this.translate.instant('Regular');
      default:
        return '-';
    }
  });

  protected tierJob = computed(() => {
    return this.row()?.tier?.tier_job ?? null;
  });

  protected jobStatusLabel = computed(() => {
    const job = this.tierJob();
    if (!job) return '';
    switch (job.status) {
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
  });

  protected jobStatusClass = computed(() => {
    const job = this.tierJob();
    if (!job) return '';
    switch (job.status) {
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
  });

  protected openMigrationDialog(event: MouseEvent): void {
    event.stopPropagation();
    const row = this.row();
    if (!row?.tier?.tier_job) return;

    this.matDialog.open(DataMigrationStatusDialogComponent, {
      data: {
        tierJob: row.tier.tier_job,
        tierType: row.tier.tier_type,
      },
    });
  }
}

export function performanceTierColumn<T extends HasTier>(
  options: Partial<PerformanceTierCellComponent<T>>,
): Column<T, PerformanceTierCellComponent<T>> {
  return { type: PerformanceTierCellComponent, cssClass: 'tier-cell', ...options };
}
