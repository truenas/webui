import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, EMPTY, NEVER, of, Subject, map,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import type { BaseDataProvider } from 'app/modules/tn-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import type { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';
import type { TableSort } from 'app/modules/tn-table/interfaces/table-sort.interface';
import {
  createTable, dataProviderEmptyState, dataProviderLoading, dataProviderRows, detailActionTestId, filterTableRows,
  mapTnSortToProviderSorting, mapTnSortToTableSort, memoizedRowTag,
  tnTableListHost, toDisplayedColumns, toUniqueRowTag,
} from './utils';

describe('dataProviderRows / dataProviderLoading', () => {
  const makeProvider = (rows: string[], isLoading: boolean): BaseDataProvider<string> => ({
    currentPage$: of(rows),
    isLoading$: of(isLoading),
  } as BaseDataProvider<string>);

  it('adapts a provider passed directly into rows and loading signals', () => {
    TestBed.runInInjectionContext(() => {
      const provider = makeProvider(['a'], true);

      expect(dataProviderRows(provider)()).toEqual(['a']);
      expect(dataProviderLoading(provider)()).toBe(true);
    });
  });

  it('adapts a provider passed as a signal, following provider swaps', () => {
    TestBed.runInInjectionContext(() => {
      const provider = signal(makeProvider(['a'], false));
      const rows = dataProviderRows(provider);
      const isLoading = dataProviderLoading(provider);
      TestBed.tick();

      expect(rows()).toEqual(['a']);
      expect(isLoading()).toBe(false);

      provider.set(makeProvider(['b'], true));
      TestBed.tick();

      expect(rows()).toEqual(['b']);
      expect(isLoading()).toBe(true);
    });
  });
});

describe('mapTnSortToProviderSorting', () => {
  it('maps an ascending sort to propertyName + direction', () => {
    expect(mapTnSortToProviderSorting({ column: 'name', direction: 'asc' })).toEqual({
      propertyName: 'name',
      direction: SortDirection.Asc,
      active: null,
    });
  });

  it('maps a descending sort to propertyName + direction', () => {
    expect(mapTnSortToProviderSorting({ column: 'size', direction: 'desc' })).toEqual({
      propertyName: 'size',
      direction: SortDirection.Desc,
      active: null,
    });
  });

  it('clears sorting (null propertyName and direction) when the direction is empty', () => {
    expect(mapTnSortToProviderSorting({ column: 'name', direction: '' })).toEqual({
      propertyName: null,
      direction: null,
      active: null,
    });
  });
});

