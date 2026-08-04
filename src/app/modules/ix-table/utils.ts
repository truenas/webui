import { isDevMode, isSignal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import type { TnSortEvent } from '@truenas/ui-components';
import { get } from 'lodash-es';
import { Observable, switchMap } from 'rxjs';
import { convertStringDiskSizeToBytes } from 'app/helpers/file-size.utils';
import type { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';
import { SortValue, TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';

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

/**
 * Builds the per-row test-id fragment a migrated tn-table cell passes to `[tnTestId]`.
 *
 * Pre-normalizes through {@link normalizeTestIdString} so the tag resolves identically through
 * the legacy `[ixTest]` directive and the library's `[tnTestId]` — see that helper for why the
 * two kebab implementations disagree.
 */
export function toUniqueRowTag(value: string): string {
  return normalizeTestIdString(convertStringToId(value));
}

/**
 * Wraps {@link toUniqueRowTag} in a per-row cache, for the template-side `[tnTestId]` of a
 * migrated tn-table.
 *
 * Every cell of every row calls its table's row-tag function on every change-detection pass, so
 * on a wide table that is (columns × rows) string rewrites per pass — and a list fed by a
 * websocket subscription runs a lot of passes. The tag is a pure function of the row, so cache
 * it against the row object; rows replaced by a reload drop out of the `WeakMap` on their own.
 *
 * @param build the raw, un-kebab-ed tag for a row, e.g. ``(vm) => `virtual-machine-${vm.name}` ``.
 */
export function memoizedRowTag<T extends object>(build: (row: T) => string): (row: T) => string {
  const cache = new WeakMap<T, string>();

  return (row: T) => {
    let tag = cache.get(row);
    if (tag === undefined) {
      tag = toUniqueRowTag(build(row));
      cache.set(row, tag);
    }
    return tag;
  };
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
   * Matched by `propertyName` across the whole model, hidden columns included, so the picker can
   * bring one back with its accessor intact. Two columns sharing a `propertyName` both resolve to
   * the first; give the loser a {@link sortAccessors} entry instead.
   *
   * A column here must resolve to something lodash can order — its `getValue` is typed `unknown`,
   * and an array or object sorts meaninglessly. Give such a column an explicit `sortBy` (which
   * wins over `getValue`); dev mode reports the column to the console either way.
   */
  columns?: Column<T, ColumnComponent<T>>[];

  /**
   * Accessors keyed by tn-table column name, for tables with no ix-table column model to hand
   * over (nothing drives a column picker) or whose accessor isn't expressible as one. Preferred
   * over hand-writing partial `Column` literals just to carry a `sortBy`. Takes precedence over
   * {@link columns} for a column present in both.
   */
  sortAccessors?: Record<string, (row: T) => SortValue>;
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
    ((row: T) => SortValue) | undefined;
  const sortBy = direction ? (accessors?.sortAccessors?.[event.column] ?? columnAccessor) : undefined;

  const columnIndex = displayedColumns.indexOf(event.column);
  return {
    propertyName: direction ? (event.column as keyof T) : null,
    sortBy: sortBy && guardSortValue(sortBy, event.column),
    direction,
    active: direction && columnIndex >= 0 ? columnIndex : null,
  };
}

/**
 * Guards what {@link TnSortAccessors.columns} can only document: a column's `getValue` is typed
 * `unknown`, so one rendering an array or object sorts arbitrarily with nothing on screen to
 * explain it. Sorts by its `String()` form instead — in every build, so dev and production order
 * the rows the same way — and, in dev only, names the column through `console.error` (a `warn`
 * gets lost). The report fires at most once per sort click, not once per column per session.
 */
function guardSortValue<T>(
  accessor: (row: T) => SortValue,
  column: string,
): (row: T) => SortValue {
  let reported = false;
  return (row: T) => {
    const value = accessor(row);
    if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) {
      return value;
    }
    if (!reported && isDevMode()) {
      reported = true;
      const kind = Array.isArray(value) ? 'an array' : `a ${typeof value}`;
      console.error(
        `[mapTnSortToTableSort] the sort accessor for column "${column}" resolved to ${kind}, which lodash `
        + 'sortBy can\'t order — sorting by its String() form instead, which is unlikely to be the order '
        + 'you want. Give the column an explicit `sortBy` returning a string, number or boolean.',
      );
    }
    return String(value);
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
