import {
  computed, inject, isDevMode, isSignal, signal, Signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { type TnSortEvent } from '@truenas/ui-components';
import { get, kebabCase } from 'lodash-es';
import { Observable, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { convertStringDiskSizeToBytes } from 'app/helpers/file-size.utils';
import { langChangeSignal } from 'app/helpers/translated.helper';
import { EmptyService } from 'app/modules/empty/empty.service';
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

/**
 * Dev-mode guard for a migrated tn-table's column model. The model no longer
 * renders the visible cells, so a missing `getValue` only shows up in the detail
 * row and in sorting — both easy to miss.
 */
function assertMigratedColumns<T>(columns: Column<T, ColumnComponent<T>>[]): void {
  const unnamed = columns.filter((column) => !column.propertyName && !column.columnName);
  if (unnamed.length > 1) {
    throw new Error(
      'createTable: columns '
      + `${unnamed.map((column) => JSON.stringify(column.title)).join(', ')} declare neither `
      + '`propertyName` nor `columnName`, so they all resolve to the `actions` column name.',
    );
  }

  const valueless = columns.find((column) => column.columnName && !column.propertyName && !column.getValue);
  if (valueless) {
    throw new Error(
      `createTable: column "${valueless.title}" ("${valueless.columnName}") has no \`propertyName\`, `
      + 'so it must declare `getValue` — that is what the detail row renders and what sorting uses.',
    );
  }
}

export function createTable<T>(
  columns: Column<T, ColumnComponent<T>>[],
  config?: { uniqueRowTag: (row: T) => string; ariaLabels: (row: T) => string[] },
): Column<T, ColumnComponent<T>>[] {
  // tn-table renders cells from the template and supplies its own row tags/aria
  // labels, so migrated tables build a column model for the picker without config.
  if (!config) {
    if (isDevMode()) {
      assertMigratedColumns(columns);
    }
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

/** What `BaseDataProvider.sort()` accepts as a `sortBy` accessor. */
export type RowSortValue<T> = (row: T) => string | number;

/**
 * Translates a tn-table `(sortChange)` event into the `TableSort` shape our
 * data providers expect. `active` is the index of the sorted column within the
 * displayed column list (or `null` when sorting is cleared). Shared so every
 * tn-table migration maps sort state the same way.
 *
 * `sortBy` takes precedence over `propertyName` in `BaseDataProvider.sort()`,
 * and is how a derived column (a state pill, a "Last Run" read off a job) stays
 * sortable — it has no row property to order by.
 */
export function mapTnSortToTableSort<T>(
  event: TnSortEvent,
  displayedColumns: string[],
  sortBy?: RowSortValue<T>,
): TableSort<T> {
  let direction: SortDirection | null = null;
  if (event.direction === 'asc') {
    direction = SortDirection.Asc;
  } else if (event.direction === 'desc') {
    direction = SortDirection.Desc;
  }

  const columnIndex = displayedColumns.indexOf(event.column);
  return {
    propertyName: direction ? (event.column as keyof T) : null,
    sortBy: direction ? sortBy : undefined,
    direction,
    active: direction && columnIndex >= 0 ? columnIndex : null,
  };
}

/**
 * Bridges the ix-table column model driven by `<ix-table-column-picker>` to the
 * `displayedColumns` list a `tn-table` expects, mapping the still-visible
 * columns in declaration order to the `[tnColumnDef]` names in the template.
 *
 * A column's tn-table name is its `propertyName`; a computed column must
 * declare an explicit `columnName`. Deriving one from `title` is not an option —
 * titles are translated, so the derived name would stop matching the template's
 * hard-coded `[tnColumnDef]` in every non-English locale.
 */
export function toDisplayedColumns<T>(columns: Column<T, ColumnComponent<T>>[]): string[] {
  return columns.filter((column) => !column.hidden).map(tnColumnName);
}

function tnColumnName<T>(column: Column<T, ColumnComponent<T>>): string {
  if (column.propertyName) {
    return String(column.propertyName);
  }
  return column.columnName || 'actions';
}

/**
 * The accessor a data provider should sort a column by. A column keyed by
 * `columnName` has no row property to order on, so it sorts by the value it
 * renders — which is what `ix-table` did for every column before the migration.
 */
function columnSortBy<T>(column: Column<T, ColumnComponent<T>> | undefined): RowSortValue<T> | undefined {
  if (column?.sortBy) {
    return column.sortBy;
  }
  if (column?.propertyName) {
    return undefined;
  }
  return column?.getValue as RowSortValue<T> | undefined;
}

/**
 * Builds the test id for a detail-row action button. Pre-splits with lodash
 * `kebabCase`: it breaks letter–digit boundaries ('esxi1' → 'esxi-1') while the
 * library's kebab does not, so the id matches what `[ixTest]` used to resolve to.
 */
export function detailActionTestId(parts: (string | number | undefined)[], action: string): string {
  return kebabCase([...parts, action].join('-'));
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
 * A data provider's paged rows as a signal, for `[dataSource]`. Accepts the
 * provider directly or as a signal (e.g. an `input.required` provider). Must be
 * called from an injection context.
 */
export function dataProviderRows<T>(provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>): Signal<T[]> {
  return toSignal(fromProvider(provider, (instance) => instance.currentPage$), { initialValue: [] as T[] });
}

/** A data provider's loading state as a signal, for `[loading]`. */
export function dataProviderLoading<T>(provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>): Signal<boolean> {
  return toSignal(fromProvider(provider, (instance) => instance.isLoading$), { initialValue: false });
}

/**
 * The empty-state bindings a `tn-table` needs, derived from its data provider.
 */
export interface TableEmptyState {
  /** Current empty type — also drives page-level "first use" empty states. */
  type: Signal<EmptyType>;
  /** Translated title for `[emptyMessage]`. */
  message: Signal<string>;
  /** Icon marker for `[emptyIcon]`. */
  icon: Signal<string>;
  /** Row count of the current page, for gating a page-level empty state. */
  count: Signal<number>;
}

/**
 * A tn-table's empty-state bindings, derived from its data provider. Must be
 * called from an injection context.
 *
 * Only `EmptyConfig.title` survives — `tn-table` has no input for the config's
 * `message`, so the second line ix-table rendered on the no-search-results state
 * is dropped. Tracked under "Migration follow-ups" in TRUENAS_UI_INTEGRATION.md.
 */
export function dataProviderEmptyState<T>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
): TableEmptyState {
  const emptyService = inject(EmptyService);
  const translate = inject(TranslateService);

  const type = toSignal(fromProvider(provider, (instance) => instance.emptyType$), {
    initialValue: EmptyType.Loading,
  });

  // Keyed into `message` below so it re-translates on a language change, the way the
  // `| translate` bindings around it do — `instant()` alone would freeze the first locale.
  const lang = langChangeSignal();

  return {
    type,
    message: computed(() => {
      lang();
      // `defaultEmptyConfig` always resolves to a config (it has a `default:` branch),
      // but `title` is optional on EmptyConfig.
      const title = emptyService.defaultEmptyConfig(type()).title;
      return title ? translate.instant(title) : '';
    }),
    icon: computed(() => emptyService.iconForType(type())),
    count: toSignal(fromProvider(provider, (instance) => instance.currentPageCount$), { initialValue: 0 }),
  };
}

/**
 * Everything a page-level `tn-table` list binds that is the same on every one of
 * them. See {@link tnTableListHost}.
 */
export interface TnTableListHost<T extends object> {
  /** Current page of rows, for `[dataSource]`. */
  readonly rows: Signal<T[]>;
  /** For `[loading]`. */
  readonly isLoading: Signal<boolean>;
  /** For `[emptyMessage]`/`[emptyIcon]` and the page-level empty state. */
  readonly empty: TableEmptyState;
  /** For `[displayedColumns]`. */
  readonly displayedColumns: Signal<string[]>;
  /** For `(sortChange)`. */
  onSortChange(event: TnSortEvent): void;
  /**
   * Memoizes a per-row derivation that a template calls once per cell on every
   * change-detection pass — parsing a crontab, composing a translated label.
   *
   * Cached by row identity, discarded when the rows or the language change. It
   * cannot see a row mutated in place (a job subscription writing `row.state`)
   * or anything clock-dependent, so derive only from the row's identity.
   */
  perRow<R>(derive: (row: T) => R): (row: T) => R;
  /**
   * A row's unique test-id tag, memoized through `perRow`. Pre-splits with
   * lodash `kebabCase` for the same reason `detailActionTestId` does.
   */
  rowTag(base: (row: T) => string): (row: T) => string;
}

/**
 * A {@link TnTableListHost} whose columns are driven by
 * `<ix-table-column-picker>`.
 */
export interface TnTableListPickerHost<T extends object> extends TnTableListHost<T> {
  /**
   * ix-table column model retained to drive `<ix-table-column-picker>`, the
   * detail row's hidden columns and sorting; tn-table renders the cells itself.
   */
  readonly columns: Signal<Column<T, ColumnComponent<T>>[]>;
  /** For `<ix-table-details-row [hiddenColumns]>`. */
  readonly hiddenColumns: Signal<Column<T, ColumnComponent<T>>[]>;
  /** For `<ix-table-column-picker (columnsChange)>`. */
  columnsChange(columns: Column<T, ColumnComponent<T>>[]): void;
}

/**
 * A fixed column that needs an explicit sort accessor: its `[tnColumnDef]` name
 * matches no row property, so there is nothing for the provider to order by.
 */
export interface FixedColumn<T> {
  name: string;
  sortBy: RowSortValue<T>;
}

/** Columns of a table whose column set is fixed. */
export interface FixedColumnsConfig<T> {
  displayedColumns: (string | FixedColumn<T>)[];
}

/** Columns of a table whose column set is driven by `<ix-table-column-picker>`. */
export interface PickerColumnsConfig<T> {
  columns: Column<T, ColumnComponent<T>>[];
  /**
   * Column names appended after the picker's, for columns the picker must never
   * offer — an actions column, which has no cell component behind it.
   */
  appendedColumns?: string[];
}

/**
 * Builds the bindings a page-level `tn-table` list needs from its data provider,
 * so a migrated list declares only what is specific to it.
 *
 * Must be called from an injection context. Accepts the provider directly or as
 * a signal (e.g. an `input.required` provider).
 *
 * @example
 * protected readonly list = tnTableListHost(this.dataProvider, { columns: [...] });
 * protected readonly uniqueRowTag = this.list.rowTag((row) => 'rsync-task-' + row.path);
 */
export function tnTableListHost<T extends object>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
  config: FixedColumnsConfig<T>,
): TnTableListHost<T>;
export function tnTableListHost<T extends object>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
  config: PickerColumnsConfig<T>,
): TnTableListPickerHost<T>;
export function tnTableListHost<T extends object>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
  config: FixedColumnsConfig<T> | PickerColumnsConfig<T>,
): TnTableListHost<T> | TnTableListPickerHost<T> {
  const rows = dataProviderRows(provider);
  const isLoading = dataProviderLoading(provider);
  const empty = dataProviderEmptyState(provider);
  const lang = langChangeSignal();

  function perRow<R>(derive: (row: T) => R): (row: T) => R {
    // A fresh cache per (rows, language), so invalidation is structural.
    const cache = computed(() => {
      rows();
      lang();
      return new WeakMap<T, R>();
    });

    return (row: T): R => {
      const memo = cache();
      if (!memo.has(row)) {
        memo.set(row, derive(row));
      }
      return memo.get(row) as R;
    };
  }

  const base = {
    rows,
    isLoading,
    empty,
    perRow,
    rowTag: (tagBase: (row: T) => string) => perRow((row: T) => kebabCase(convertStringToId(tagBase(row)))),
  };

  const withSorting = (
    displayedColumns: Signal<string[]>,
    sortByFor: (columnName: string) => RowSortValue<T> | undefined,
  ): TnTableListHost<T> => ({
    ...base,
    displayedColumns,
    onSortChange: (event: TnSortEvent) => {
      const instance = isSignal(provider) ? provider() : provider;
      instance.setSorting(mapTnSortToTableSort<T>(event, displayedColumns(), sortByFor(event.column)));
    },
  });

  if (!('columns' in config)) {
    const fixed = config.displayedColumns.map((column) => (
      typeof column === 'string' ? { name: column, sortBy: undefined } : column
    ));
    const sortByName = new Map(fixed.map((column) => [column.name, column.sortBy]));
    return withSorting(
      signal(fixed.map((column) => column.name)).asReadonly(),
      (columnName) => sortByName.get(columnName),
    );
  }

  const columns = signal(config.columns);
  const appendedColumns = config.appendedColumns ?? [];

  return {
    ...withSorting(
      computed(() => [...toDisplayedColumns(columns()), ...appendedColumns]),
      (columnName) => columnSortBy(columns().find((column) => tnColumnName(column) === columnName)),
    ),
    columns: columns.asReadonly(),
    hiddenColumns: computed(() => columns().filter((column) => column?.hidden)),
    // The picker hands back the same array it was given with `hidden` flipped, so
    // copy it — the signal would otherwise compare equal and not notify.
    columnsChange: (next: Column<T, ColumnComponent<T>>[]) => columns.set([...next]),
  };
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
