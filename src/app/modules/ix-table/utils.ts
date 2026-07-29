import { effect, isSignal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TnTableComponent, type TnSortEvent } from '@truenas/ui-components';
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
 * TEMP (NAS-141021): restores the single-expanded-row behavior of the previous
 * ix-table on a `tn-table`, which allows several rows open at once and exposes no
 * single-expand input or row-expand output to hook into: whenever a second row
 * opens (via row click or the expand chevron) we collapse back to just the
 * newly-opened one.
 *
 * This reads and writes a library-owned signal (`expandedRows`) from an effect and
 * relies on it converging after the extra row is pruned. Once
 * `@truenas/ui-components` grows a `[singleExpand]` input (or a `(rowExpand)`
 * output we can intercept), drop this helper and bind that instead.
 *
 * We diff against the previous set rather than caching a single row reference,
 * so a data reload (which swaps in fresh row objects) can't leave a stale
 * reference behind — the set tracking stays consistent with whatever tn-table
 * currently holds. The one case where "newest" is approximate is such a reload:
 * every row in the set is then unknown to us, so we keep the set's first member
 * (insertion order) rather than the most recently opened one.
 *
 * Must be called from an injection context (e.g. a component constructor).
 */
export function restrictToSingleExpandedRow<T>(table: Signal<TnTableComponent<T> | undefined>): void {
  let previousExpandedRows = new Set<unknown>();

  effect(() => {
    const instance = table();
    if (!instance) {
      return;
    }
    const expanded = instance.expandedRows();
    if (expanded.size <= 1) {
      previousExpandedRows = new Set(expanded);
      return;
    }
    const newest = [...expanded].find((row) => !previousExpandedRows.has(row));
    const collapsed = newest ? new Set<unknown>([newest]) : new Set<unknown>();
    previousExpandedRows = collapsed;
    instance.expandedRows.set(collapsed);
  });
}

export interface TnSortMapping<T> {
  /**
   * The list bound to the table's `[displayedColumns]`. `active` is resolved as the
   * sorted column's index within it.
   */
  displayedColumns: string[];

  /**
   * Carries the sort *semantics* of the previous ix-table head, which sorted by a
   * column's `sortBy` or, failing that, by its rendered `getValue` rather than by the
   * raw row property — so a column showing a derived, formatted or translated value
   * keeps sorting by what the user sees. Pass the column model the table already keeps
   * for its picker, or a partial list naming only the columns that need an accessor;
   * a column missing from the list simply sorts by its raw value at `propertyName`.
   *
   * Required (rather than optional) so every table has to answer the question once:
   * pass `null` when every column sorts correctly by its raw value.
   */
  columns: Column<T, ColumnComponent<T>>[] | null;
}

/**
 * Translates a tn-table `(sortChange)` event into the `TableSort` shape our
 * data providers expect. Shared so every tn-table migration maps sort state the
 * same way. See {@link TnSortMapping} for what the two lists are for.
 */
export function mapTnSortToTableSort<T>(event: TnSortEvent, mapping: TnSortMapping<T>): TableSort<T> {
  let direction: SortDirection | null = null;
  if (event.direction === 'asc') {
    direction = SortDirection.Asc;
  } else if (event.direction === 'desc') {
    direction = SortDirection.Desc;
  }

  const sortedColumn = direction
    ? mapping.columns?.find((column) => String(column.propertyName) === event.column)
    : undefined;

  const columnIndex = mapping.displayedColumns.indexOf(event.column);
  return {
    propertyName: direction ? (event.column as keyof T) : null,
    sortBy: (sortedColumn?.sortBy || sortedColumn?.getValue) as ((row: T) => string | number) | undefined,
    direction,
    active: direction && columnIndex >= 0 ? columnIndex : null,
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
