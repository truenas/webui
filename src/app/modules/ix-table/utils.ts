import {
  computed, inject, isDevMode, isSignal, signal, Signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
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
 * Builds the per-row test-id fragment a migrated tn-table cell passes to `[tnTestId]`. The one
 * spelling of it — every migrated table calls this rather than composing the two helpers by
 * hand, so a change to how row tags are normalized lands everywhere at once.
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
 * The tables that call {@link toUniqueRowTag} directly are under the same pressure and can
 * graduate to this the moment it is worth measuring; they were left alone only because caching
 * against the row object assumes rows are replaced rather than mutated in place, which is worth
 * checking per data provider rather than in bulk.
 *
 * A list built on {@link tnTableListHost} has no reason to reach for this: its `rowTag` already
 * memoizes per row, and it keys the cache on (rows, language) rather than on the row object, so
 * it also survives a row mutated in place. It normalizes differently, though — lodash `kebabCase`
 * rather than {@link toUniqueRowTag} — so the two are not interchangeable mid-table.
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

/**
 * Dev-mode guard for a migrated tn-table's column model. The model no longer renders the visible
 * cells, so a missing `getValue` only shows up in the detail row and in sorting — both easy to
 * miss. Reports rather than throws: this catches a mis-declared column model, not a broken
 * invariant, and nothing a user does can trip it — white-screening the page in dev would be a
 * worse trade than a loud console error.
 */
function assertMigratedColumns<T>(columns: Column<T, ColumnComponent<T>>[]): void {
  // Checked on the RESOLVED names, so the single-unnamed case is caught too: one such column
  // resolves to 'actions', which collides with the name `appendedColumns: ['actions']` adds. That
  // duplicate in `displayedColumns` is the whole failure mode this guard exists for.
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const column of columns) {
    const name = tnColumnName(column);
    if (seen.has(name)) {
      duplicates.add(name);
    }
    seen.add(name);
  }
  if (duplicates.size) {
    console.error(
      `[createTable] columns resolve to duplicate tn-table names: ${[...duplicates].join(', ')}. `
      + 'Each column needs its own `propertyName` or `columnName` — a column with neither falls '
      + 'back to "actions", which also collides with an appended actions column.',
    );
  }

  const valueless = columns.find((column) => column.columnName && !column.propertyName && !column.getValue);
  if (valueless) {
    console.error(
      `[createTable] column "${valueless.title}" ("${valueless.columnName}") has no \`propertyName\`, `
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

/**
 * What a column's sort accessor may return. Wider than what `BaseDataProvider.sort()` ultimately
 * orders by, because the accessors are usually the cell's own `getValue` — which returns whatever
 * the cell renders, including a `Date` or nothing at all for a row with no value.
 * {@link normalizeSortValue} narrows it before the provider sees it.
 */
export type RowSortValue<T> = (row: T) => string | number | Date | null | undefined;

/**
 * Narrows what an accessor returns into something lodash `sortBy` orders meaningfully:
 *
 * - a `Date` becomes its epoch — ordering the formatted string instead would sort by weekday name;
 * - a missing value becomes `''`, so rows without one group together rather than ordering
 *   arbitrarily against real values.
 *
 * Applied to every accessor this module hands over, so a column config can return the natural
 * value (`row.job?.time_finished?.$date`, a `Date` from a scheduler) without hand-writing a
 * `?? 0` / `+date` coercion at each site. Anything still unorderable after this is caught by
 * {@link guardSortValue}.
 */
function normalizeSortValue<T>(accessor: RowSortValue<T>): (row: T) => SortValue {
  return (row: T) => {
    const value = accessor(row);
    if (value instanceof Date) {
      return value.getTime();
    }
    return value ?? '';
  };
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
 * The accessor a data provider should sort a column by: its `sortBy`, else the value it renders.
 *
 * `getValue` wins over `propertyName` — the precedence `ix-table-head` applied to every column
 * before the migration. A column declaring both renders something the raw property doesn't say
 * (a crontab built from a `schedule` object, a credential's name pulled off a nested record, a
 * UI-only field the API never populates), so ordering by the property would sort by a value that
 * is nowhere on screen — or, when the property holds an object, by nothing meaningful at all.
 *
 * A column that means the opposite — a hidden sort key it deliberately orders by, e.g. Cloud Sync's
 * `*_sort_key` timestamps behind human-readable cells — says so with an explicit `sortBy`.
 */
function columnSortBy<T>(column: Column<T, ColumnComponent<T>> | undefined): RowSortValue<T> | undefined {
  return (column?.sortBy ?? column?.getValue) as RowSortValue<T> | undefined;
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
  /** Translated title for `[emptyMessage]`. See `EmptyService.titleForType`. */
  message: Signal<string>;
  /** Translated body copy for `[emptyDescription]`. See `EmptyService.descriptionForType`. */
  description: Signal<string>;
  /** Icon marker for `[emptyIcon]`. */
  icon: Signal<string>;
  /** Row count of the current page, for gating a page-level empty state. */
  count: Signal<number>;
}

/**
 * A tn-table's empty-state bindings, derived from its data provider. Must be
 * called from an injection context.
 *
 * Both halves of the config survive: `title` goes to `[emptyMessage]` and `message` to
 * `[emptyDescription]`, which `@truenas/ui-components` 0.4.9 added — before it, the second
 * line ix-table rendered on the no-search-results state had nowhere to go.
 */
export function dataProviderEmptyState<T>(
  provider: BaseDataProvider<T> | Signal<BaseDataProvider<T>>,
): TableEmptyState {
  const emptyService = inject(EmptyService);

  const type = toSignal(fromProvider(provider, (instance) => instance.emptyType$), {
    initialValue: EmptyType.Loading,
  });

  return {
    type,
    // Both resolve their own language dependency, so no `langChangeSignal()` here.
    message: computed(() => emptyService.titleForType(type())),
    description: computed(() => emptyService.descriptionForType(type())),
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
  /**
   * Translated loading text, for `[loadingMessage]`.
   *
   * `tn-table` defaults that input to a bare English literal — the library takes no i18n
   * dependency, so it can only ship the untranslated default and expects the app to pass a
   * translated one. Resolved here, out of the same `EmptyService` catalog that supplies
   * {@link empty}'s message, rather than written out as `'Loading...' | translate` in each
   * template: webui already carries two spellings of that string (`Loading...` and `Loading…`)
   * which translate differently, and every fresh copy is a chance to add a third.
   */
  readonly loadingMessage: Signal<string>;
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
  /**
   * Accepts a factory so the model can be rebuilt when the language changes: column titles are
   * resolved eagerly (`translate.instant`), so a model built once freezes the picker's and detail
   * row's labels in the initial locale while the visible headers — which read the title signal
   * from the template — follow along. Called inside a `computed`, so reading a `translated()`
   * signal in it is what makes the rebuild happen. Visibility survives the rebuild (see below).
   */
  columns: () => Column<T, ColumnComponent<T>>[];
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
  const emptyService = inject(EmptyService);

  const loadingMessage = computed(() => emptyService.titleForType(EmptyType.Loading));

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
    loadingMessage,
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
      // Resolve the accessor here and hand it over as a `sortAccessors` entry rather than passing
      // `columns` for `mapTnSortToTableSort` to look up itself: that lookup matches only on
      // `propertyName`, so a column keyed by `columnName` (a derived cell, with nothing on the row
      // to order by) would find no accessor and silently stop sorting. See {@link columnSortBy}.
      const sortBy = sortByFor(event.column);
      instance.setSorting(mapTnSortToTableSort<T>(
        event,
        displayedColumns(),
        sortBy ? { sortAccessors: { [event.column]: normalizeSortValue(sortBy) } } : undefined,
      ));
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

  const buildColumns = config.columns;
  const appendedColumns = config.appendedColumns ?? [];

  // The picker's choices are held as visibility BY COLUMN NAME rather than as the column array
  // itself, so rebuilding the model on a language change can't discard what the user hid.
  const hiddenByName = signal<ReadonlyMap<string, boolean>>(new Map());

  const columns = computed(() => {
    const overrides = hiddenByName();
    return buildColumns().map((column) => (
      overrides.has(tnColumnName(column))
        ? { ...column, hidden: overrides.get(tnColumnName(column)) }
        : column
    ));
  });

  return {
    ...withSorting(
      computed(() => [...toDisplayedColumns(columns()), ...appendedColumns]),
      (columnName) => columnSortBy(columns().find((column) => tnColumnName(column) === columnName)),
    ),
    columns,
    hiddenColumns: computed(() => columns().filter((column) => column?.hidden)),
    columnsChange: (next: Column<T, ColumnComponent<T>>[]) => {
      hiddenByName.set(new Map(next.map((column) => [tnColumnName(column), Boolean(column.hidden)])));
    },
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
