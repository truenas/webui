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
import { normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';
import type { BaseDataProvider } from 'app/modules/tn-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';
import { TableFilter } from 'app/modules/tn-table/interfaces/table-filter.interface';
import { SortValue, TableSort } from 'app/modules/tn-table/interfaces/table-sort.interface';

/**
 * Helpers around `tn-table`: the column model ({@link createTable}), data-provider adapters, row-tag
 * helpers and `tnTableListHost`. Build row tags from fields that identify the row, never ones that
 * change on screen (job state, counters, edited values): the tag is an e2e contract. Tags kept
 * verbatim from `ix-table` for Release Engineering (e.g. `cron-list`) say so where declared.
 */

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
 * Pre-normalizes through {@link normalizeTestIdString} so the tag matches the id the list
 * already had before it moved to `[tnTestId]` — see that helper for why the two kebab
 * implementations disagree.
 */
export function toUniqueRowTag(value: string): string {
  return normalizeTestIdString(convertStringToId(value));
}

/**
 * {@link toUniqueRowTag} cached per row object, for a tn-table's `[tnTestId]`: every cell recomputes
 * its row tag on every change-detection pass. The cache assumes rows are replaced, not mutated in
 * place. {@link tnTableListHost}'s `rowTag` memoizes on (rows, language) instead and gives the same tag.
 * @param build the raw tag for a row, e.g. ``(vm) => `virtual-machine-${vm.name}` ``.
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
 * A shares-dashboard card's row tag both ways, declared once so they can't drift. `uniqueRowTag` is
 * raw, which `[rowTestId]` and the shared cells emit as-is; `cellRowTag` is lodash-kebabed for value
 * cells whose ids were minted that way (see {@link normalizeTestIdString}). Memoized per row.
 * @param build the raw tag for a row, e.g. ``(row) => `card-smb-share-${row.name}` ``.
 */
export function rowTagPair<T extends object>(build: (row: T) => string): {
  uniqueRowTag: (row: T) => string;
  cellRowTag: (row: T) => string;
} {
  return {
    uniqueRowTag: (row: T) => convertStringToId(build(row)),
    cellRowTag: memoizedRowTag(build),
  };
}

/**
 * Dev-mode guard for a migrated tn-table's column model. The model no longer renders the visible
 * cells, so a missing `getValue` only shows up in the detail row and in sorting — both easy to
 * miss. Reports rather than throws: this catches a mis-declared column model, not a broken
 * invariant, and nothing a user does can trip it — white-screening the page in dev would be a
 * worse trade than a loud console error.
 */
function assertMigratedColumns<T>(columns: TableColumn<T>[]): void {
  // Checked on the RESOLVED names, so a column with neither `propertyName` nor `columnName` is
  // caught too: every such column resolves to 'actions', so a second one collides with the first.
  // A collision with an appended column is not visible from here — `createTable` only ever sees
  // the model — and is caught by `assertUniqueDisplayedColumns` where the two lists meet.
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
      + 'back to "actions".',
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

/**
 * Dev-mode guard for the names a list actually feeds `[displayedColumns]`. This is the only place
 * the column model and `appendedColumns` are both in scope, so it is where an appended name
 * colliding with a modelled one shows up — a duplicate there makes `tn-table` look up the same
 * `[tnColumnDef]` twice and render the appended cell in both places.
 *
 * Reports each distinct list once: the names are recomputed whenever visibility or the language
 * changes, and a standing collision would otherwise log on every pass.
 */
function assertUniqueDisplayedColumns(names: string[], reported: Set<string>): void {
  const duplicates = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
  if (!duplicates.length || reported.has(duplicates.join(','))) {
    return;
  }
  reported.add(duplicates.join(','));
  console.error(
    `[tnTableListHost] displayedColumns has duplicate names: ${duplicates.join(', ')}. `
    + 'An appended column must not repeat a name the column model already resolves — a column '
    + 'with neither `propertyName` nor `columnName` falls back to "actions".',
  );
}

/**
 * Declares a table's column model: what the column picker lists, what `toDisplayedColumns` feeds
 * `[displayedColumns]`, and what the data provider sorts by. `tn-table` renders the cells from
 * the template and each list supplies its own row tags and aria labels, so this only validates
 * and passes the columns through.
 */
export function createTable<T>(columns: TableColumn<T>[]): TableColumn<T>[] {
  if (isDevMode()) {
    assertMigratedColumns(columns);
  }
  return columns;
}

/**
 * What a column's sort accessor may return. Wider than what `BaseDataProvider.sort()` ultimately
 * orders by, because the accessors are usually the cell's own `getValue` — which returns whatever
 * the cell renders, including a `Date` or nothing at all for a row with no value.
 * {@link normalizeSortValue} narrows it before the provider sees it.
 */
export type RowSortValue<T> = (row: T) => string | number | Date | null | undefined;

/**
 * Makes accessor output orderable by lodash `sortBy`: a `Date` becomes its epoch (a formatted string
 * would sort by weekday), and a missing value becomes `''` so such rows group together. Applied to every
 * accessor here, so columns can return natural values; {@link guardSortValue} catches the rest.
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
   * The picker's column model; a column missing from it sorts by its raw value. Matched by
   * `propertyName` across hidden columns too, so a column brought back keeps its accessor; on a shared
   * `propertyName` the first wins, so give the other a {@link sortAccessors} entry. A column whose
   * `getValue` returns an array or object needs an explicit `sortBy`; dev mode reports it.
   */
  columns?: TableColumn<T>[];

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
 * Maps the columns `<ix-table-column-picker>` left visible, in declaration order, to the `*tnColumnDef`
 * names `tn-table`'s `displayedColumns` expects. The name is `propertyName`; a computed column must
 * declare `columnName`, since a name derived from the translated `title` would break in other locales.
 */
export function toDisplayedColumns<T>(columns: TableColumn<T>[]): string[] {
  return columns.filter((column) => !column.hidden).map(tnColumnName);
}

function tnColumnName<T>(column: TableColumn<T>): string {
  if (column.propertyName) {
    return String(column.propertyName);
  }
  return column.columnName || 'actions';
}

/**
 * The accessor to sort a column by: its `sortBy`, else `getValue`, so a column sorts by what it renders
 * (a crontab built from a `schedule`, a name off a nested record), not by a raw property that may be an
 * object. A column that deliberately sorts by a hidden key (Cloud Sync's `*_sort_key`) sets `sortBy`.
 */
function columnSortBy<T>(column: TableColumn<T> | undefined): RowSortValue<T> | undefined {
  return (column?.sortBy ?? column?.getValue) as RowSortValue<T> | undefined;
}

/**
 * Builds the test id for a detail-row action button. Pre-splits with lodash
 * `kebabCase`: it breaks letter–digit boundaries ('esxi1' → 'esxi-1') while the
 * library's kebab does not, so the id matches the one the button already had.
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
 * A tn-table's empty-state bindings from its data provider: `title` to `[emptyMessage]`, `message` to
 * `[emptyDescription]`. Page lists get these as {@link tnTableListHost}'s `list.empty`; this is for a
 * card or dialog that doesn't adopt the host. Call from an injection context.
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
  /** Translated loading text, for `[loadingMessage]`. See `EmptyService.loadingMessage`. */
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
  readonly columns: Signal<TableColumn<T>[]>;
  /** For `<ix-table-details-row [hiddenColumns]>`. */
  readonly hiddenColumns: Signal<TableColumn<T>[]>;
  /** For `<ix-table-column-picker (columnsChange)>`. */
  columnsChange(columns: TableColumn<T>[]): void;
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
  columns: () => TableColumn<T>[];
  /**
   * Column names appended after the picker's, for columns the picker must never
   * offer — an actions column, which has no cell component behind it.
   */
  appendedColumns?: string[];
}

/**
 * Builds the bindings a page-level `tn-table` list needs from its data provider (or a signal of one),
 * so a list declares only what is its own, e.g.
 * `tnTableListHost(this.dataProvider, { columns: [...] }).rowTag((row) => 'rsync-task-' + row.path)`.
 * Call from an injection context.
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

  const loadingMessage = computed(() => emptyService.loadingMessage());

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
    // Delegates rather than open-coding the normalization, so a change to how row tags are
    // spelled reaches these lists along with every table that calls `toUniqueRowTag` directly.
    rowTag: (tagBase: (row: T) => string) => perRow((row: T) => toUniqueRowTag(tagBase(row))),
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

  const reportedDuplicates = new Set<string>();

  return {
    ...withSorting(
      computed(() => {
        const names = [...toDisplayedColumns(columns()), ...appendedColumns];
        if (isDevMode()) {
          assertUniqueDisplayedColumns(names, reportedDuplicates);
        }
        return names;
      }),
      (columnName) => columnSortBy(columns().find((column) => tnColumnName(column) === columnName)),
    ),
    columns,
    hiddenColumns: computed(() => columns().filter((column) => column?.hidden)),
    columnsChange: (next: TableColumn<T>[]) => {
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
