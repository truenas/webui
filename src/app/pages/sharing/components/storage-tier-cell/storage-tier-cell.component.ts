import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';
import {
  getTierJobIcon, getTierJobStatusClass, getTierJobStatusLabel,
} from 'app/pages/sharing/components/tier-status.utils';

interface HasTier {
  tier?: SharingTierInfo | null;
}

@Component({
  selector: 'ix-storage-tier-cell',
  templateUrl: './storage-tier-cell.component.html',
  styleUrls: ['./storage-tier-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnIconComponent,
    MatTooltip,
    NgClass,
  ],
})
export class StorageTierCellComponent<T extends HasTier> extends ColumnComponent<T> {
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
    return this.translate.instant(getTierJobStatusLabel(this.tierJob()));
  });

  protected jobIcon = computed(() => getTierJobIcon(this.tierJob()));

  protected jobStatusClass = computed(() => getTierJobStatusClass(this.tierJob()));

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

export function storageTierColumn<T extends HasTier>(
  options: Partial<StorageTierCellComponent<T>>,
): Column<T, StorageTierCellComponent<T>> {
  return { type: StorageTierCellComponent, cssClass: 'tier-cell', ...options };
}
