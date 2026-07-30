import {
  effect, isDevMode, isSignal, Signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import type { TnSortEvent, TnTableComponent } from '@truenas/ui-components';
import { get } from 'lodash-es';
import { Observable, switchMap } from 'rxjs';
import { convertStringDiskSizeToBytes } from 'app/helpers/file-size.utils';
import type { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';

export function convertStringToId(inputString: string): string {
  let result = inputString;

  if (!result || result.includes('undefined')) {
    result = result?.replace('undefined', '') || '';
  }

  return result
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[/,#.[\]@!$%^&*()+={}|\\:;"'<>?`~]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createTable<T>(
  columns: Column<T, ColumnComponent<T>>[],
  config?: { uniqueRowTag: (row: T) => string; ariaLabels: (row: T) => string[] },
): Column<T, ColumnComponent<T>>[] {
  // tn-table renders cells from the template and supplies its own row tags/aria
  // labels, so migrated tables build a column model for the picker without config.
  if (!config) {
    return columns;
  }
  return columns.map((column) => {
    const uniqueRowTag = (row: T): string => convertStringToId(config.uniqueRowTag(row));
    const ariaLabels = (row: T): string[] => config.ariaLabels(row);
    return {
      ...column,
      uniqueRowTag,
      ariaLabels,
    };
  });
}

/**
 * TEMP (NAS-141021): restores ix-table's single-expanded-row behavior on a `tn-table`, which
 * allows several rows open at once and exposes no single-expand input or row-expand output to
 * hook into — so we prune the library-owned `expandedRows` signal from an effect instead. Drop
 * this and bind the input once `@truenas/ui-components` grows a `[singleExpand]`.
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

/**
 * Optional sort *semantics* for a table whose cells don't all show their raw row value. Restores
 * what the previous ix-table head did: sort by a column's `sortBy` or, failing that, by its
 * rendered `getValue`, so a derived, formatted or translated cell keeps sorting by what the user
 * sees. Omit entirely when every column sorts correctly by its raw value at `propertyName`.
 */
export interface TnSortAccessors<T> {
  /**
   * The column model the table already keeps for its picker. A column missing from it sorts by
   * its raw value.
   *
   * Matched by `propertyName` against the tn-table column name, across the whole model rather
   * than only the visible columns — so hidden columns keep their accessors when the picker brings
   * them back. Two columns sharing a `propertyName` therefore both resolve to the first one; give
   * such a column a {@link sortAccessors} entry keyed by its tn-table column name instead.
   *
   * A sortable column listed here must resolve to a primitive: its `getValue` is typed `unknown`
   * and goes straight to lodash `sortBy`, so a column rendering an array or object would sort by
   * something meaningless. Give it an explicit `sortBy` (which wins over `getValue`) instead —
   * {@link mapTnSortToTableSort} asserts this in dev mode.
   */
  columns?: Column<T, ColumnComponent<T>>[];

  /**
   * Accessors keyed by tn-table column name, for tables with no ix-table column model to hand
   * over (nothing drives a column picker) or whose accessor isn't expressible as one. Preferred
   * over hand-writing partial `Column` literals just to carry a `sortBy`. Takes precedence over
   * {@link columns} for a column present in both.
   */
  sortAccessors?: Record<string, (row: T) => string | number>;
}

/**
 * Translates a tn-table `(sortChange)` event into the `TableSort` shape our data providers
 * expect. Shared so every tn-table migration maps sort state the same way.
 *
 * @param displayedColumns the list bound to the table's `[displayedColumns]`; `active` is
 *   resolved as the sorted column's index within it.
 * @param accessors see {@link TnSortAccessors} — only for tables with derived cells.
 */
export function mapTnSortToTableSort<T>(
  event: TnSortEvent,
  displayedColumns: string[],
  accessors?: TnSortAccessors<T>,
): TableSort<T> {
  let direction: SortDirection | null = null;
  if (event.direction === 'asc') {
    direction = SortDirection.Asc;
  } else if (event.direction === 'desc') {
    direction = SortDirection.Desc;
  }

  const sortedColumn = direction
    ? accessors?.columns?.find((column) => String(column.propertyName) === event.column)
    : undefined;
  const columnAccessor = (sortedColumn?.sortBy || sortedColumn?.getValue) as
    ((row: T) => string | number) | undefined;
  const sortBy = direction ? (accessors?.sortAccessors?.[event.column] ?? columnAccessor) : undefined;

  const columnIndex = displayedColumns.indexOf(event.column);
  return {
    propertyName: direction ? (event.column as keyof T) : null,
    sortBy: sortBy && isDevMode() ? assertPrimitiveAccessor(sortBy, event.column) : sortBy,
    direction,
    active: direction && columnIndex >= 0 ? columnIndex : null,
  };
}

/**
 * Dev-only wrapper enforcing what {@link TnSortAccessors.columns} can only document: a `getValue`
 * is typed `unknown`, so a column rendering an array or an object hands that straight to lodash
 * `sortBy` and the rows come back in an arbitrary order with nothing to see. Throws on the first
 * non-primitive, naming the column to fix — a `console.warn` is easy to miss among the noise, and
 * specs run in dev mode, so failing outright keeps the mistake from reaching a review at all. In
 * production the accessor is used unwrapped and the rows just sort arbitrarily, as they would
 * have anyway.
 */
function assertPrimitiveAccessor<T>(
  accessor: (row: T) => string | number,
  column: string,
): (row: T) => string | number {
  return (row: T) => {
    const value = accessor(row);
    if (value != null && typeof value !== 'string' && typeof value !== 'number') {
      const kind = Array.isArray(value) ? 'an array' : `a ${typeof value}`;
      throw new Error(
        `[mapTnSortToTableSort] the sort accessor for column "${column}" resolved to ${kind}, which lodash `
        + 'sortBy can\'t order — the rows would come back in an arbitrary order. Give the column an explicit '
        + '`sortBy` returning a string or number.',
      );
    }
    return value;
  };
}

/**
 * Bridges the ix-table column model driven by `<ix-table-columns-selector>` to
 * the `displayedColumns` list a `tn-table` expects. The selector toggles each
 * column's `hidden` flag (and persists visibility via `columnPreferencesKey`);
 * this maps the still-visible columns, in declaration order, to the
 * `*tnColumnDef` names a tn-table renders. Shared so every column-selectable
 * tn-table migration bridges the two models identically.
 *
 * A column's tn-table name is its `propertyName` — matching the `(sortChange)`
 * convention `mapTnSortToTableSort` relies on. Columns without a `propertyName`
 * (e.g. an actions column, which is also never user-toggleable since it has no
 * `title`) fall back to `'actions'`.
 */
export function toDisplayedColumns<T>(columns: Column<T, ColumnComponent<T>>[]): string[] {
  return columns
    .filter((column) => !column.hidden)
    .map((column) => (column.propertyName ? String(column.propertyName) : 'actions'));
}

function fromProvider<T, R>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
  select: (instance: BaseDataProvider<T>) => Observable<R>,
): Observable<R> {
  return isSignal(provider)
    ? toObservable(provider).pipe(switchMap((instance) => select(instance)))
    : select(provider);
}

/**
 * Adapts a data provider's paged rows into a signal for binding to a `tn-table`
 * `[dataSource]`. Replaces the `(dataProvider.currentPage$ | async) ?? []` idiom
 * so migrated cards follow the declarative-signal recipe. Accepts the provider
 * directly or as a signal (e.g. an `input.required` provider). Must be called
 * from an injection context (e.g. a component field initializer).
 */
export function dataProviderRows<T>(provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>): Signal<T[]> {
  return toSignal(fromProvider(provider, (instance) => instance.currentPage$), { initialValue: [] as T[] });
}

/**
 * Adapts a data provider's loading state into a signal for binding to a `tn-table`
 * `[loading]`. Accepts the provider directly or as a signal (e.g. an
 * `input.required` provider). Must be called from an injection context (e.g. a
 * component field initializer).
 */
export function dataProviderLoading<T>(provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>): Signal<boolean> {
  return toSignal(fromProvider(provider, (instance) => instance.isLoading$), { initialValue: false });
}

/**
 * Translates a tn-table `(sortChange)` event into the `TableSort` shape an
 * `AsyncDataProvider`/`ApiDataProvider` `setSorting()` expects, where sorting is
 * driven purely by `propertyName`/`direction` and `active` (column index) is
 * unused. Shared by the simple tn-table list migrations (docker images,
 * docker registries) so the empty-direction handling can't drift between them.
 */
export function mapTnSortToProviderSorting<T>(event: TnSortEvent): TableSort<T> {
  const direction = event.direction === '' ? null : (event.direction as SortDirection);
  return {
    propertyName: direction ? (event.column as keyof T) : null,
    direction,
    active: null,
  };
}

export function filterTableRows<T>(filter: TableFilter<T>): T[] {
  const {
    list = [], query = '', columnKeys = [], preprocessMap, exact = false,
  } = filter;

  const searchQuery = query.toLowerCase();
  return list.filter((item) => {
    return columnKeys.some((columnKey) => {
      let value = get(item, columnKey) as string | undefined;

      if ((columnKey as string) === 'size' && typeof value === 'number') {
        const margin = value * 0.05;
        const parsedQuerySize = convertStringDiskSizeToBytes(searchQuery) as number;

        return (value >= parsedQuerySize - margin && value <= parsedQuerySize + margin);
      }

      if (preprocessMap?.[columnKey]) {
        value = preprocessMap[columnKey]?.(value as T[keyof T]);
      }

      const valueString = value?.toString()?.toLowerCase();
      return exact ? valueString === searchQuery : valueString?.includes(searchQuery);
    });
  });
}
