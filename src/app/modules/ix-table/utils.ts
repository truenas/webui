import {
  computed, inject, isSignal, signal, Signal,
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
 * Translates a tn-table `(sortChange)` event into the `TableSort` shape our
 * data providers expect. `active` is the index of the sorted column within the
 * displayed column list (or `null` when sorting is cleared). Shared so every
 * tn-table migration maps sort state the same way.
 */
export function mapTnSortToTableSort<T>(
  event: TnSortEvent,
  displayedColumns: string[],
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
 * convention `mapTnSortToTableSort` relies on, which casts the name back to a
 * property key. A computed column with no `propertyName` (a state pill, a
 * derived "Last Run") must declare an explicit `columnName`. Deriving one from
 * `title` is not an option: titles are already translated, so the derived name
 * would stop matching the template's hard-coded `[tnColumnDef]` in every
 * non-English locale. Only a column with neither falls back to `'actions'`.
 */
export function toDisplayedColumns<T>(columns: Column<T, ColumnComponent<T>>[]): string[] {
  return columns
    .filter((column) => !column.hidden)
    .map((column) => {
      if (column.propertyName) {
        return String(column.propertyName);
      }
      return column.columnName || 'actions';
    });
}

/**
 * Builds the test id for a detail-row action button from the row values that
 * identified it under the legacy `[ixTest]` directive.
 *
 * Pre-splits with lodash `kebabCase`: it breaks letter–digit boundaries
 * ('esxi1' → 'esxi-1') while the library's kebab does not, so the id the
 * library composes matches what `[ixTest]` used to resolve to. Shared so the
 * migrated detail rows can't drift apart on this.
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
 * Derives a tn-table's empty-state bindings from a data provider. Replaces the
 * `@let emptyType = dataProvider.emptyType$ | async` + `emptyService.…(emptyType)`
 * block each migrated list would otherwise copy into its template, which also
 * keeps those service calls out of the change-detection path. Must be called
 * from an injection context (e.g. a component field initializer).
 *
 * Note: only `EmptyConfig.title` survives — `tn-table` has no input for the
 * config's `message`, so the second translated line ix-table rendered on the
 * no-search-results state is not shown. Tracked under "Migration follow-ups" in
 * TRUENAS_UI_INTEGRATION.md.
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
   * Memoizes a per-row derivation. A migrated table calls these from the
   * template — once per cell, again on every change-detection pass — so a wide
   * row can ask for the same tag or label a dozen times.
   *
   * The cache is discarded whenever the loaded rows or the active language
   * change, so a reload, a re-filter, a page change or a locale switch all
   * re-derive; within one set of rows it is keyed by row identity in a
   * `WeakMap`. What it cannot see is a row mutated in place without the provider
   * re-emitting (a job subscription writing `row.state`), so derive from the
   * row's identity — description, path, dataset, schedule — and not from
   * live job state. Anything that depends on the clock (a "next run" countdown)
   * must stay uncached too, or it freezes at its first render.
   *
   * Reach for it where the derivation is more than a field read — parsing a
   * crontab, composing and translating a label, kebab-casing a test-id tag. A
   * plain method is the right call for a ternary over two properties; the
   * `WeakMap` lookup would cost more than re-deriving it.
   */
  perRow<R>(derive: (row: T) => R): (row: T) => R;
  /**
   * Builds a row's unique test-id tag from the base string that identified it
   * under the legacy `[ixTest]` directive, memoized through `perRow`.
   *
   * Pre-splits with lodash `kebabCase` for the same reason `detailActionTestId`
   * does: it breaks letter–digit boundaries ('task1' → 'task-1') while the
   * library's kebab does not, so the tag resolves identically through the legacy
   * `[ixTest]` directive and the library `[tnTestId]` directive.
   */
  rowTag(base: (row: T) => string): (row: T) => string;
}

/**
 * A {@link TnTableListHost} whose columns are driven by
 * `<ix-table-column-picker>`.
 */
export interface TnTableListPickerHost<T extends object> extends TnTableListHost<T> {
  /**
   * ix-table column model retained purely to drive `<ix-table-column-picker>`
   * (visibility + saved prefs) and the hidden-column list rendered in the detail
   * row; tn-table renders cells from the template and derives its
   * `displayedColumns` from these via {@link toDisplayedColumns}.
   */
  readonly columns: Signal<Column<T, ColumnComponent<T>>[]>;
  /** For `<ix-table-details-row [hiddenColumns]>`. */
  readonly hiddenColumns: Signal<Column<T, ColumnComponent<T>>[]>;
  /** For `<ix-table-column-picker (columnsChange)>`. */
  columnsChange(columns: Column<T, ColumnComponent<T>>[]): void;
}

/** Columns of a table whose column set is fixed. */
export interface FixedColumnsConfig {
  displayedColumns: string[];
}

/** Columns of a table whose column set is driven by `<ix-table-column-picker>`. */
export interface PickerColumnsConfig<T> {
  columns: Column<T, ColumnComponent<T>>[];
  /**
   * Column names appended after the picker's, for columns rendered from the
   * template that the picker must never offer — an actions column, say, which
   * has no cell component behind it and would misdescribe the table if modelled.
   */
  appendedColumns?: string[];
}

/**
 * Builds the bindings a page-level `tn-table` list needs from its data provider,
 * so a migrated list declares what is specific to it (its columns, its actions,
 * its row tag) and nothing else.
 *
 * Must be called from an injection context (e.g. a component field initializer).
 * Accepts the provider directly or as a signal (e.g. an `input.required`
 * provider).
 *
 * @example
 * protected readonly list = tnTableListHost(this.dataProvider, { columns: [...] });
 * protected readonly uniqueRowTag = this.list.rowTag((row) => 'rsync-task-' + row.path);
 */
export function tnTableListHost<T extends object>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
  config: FixedColumnsConfig,
): TnTableListHost<T>;
export function tnTableListHost<T extends object>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
  config: PickerColumnsConfig<T>,
): TnTableListPickerHost<T>;
export function tnTableListHost<T extends object>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
  config: FixedColumnsConfig | PickerColumnsConfig<T>,
): TnTableListHost<T> | TnTableListPickerHost<T> {
  const rows = dataProviderRows(provider);
  const isLoading = dataProviderLoading(provider);
  const empty = dataProviderEmptyState(provider);
  const lang = langChangeSignal();

  function perRow<R>(derive: (row: T) => R): (row: T) => R {
    // A fresh cache per (rows, language) rather than one that lives for the
    // component's lifetime, so invalidation is structural instead of a promise
    // the caller has to keep.
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

  const withSorting = (displayedColumns: Signal<string[]>): TnTableListHost<T> => ({
    ...base,
    displayedColumns,
    onSortChange: (event: TnSortEvent) => {
      const instance = isSignal(provider) ? provider() : provider;
      instance.setSorting(mapTnSortToTableSort<T>(event, displayedColumns()));
    },
  });

  if (!('columns' in config)) {
    return withSorting(signal(config.displayedColumns).asReadonly());
  }

  const columns = signal(config.columns);
  const appendedColumns = config.appendedColumns ?? [];

  return {
    ...withSorting(computed(() => [...toDisplayedColumns(columns()), ...appendedColumns])),
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
