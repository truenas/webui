import { DestroyRef, Directive, inject } from '@angular/core';
import { TnTableComponent } from '@truenas/ui-components';

/**
 * Expands a `tn-table` row when the row itself is clicked (or activated from the
 * keyboard), not only when its chevron is.
 *
 * `tn-table` expands through the chevron alone; the `ix-table` the migrated
 * lists replaced expanded on a row click too. Applied as a directive rather than
 * copied into each list as a `viewChild(TnTableComponent)` plus a `(rowClick)`
 * handler, which was three identical lines in every expandable migrated table.
 *
 * Requires `[clickable]="true"` on the same table — that is what makes rows emit
 * `rowClick` at all — and takes effect only for rows the table considers
 * expandable, since `toggleRowExpansion` gates on that itself.
 */
@Directive({
  selector: 'tn-table[ixExpandOnRowClick]',
})
export class ExpandOnRowClickDirective<T> {
  constructor() {
    const table = inject<TnTableComponent<T>>(TnTableComponent);
    const destroyRef = inject(DestroyRef);

    // Unsubscribed explicitly rather than left to the emitter dying with the table
    // on this same node — that reasoning only holds while `rowClick` is an
    // `output()`, and this directive shouldn't depend on which it is.
    const subscription = table.rowClick.subscribe((row) => table.toggleRowExpansion(row));
    destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
