import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';

/**
 * The cssClass the tier service uses to locate the tier column for un-hiding
 * when tiering is enabled. Exported so both producers (storageTierColumn) and
 * consumers (SharingTierService.enableTierColumn) share the same literal.
 */
export const tierColumnCssClass = 'tier-cell';

interface HasTier {
  tier?: SharingTierInfo | null;
}

interface StorageTierColumnOptions<T> {
  title?: string;
  headerTooltip?: string;
  hidden?: boolean;
  uniqueRowTag?: (row: T) => string;
  ariaLabels?: (row: T) => string[];
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

/**
 * Build a tier column. `cssClass` is fixed to tierColumnCssClass and cannot
 * be overridden — SharingTierService.enableTierColumn finds the column by that
 * exact class, so allowing callers to change it would silently break tiering.
 */
export function storageTierColumn<T extends HasTier>(
  options: StorageTierColumnOptions<T>,
): Column<T, StorageTierCellComponent<T>> {
  return { type: StorageTierCellComponent, cssClass: tierColumnCssClass, ...options };
}
