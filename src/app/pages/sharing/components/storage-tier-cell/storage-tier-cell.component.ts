import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';

interface HasTier {
  tier?: SharingTierInfo | null;
}

@Component({
  selector: 'ix-storage-tier-cell',
  templateUrl: './storage-tier-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TierStatusComponent,
  ],
})
export class StorageTierCellComponent<T extends HasTier> extends ColumnComponent<T> {
  protected tier = computed(() => this.row()?.tier);
}

export function storageTierColumn<T extends HasTier>(
  options: Partial<StorageTierCellComponent<T>>,
): Column<T, StorageTierCellComponent<T>> {
  return { type: StorageTierCellComponent, cssClass: 'tier-cell', ...options };
}