describe('mapTnSortToTableSort', () => {
  const displayedColumns = ['name', 'path', 'enabled', 'actions'];

  it('maps an ascending sort to propertyName + direction + column index', () => {
    expect(mapTnSortToTableSort({ column: 'path', direction: 'asc' }, displayedColumns)).toEqual({
      propertyName: 'path',
      direction: SortDirection.Asc,
      active: 1,
    });
  });

  it('maps a descending sort to propertyName + direction + column index', () => {
    expect(mapTnSortToTableSort({ column: 'enabled', direction: 'desc' }, displayedColumns)).toEqual({
      propertyName: 'enabled',
      direction: SortDirection.Desc,
      active: 2,
    });
  });

  it('clears sorting when the direction is empty', () => {
    expect(mapTnSortToTableSort({ column: 'name', direction: '' }, displayedColumns)).toEqual({
      propertyName: null,
      direction: null,
      active: null,
    });
  });

  it('leaves active null when the sorted column is not displayed', () => {
    expect(mapTnSortToTableSort({ column: 'comment', direction: 'asc' }, displayedColumns)).toEqual({
      propertyName: 'comment',
      direction: SortDirection.Asc,
      active: null,
    });
  });

  describe('sort accessors from the column model', () => {
    interface Row { name: string; size: number }

    const row: Row = { name: 'sda', size: 1024 };
    const columns = ['name', 'size'];
    const sizeColumn = {
      propertyName: 'size',
      getValue: (item: Row) => `${item.size} bytes`,
      sortBy: (item: Row) => item.size,
    } as TableColumn<Row>;

    it('prefers the column sortBy over its getValue', () => {
      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [sizeColumn] },
      );

      expect(sorting.sortBy?.(row)).toBe(1024);
    });

    it('falls back to the column getValue, so a derived cell sorts by what it displays', () => {
      const derivedColumn = {
        propertyName: 'size',
        getValue: (item: Row) => `${item.size} bytes`,
      } as TableColumn<Row>;

      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [derivedColumn] },
      );

      expect(sorting.sortBy?.(row)).toBe('1024 bytes');
    });

    it('leaves sortBy undefined for a column with neither, and when sorting is cleared', () => {
      const plainColumn = { propertyName: 'name' } as TableColumn<Row>;

      expect(mapTnSortToTableSort<Row>(
        { column: 'name', direction: 'asc' },
        columns,
        { columns: [plainColumn, sizeColumn] },
      ).sortBy).toBeUndefined();

      expect(mapTnSortToTableSort<Row>(
        { column: 'size', direction: '' },
        columns,
        { columns: [sizeColumn] },
      ).sortBy).toBeUndefined();
    });

    it('leaves sortBy undefined when the sorted column is absent from a partial column list', () => {
      const sorting = mapTnSortToTableSort<Row>(
        { column: 'name', direction: 'asc' },
        columns,
        { columns: [sizeColumn] },
      );

      expect(sorting.sortBy).toBeUndefined();
    });

    it('takes a bare accessor for a table with no column model to pass', () => {
      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { sortAccessors: { size: (item) => item.size } },
      );

      expect(sorting.sortBy?.(row)).toBe(1024);
    });

    it('coerces an accessor lodash sortBy cannot order, and reports it once', () => {
      const error = jest.spyOn(console, 'error').mockImplementation();
      const arrayColumn = {
        propertyName: 'size',
        // A cell rendering a list: `getValue` is typed `unknown`, so nothing but this guard
        // stands between it and an arbitrary row order.
        getValue: () => ['a', 'b'],
      } as unknown as TableColumn<Row>;

      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [arrayColumn] },
      );

      // Degraded rather than fatal, and coerced in every build so dev and production agree —
      // only the console.error is dev-only.
      expect(sorting.sortBy?.(row)).toBe('a,b');
      expect(sorting.sortBy?.(row)).toBe('a,b');
      expect(error).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('column "size" resolved to an array'));
      error.mockRestore();
    });

    it('leaves a boolean accessor alone — lodash orders false before true', () => {
      const error = jest.spyOn(console, 'error').mockImplementation();
      const booleanColumn = {
        propertyName: 'size',
        getValue: (item: Row) => item.size > 0,
      } as unknown as TableColumn<Row>;

      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [booleanColumn] },
      );

      expect(sorting.sortBy?.(row)).toBe(true);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });

    it('passes a primitive accessor through untouched', () => {
      const error = jest.spyOn(console, 'error').mockImplementation();

      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [sizeColumn] },
      );

      expect(sorting.sortBy?.(row)).toBe(1024);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });

    it('prefers an explicit accessor over the one derived from the column model', () => {
      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [sizeColumn], sortAccessors: { size: () => 'override' } },
      );

      expect(sorting.sortBy?.(row)).toBe('override');
    });

    it('ignores accessors for other columns, and when sorting is cleared', () => {
      const sortAccessors = { size: (item: Row) => item.size };

      expect(mapTnSortToTableSort<Row>(
        { column: 'name', direction: 'asc' },
        columns,
        { sortAccessors },
      ).sortBy).toBeUndefined();

      expect(mapTnSortToTableSort<Row>(
        { column: 'size', direction: '' },
        columns,
        { sortAccessors },
      ).sortBy).toBeUndefined();
    });
  });
});

