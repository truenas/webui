import { effect, Signal } from '@angular/core';
import { type TnSortEvent, type TnTableComponent } from '@truenas/ui-components';

/**
 * Workarounds for `tn-table` behaviour the library did not expose when a page was migrated.
 *
 * Kept in their own file rather than in `utils.ts` so the cleanup is a file deletion: every helper
 * here is marked `TEMP (NAS-141021)`, names the `@truenas/ui-components` input that replaced it,
 * and goes away with its last caller.
 */

/**
 * TEMP (NAS-141021): restores ix-table's single-expanded-row behavior on a `tn-table`, which
 * allows several rows open at once and exposes no single-expand input or row-expand output to
 * hook into — so we prune the library-owned `expandedRows` signal from an effect instead.
 *
 * OBSOLETE as of `@truenas/ui-components` 0.4.9, which added `[singleExpand]` — and binding it
 * is strictly better, since it collapses the older row before either paints rather than
 * correcting the state a frame later. `pages/vm` binds the input; the remaining callers
 * (datasets/snapshots, storage/disks, credentials/groups) still call this and should each drop
 * it on their own NAS-141021 child ticket, after which this helper goes with them.
 *
 * Tracking is by diff against the previous set (not a cached row reference) so a data reload,
 * which swaps in fresh row objects, can't leave a stale reference behind. After such a reload
 * no row is recognized, and "newest" falls back to insertion order.
 *
 * Must be called from an injection context (e.g. a component constructor).
 */
export function restrictToSingleExpandedRow<T>(table: Signal<TnTableComponent<T> | undefined>): void {
  let trackedTable: TnTableComponent<T> | undefined;
  let previousExpandedRows = new Set<unknown>();

  effect(() => {
    const instance = table();
    if (instance !== trackedTable) {
      // The table is destroyed and rebuilt whenever the list empties out (the empty state replaces
      // it in the template), so rows from the dead instance must not decide what the new one keeps.
      trackedTable = instance;
      previousExpandedRows = new Set();
    }
    if (!instance) {
      return;
    }
    const expanded = instance.expandedRows();
    if (expanded.size <= 1) {
      previousExpandedRows = new Set(expanded);
      return;
    }
    // `previousExpandedRows` holds at most one row and this branch only runs with two or more
    // expanded, so there is always at least one row we haven't seen — the fallback only keeps
    // the type non-optional.
    const newest = [...expanded].find((row) => !previousExpandedRows.has(row)) ?? [...expanded][0];
    const collapsed = new Set<unknown>([newest]);
    previousExpandedRows = collapsed;
    instance.expandedRows.set(collapsed);
  });
}

/**
 * TEMP (NAS-141021): keeps the sort arrow on whichever `tn-table` instance is currently mounted.
 * The data provider holds the sorting, but tn-table tracks its own header state and is destroyed
 * and rebuilt whenever the list empties out (the empty state replaces it in the template) — so
 * searching down to zero results and back leaves a fresh header with no arrow over rows that are
 * still sorted. Reflect the last `(sortChange)` into each new instance until the library grows a
 * two-way sort input to bind instead.
 *
 * OBSOLETE as of `@truenas/ui-components` 0.4.9, which made `sortColumn` / `sortDirection`
 * two-way bindable (`sortColumnChange` / `sortDirectionChange`), so a rebuilt table re-reads
 * them from the consumer. Each caller (storage/disks, system/bootenv, containers,
 * credentials/groups) should swap to `[(sortColumn)]` / `[(sortDirection)]` on its own
 * NAS-141021 child ticket, after which this helper goes with them.
 *
 * Must be called from an injection context (e.g. a component constructor).
 */
export function reflectSortIntoTable<T>(
  table: Signal<TnTableComponent<T> | undefined>,
  sort: Signal<TnSortEvent | null>,
): void {
  effect(() => {
    const instance = table();
    const activeSort = sort();
    if (!instance || !activeSort) {
      return;
    }
    instance.sortColumn.set(activeSort.column);
    instance.sortDirection.set(activeSort.direction);
  });
}