describe('filterTableRows', () => {
  interface TestItem {
    id: string;
    name: string;
    dataset: string;
  }

  const testItems: TestItem[] = [
    { id: '1', name: 'test-item', dataset: 'test' },
    { id: '2', name: 'test-item-2', dataset: 'test2' },
    { id: '3', name: 'another-item', dataset: 'test' },
  ];

  it('should filter with partial match by default', () => {
    const result = filterTableRows({
      list: testItems,
      query: 'test',
      columnKeys: ['name'],
    });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('test-item');
    expect(result[1].name).toBe('test-item-2');
  });

  it('should filter with exact match when exact is true', () => {
    const result = filterTableRows({
      list: testItems,
      query: 'test',
      columnKeys: ['dataset'],
      exact: true,
    });

    expect(result).toHaveLength(2);
    expect(result[0].dataset).toBe('test');
    expect(result[1].dataset).toBe('test');
  });

  it('should filter with partial match when exact is false', () => {
    const result = filterTableRows({
      list: testItems,
      query: 'test',
      columnKeys: ['dataset'],
      exact: false,
    });

    expect(result).toHaveLength(3); // All items contain 'test' in dataset
  });

  it('should return no results when exact match does not find matches', () => {
    const result = filterTableRows({
      list: testItems,
      query: 'nonexistent',
      columnKeys: ['dataset'],
      exact: true,
    });

    expect(result).toHaveLength(0);
  });

  it('should work with preprocessMap and exact match', () => {
    const itemsWithPaths = [
      { id: '1', name: 'item1', dataset: '/dozer/test' },
      { id: '2', name: 'item2', dataset: '/dozer/test2' },
      { id: '3', name: 'item3', dataset: '/dozer/test3' },
    ];

    const result = filterTableRows({
      list: itemsWithPaths,
      query: 'test',
      columnKeys: ['dataset'],
      exact: true,
      preprocessMap: {
        dataset: (value: string) => value.split('/').pop() || value,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].dataset).toBe('/dozer/test');
  });
});

describe('createTable', () => {
  interface Row { name: string }

  // The guard reports rather than throws — a mis-declared column model shouldn't white-screen the
  // page in dev, and nothing a user does can trip it.
  let reported: jest.SpyInstance;

  beforeEach(() => {
    reported = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => reported.mockRestore());

  it('accepts a columnName-keyed column that carries getValue', () => {
    createTable<Row>([
      { title: 'Last Run', columnName: 'last-run', getValue: () => 1 } as TableColumn<Row>,
    ]);

    expect(reported).not.toHaveBeenCalled();
  });

  it('reports a columnName-keyed column with no getValue', () => {
    createTable<Row>([
      { title: 'Last Run', columnName: 'last-run' } as TableColumn<Row>,
    ]);

    expect(reported).toHaveBeenCalledWith(expect.stringContaining('"Last Run" ("last-run")'));
  });

  it('reports more than one column resolving to the "actions" column name', () => {
    createTable<Row>([
      { title: 'Actions' } as TableColumn<Row>,
      { title: 'More' } as TableColumn<Row>,
    ]);

    expect(reported).toHaveBeenCalledWith(expect.stringContaining('actions'));
  });

  it('reports a single unnamed column colliding with an explicit actions column', () => {
    // The case the count-based check used to miss: one unnamed column resolves to 'actions',
    // which is exactly the name `appendedColumns: ['actions']` adds.
    createTable<Row>([
      { propertyName: 'name', title: 'Name' } as TableColumn<Row>,
      { title: 'Actions' } as TableColumn<Row>,
      { columnName: 'actions', title: 'More', getValue: () => 1 } as TableColumn<Row>,
    ]);

    expect(reported).toHaveBeenCalledWith(expect.stringContaining('actions'));
  });

  it('passes a well-formed column model through untouched', () => {
    const columns = [
      { propertyName: 'name', title: 'Name' } as TableColumn<Row>,
      { title: 'Actions' } as TableColumn<Row>,
    ];

    expect(createTable<Row>(columns)).toBe(columns);
    expect(reported).not.toHaveBeenCalled();
  });
});

describe('toDisplayedColumns', () => {
  interface Row { name: string; path: string }

  const columns = (overrides: Partial<TableColumn<Row>>[] = []): TableColumn<Row>[] => ([
    { propertyName: 'name', title: 'Name', ...overrides[0] },
    { propertyName: 'path', title: 'Path', ...overrides[1] },
    { ...overrides[2] }, // actions column: no propertyName / title
  ]);

  it('maps each visible column to its propertyName, in declaration order', () => {
    expect(toDisplayedColumns(columns())).toEqual(['name', 'path', 'actions']);
  });

  it('drops columns hidden by the selector', () => {
    expect(toDisplayedColumns(columns([{}, { hidden: true }]))).toEqual(['name', 'actions']);
  });

  it('uses the explicit columnName for a computed column without a propertyName', () => {
    expect(toDisplayedColumns([
      { title: 'Last Run', columnName: 'last-run' } as TableColumn<Row>,
    ])).toEqual(['last-run']);
  });

  it('does not derive a column name from the translated title', () => {
    expect(toDisplayedColumns([
      { title: 'Dernière exécution', columnName: 'last-run' } as TableColumn<Row>,
    ])).toEqual(['last-run']);
  });

  it('falls back to "actions" for a column with neither a propertyName nor a columnName', () => {
    expect(toDisplayedColumns([{ title: 'Actions' } as TableColumn<Row>])).toEqual(['actions']);
    expect(toDisplayedColumns([{} as TableColumn<Row>])).toEqual(['actions']);
  });
});

describe('tnTableListHost', () => {
  interface Row { name: string; path?: string }

  let langChange$: Subject<LangChangeEvent>;
  let currentPage$: BehaviorSubject<Row[]>;
  let setSorting: jest.Mock;
  let provider: BaseDataProvider<Row>;
  // Identity by default, so most assertions read as the untranslated key; swapped out by the
  // tests that check a binding follows a language change.
  let translated: (key: string) => string;

  const tank = { name: 'tank' };

  beforeEach(() => {
    langChange$ = new Subject<LangChangeEvent>();
    translated = (key: string) => key;
    currentPage$ = new BehaviorSubject<Row[]>([tank]);
    setSorting = jest.fn();
    provider = {
      currentPage$,
      isLoading$: of(false),
      emptyType$: of(EmptyType.NoPageData),
      currentPageCount$: currentPage$.pipe(map((rows) => rows.length)),
      setSorting,
    } as unknown as BaseDataProvider<Row>;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => translated(key),
            onLangChange: langChange$,
            // `langChangeSignal` merges all three streams; only the language one is driven here.
            onTranslationChange: EMPTY,
            onDefaultLangChange: EMPTY,
          },
        },
      ],
    });
  });

  describe('provider bindings', () => {
    it('exposes the provider rows, loading and empty state', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { displayedColumns: ['name'] });

        expect(list.rows()).toEqual([tank]);
        expect(list.isLoading()).toBe(false);
        expect(list.empty.type()).toBe(EmptyType.NoPageData);
        expect(list.empty.count()).toBe(1);
      });
    });

    it('resolves the loading message from the empty-state catalog, not a per-template literal', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { displayedColumns: ['name'] });

        // The catalog's `loadingConfig` title, so the six migrated lists can't drift onto a
        // second spelling of it (webui used to carry both 'Loading...' and 'Loading…').
        expect(list.loadingMessage()).toBe('Loading...');
      });
    });

    it('re-translates the loading message when the language changes', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { displayedColumns: ['name'] });
        expect(list.loadingMessage()).toBe('Loading...');

        translated = () => 'Chargement…';
        langChange$.next({ lang: 'fr' } as LangChangeEvent);

        expect(list.loadingMessage()).toBe('Chargement…');
      });
    });

    it('maps a sort event against the displayed columns and applies it to the provider', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { displayedColumns: ['path', 'name'] });
        list.onSortChange({ column: 'name', direction: 'desc' });

        expect(setSorting).toHaveBeenCalledWith({
          propertyName: 'name',
          sortBy: undefined,
          direction: SortDirection.Desc,
          active: 1,
        });
      });
    });

    it('passes a fixed column\'s explicit sortBy through, for a name matching no row property', () => {
      TestBed.runInInjectionContext(() => {
        const sortBy = (row: Row): string => row.name;
        const list = tnTableListHost<Row>(provider, { displayedColumns: ['name', { name: 'state', sortBy }] });
        list.onSortChange({ column: 'state', direction: 'asc' });

        // `mapTnSortToTableSort` wraps every accessor in its non-orderable-value guard, so assert
        // what the provider will sort by rather than the identity of the function handed over.
        const applied = setSorting.mock.calls[0][0] as TableSort<Row>;
        expect(applied.active).toBe(1);
        expect(applied.sortBy?.({ name: 'sda' } as Row)).toBe('sda');
      });
    });
  });

  describe('column picker', () => {
    const columns = (): TableColumn<Row>[] => ([
      { propertyName: 'name', title: 'Name' },
      { propertyName: 'path', title: 'Path', hidden: true },
    ] as TableColumn<Row>[]);

    it('derives the displayed columns from the visible ones, then the appended ones', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { columns: () => columns(), appendedColumns: ['actions'] });

        expect(list.displayedColumns()).toEqual(['name', 'actions']);
        expect(list.hiddenColumns()).toEqual([expect.objectContaining({ propertyName: 'path' })]);
      });
    });

    // `createTable` only ever sees the model, so a modelled column colliding with an appended one
    // is only visible here — a column with neither `propertyName` nor `columnName` resolves to
    // 'actions', the same name `appendedColumns` adds.
    it('reports a modelled column colliding with an appended one, once per collision', () => {
      const error = jest.spyOn(console, 'error').mockImplementation();
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, {
          columns: () => [{ title: 'Name', propertyName: 'name' }, { title: 'Actions' }] as TableColumn<Row>[],
          appendedColumns: ['actions'],
        });

        expect(list.displayedColumns()).toEqual(['name', 'actions', 'actions']);
        list.displayedColumns();

        expect(error).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalledWith(expect.stringContaining('duplicate names: actions'));
      });
      error.mockRestore();
    });

    it('stays quiet when the appended names are all its own', () => {
      const error = jest.spyOn(console, 'error').mockImplementation();
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { columns: () => columns(), appendedColumns: ['actions'] });
        list.displayedColumns();

        expect(error).not.toHaveBeenCalled();
      });
      error.mockRestore();
    });

    it('re-derives the displayed columns when the picker changes visibility', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { columns: () => columns() });
        const next = list.columns().map((column) => ({ ...column, hidden: false }));

        list.columnsChange(next);

        expect(list.displayedColumns()).toEqual(['name', 'path']);
        expect(list.hiddenColumns()).toEqual([]);
      });
    });

    it('rebuilds the column model on a language change, keeping what the picker hid', () => {
      TestBed.runInInjectionContext(() => {
        // Column titles are resolved eagerly, so a model built once would freeze the picker's and
        // detail row's labels in the initial locale while the headers followed along.
        const locale = signal('en');
        const list = tnTableListHost<Row>(provider, {
          columns: () => [
            { propertyName: 'name', title: `Name (${locale()})` },
            { propertyName: 'path', title: 'Path' },
          ] as TableColumn<Row>[],
        });

        list.columnsChange(list.columns().map((column) => (
          column.propertyName === 'path' ? { ...column, hidden: true } : column
        )));
        expect(list.displayedColumns()).toEqual(['name']);

        locale.set('fr');

        expect(list.columns()[0].title).toBe('Name (fr)');
        // The rebuild must not resurrect a column the user hid.
        expect(list.displayedColumns()).toEqual(['name']);
        expect(list.hiddenColumns()).toEqual([expect.objectContaining({ propertyName: 'path' })]);
      });
    });

    it('sorts a derived column by its getValue, which is all it has to order on', () => {
      TestBed.runInInjectionContext(() => {
        const getValue = (row: Row): string => row.name;
        const list = tnTableListHost<Row>(provider, {
          columns: () => [
            { propertyName: 'name', title: 'Name' },
            { columnName: 'state', title: 'State', getValue },
          ] as TableColumn<Row>[],
        });
        list.onSortChange({ column: 'state', direction: 'asc' });

        // Wrapped by the accessor guard, so compare behaviour rather than function identity.
        const applied = setSorting.mock.calls[0][0] as TableSort<Row>;
        expect(applied.sortBy?.({ name: 'sda' } as Row)).toBe(getValue({ name: 'sda' } as Row));
      });
    });

    // The precedence `ix-table-head` applied before the migration: a column declaring both renders
    // something its raw property doesn't say, so ordering by the property sorts by a value that is
    // nowhere on screen.
    it('sorts a column carrying both a propertyName and a getValue by what it renders', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, {
          columns: () => [
            { propertyName: 'name', title: 'Name', getValue: (row: Row) => `${row.name} (pool)` },
          ] as TableColumn<Row>[],
        });
        list.onSortChange({ column: 'name', direction: 'asc' });

        const applied = setSorting.mock.calls[0][0] as TableSort<Row>;
        expect(applied.sortBy?.({ name: 'sda' } as Row)).toBe('sda (pool)');
      });
    });

    // How a column opts back into its property — e.g. a hidden sort key behind a human-readable
    // cell, as Cloud Sync's `*_sort_key` columns do.
    it('prefers an explicit sortBy over the rendered value', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, {
          columns: () => [{
            propertyName: 'name',
            title: 'Name',
            getValue: (row: Row) => `${row.name} (pool)`,
            sortBy: (row: Row) => row.name,
          }] as TableColumn<Row>[],
        });
        list.onSortChange({ column: 'name', direction: 'asc' });

        const applied = setSorting.mock.calls[0][0] as TableSort<Row>;
        expect(applied.sortBy?.({ name: 'sda' } as Row)).toBe('sda');
      });
    });

    it('leaves a real-property column to sort by its property', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { columns: () => columns() });
        list.onSortChange({ column: 'name', direction: 'asc' });

        expect(setSorting).toHaveBeenCalledWith(expect.objectContaining({
          propertyName: 'name',
          sortBy: undefined,
        }));
      });
    });
  });

  describe('perRow', () => {
    it('derives once per row and reuses the result on later calls', () => {
      TestBed.runInInjectionContext(() => {
        const derive = jest.fn((row: Row) => row.name.toUpperCase());
        const label = tnTableListHost<Row>(provider, { displayedColumns: ['name'] }).perRow(derive);

        expect(label(tank)).toBe('TANK');
        expect(label(tank)).toBe('TANK');
        expect(derive).toHaveBeenCalledTimes(1);
      });
    });

    it('keeps a separate result per row', () => {
      TestBed.runInInjectionContext(() => {
        const label = tnTableListHost<Row>(provider, { displayedColumns: ['name'] })
          .perRow((row) => row.name.toUpperCase());

        expect(label(tank)).toBe('TANK');
        expect(label({ name: 'dozer' })).toBe('DOZER');
      });
    });

    it('re-derives after the provider emits a new set of rows', () => {
      TestBed.runInInjectionContext(() => {
        const derive = jest.fn((row: Row) => row.name.toUpperCase());
        const label = tnTableListHost<Row>(provider, { displayedColumns: ['name'] }).perRow(derive);
        expect(label(tank)).toBe('TANK');

        currentPage$.next([tank]);

        expect(label(tank)).toBe('TANK');
        expect(derive).toHaveBeenCalledTimes(2);
      });
    });

    it('re-derives when the language changes, so a translated label does not freeze', () => {
      TestBed.runInInjectionContext(() => {
        const derive = jest.fn((row: Row) => row.name.toUpperCase());
        const label = tnTableListHost<Row>(provider, { displayedColumns: ['name'] }).perRow(derive);
        expect(label(tank)).toBe('TANK');

        langChange$.next({ lang: 'fr' } as LangChangeEvent);

        expect(label(tank)).toBe('TANK');
        expect(derive).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('rowTag', () => {
    const makeTag = (): (row: Row) => string => tnTableListHost<Row>(provider, { displayedColumns: ['name'] })
      .rowTag((row) => 'replication-task-' + row.name);

    it('kebab-cases the base so the tag resolves the same as the legacy [ixTest] directive', () => {
      TestBed.runInInjectionContext(() => {
        expect(makeTag()({ name: 'My Task' })).toBe('replication-task-my-task');
      });
    });

    it('splits letter-digit boundaries, which the library kebab does not', () => {
      TestBed.runInInjectionContext(() => {
        expect(makeTag()({ name: 'task1' })).toBe('replication-task-task-1');
      });
    });

    it('strips the punctuation convertStringToId removes', () => {
      TestBed.runInInjectionContext(() => {
        expect(makeTag()({ name: 'pool/dataset' })).toBe('replication-task-pool-dataset');
      });
    });

    // A list host and a table calling `toUniqueRowTag` directly can sit side by side, so the two
    // spellings have to agree — this fails if either one starts normalizing on its own.
    it('spells the tag exactly as toUniqueRowTag does', () => {
      TestBed.runInInjectionContext(() => {
        const tag = makeTag();
        for (const name of ['My Task', 'task1', 'pool/dataset', 'eth0 & sda!']) {
          expect(tag({ name })).toBe(toUniqueRowTag('replication-task-' + name));
        }
      });
    });
  });
});

describe('detailActionTestId', () => {
  it('kebab-cases the row parts and the action into one id', () => {
    expect(detailActionTestId(['esxi-host', '/mnt/tank'], 'delete')).toBe('esxi-host-mnt-tank-delete');
  });

  it('splits letter-digit boundaries, which the library kebab does not', () => {
    expect(detailActionTestId(['esxi1'], 'edit')).toBe('esxi-1-edit');
  });

  it('accepts numeric row parts', () => {
    expect(detailActionTestId([12], 'run_now')).toBe('12-run-now');
  });

  it('drops undefined parts rather than rendering them', () => {
    expect(detailActionTestId(['task', undefined], 'edit')).toBe('task-edit');
  });
});

describe('dataProviderEmptyState', () => {
  let langChange$: Subject<LangChangeEvent>;
  let translated: (key: string) => string;

  beforeEach(() => {
    langChange$ = new Subject<LangChangeEvent>();
    translated = (key: string) => key;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => translated(key),
            onLangChange: langChange$,
            // `langChangeSignal` merges all three streams; only the language one is driven here.
            onTranslationChange: EMPTY,
            onDefaultLangChange: EMPTY,
          },
        },
      ],
    });
  });

  const makeProvider = (
    emptyType: EmptyType,
    count: number,
  ): BaseDataProvider<string> => ({
    emptyType$: of(emptyType),
    currentPageCount$: of(count),
  } as unknown as BaseDataProvider<string>);

  it('exposes the type, row count, translated title and icon for the current empty state', () => {
    TestBed.runInInjectionContext(() => {
      const empty = dataProviderEmptyState(makeProvider(EmptyType.NoSearchResults, 0));

      expect(empty.type()).toBe(EmptyType.NoSearchResults);
      expect(empty.count()).toBe(0);
      expect(empty.message()).toBe('No Search Results.');
      expect(empty.description()).toBe('No matching results found');
      expect(empty.icon()).toBe('mdi-magnify-scan');
    });
  });

  it('falls back to the no-items config for a state with no dedicated one', () => {
    TestBed.runInInjectionContext(() => {
      const empty = dataProviderEmptyState(makeProvider(EmptyType.NoPageData, 3));

      expect(empty.count()).toBe(3);
      expect(empty.message()).toBe('No records have been added yet');
      // That config carries no second line, so nothing is rendered under the title.
      expect(empty.description()).toBe('');
      expect(empty.icon()).toBe('mdi-format-list-text');
    });
  });

  it('flattens markup out of the description, which was written for ix-empty', () => {
    translated = () => 'First line.<br>\nSecond line.';

    TestBed.runInInjectionContext(() => {
      const empty = dataProviderEmptyState(makeProvider(EmptyType.NoSearchResults, 0));

      expect(empty.description()).toBe('First line. Second line.');
    });
  });

  it('re-translates the message and description when the language changes', () => {
    TestBed.runInInjectionContext(() => {
      const empty = dataProviderEmptyState(makeProvider(EmptyType.NoSearchResults, 0));
      expect(empty.message()).toBe('No Search Results.');
      expect(empty.description()).toBe('No matching results found');

      translated = () => 'Aucun résultat.';
      langChange$.next({ lang: 'fr' } as LangChangeEvent);

      expect(empty.message()).toBe('Aucun résultat.');
      expect(empty.description()).toBe('Aucun résultat.');
    });
  });

  it('reports a loading state before the provider emits', () => {
    TestBed.runInInjectionContext(() => {
      const empty = dataProviderEmptyState({
        emptyType$: NEVER,
        currentPageCount$: NEVER,
      } as unknown as BaseDataProvider<string>);

      expect(empty.type()).toBe(EmptyType.Loading);
      expect(empty.count()).toBe(0);
    });
  });
});

describe('memoizedRowTag', () => {
  interface Row { name: string }

  it('kebabs the built tag the same way toUniqueRowTag does', () => {
    const tag = memoizedRowTag<Row>((row) => `virtual-machine-${row.name}`);

    expect(tag({ name: 'My VM1' })).toBe(toUniqueRowTag('virtual-machine-My VM1'));
    // Letter-digit boundary is split, matching what the legacy [ixTest] directive resolved to.
    expect(tag({ name: 'My VM1' })).toBe('virtual-machine-my-vm-1');
  });

  it('builds a tag once per row and reuses it on every later call', () => {
    const build = jest.fn((row: Row) => row.name);
    const tag = memoizedRowTag(build);
    const row = { name: 'vm-a' };

    expect(tag(row)).toBe('vm-a');
    expect(tag(row)).toBe('vm-a');
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('treats a replaced row object as a new row', () => {
    const build = jest.fn((row: Row) => row.name);
    const tag = memoizedRowTag(build);

    tag({ name: 'vm-a' });
    tag({ name: 'vm-a' });

    expect(build).toHaveBeenCalledTimes(2);
  });
});
