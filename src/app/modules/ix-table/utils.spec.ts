import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, NEVER, of, Subject, map } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import type { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  dataProviderEmptyState, dataProviderLoading, dataProviderRows, detailActionTestId, filterTableRows,
  mapTnSortToProviderSorting, mapTnSortToTableSort, tnTableListHost, toDisplayedColumns,
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

describe('toDisplayedColumns', () => {
  interface Row { name: string; path: string }

  const columns = (overrides: Partial<ColumnComponent<Row>>[] = []): Column<Row, ColumnComponent<Row>>[] => ([
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
      { title: 'Last Run', columnName: 'last-run' } as Column<Row, ColumnComponent<Row>>,
    ])).toEqual(['last-run']);
  });

  it('does not derive a column name from the translated title', () => {
    expect(toDisplayedColumns([
      { title: 'Dernière exécution', columnName: 'last-run' } as Column<Row, ColumnComponent<Row>>,
    ])).toEqual(['last-run']);
  });

  it('falls back to "actions" for a column with neither a propertyName nor a columnName', () => {
    expect(toDisplayedColumns([{ title: 'Actions' } as Column<Row, ColumnComponent<Row>>])).toEqual(['actions']);
    expect(toDisplayedColumns([{} as Column<Row, ColumnComponent<Row>>])).toEqual(['actions']);
  });
});

describe('tnTableListHost', () => {
  interface Row { name: string }

  let langChange$: Subject<LangChangeEvent>;
  let currentPage$: BehaviorSubject<Row[]>;
  let setSorting: jest.Mock;
  let provider: BaseDataProvider<Row>;

  const tank = { name: 'tank' };

  beforeEach(() => {
    langChange$ = new Subject<LangChangeEvent>();
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
          useValue: { instant: (key: string) => key, onLangChange: langChange$ },
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

    it('maps a sort event against the displayed columns and applies it to the provider', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { displayedColumns: ['path', 'name'] });
        list.onSortChange({ column: 'name', direction: 'desc' });

        expect(setSorting).toHaveBeenCalledWith({
          propertyName: 'name',
          direction: SortDirection.Desc,
          active: 1,
        });
      });
    });
  });

  describe('column picker', () => {
    const columns = (): Column<Row, ColumnComponent<Row>>[] => ([
      { propertyName: 'name', title: 'Name' },
      { propertyName: 'path', title: 'Path', hidden: true },
    ] as Column<Row, ColumnComponent<Row>>[]);

    it('derives the displayed columns from the visible ones, then the appended ones', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { columns: columns(), appendedColumns: ['actions'] });

        expect(list.displayedColumns()).toEqual(['name', 'actions']);
        expect(list.hiddenColumns()).toEqual([expect.objectContaining({ propertyName: 'path' })]);
      });
    });

    it('re-derives the displayed columns when the picker changes visibility', () => {
      TestBed.runInInjectionContext(() => {
        const list = tnTableListHost<Row>(provider, { columns: columns() });
        const next = list.columns().map((column) => ({ ...column, hidden: false }));

        list.columnsChange(next);

        expect(list.displayedColumns()).toEqual(['name', 'path']);
        expect(list.hiddenColumns()).toEqual([]);
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
      expect(empty.icon()).toBe('mdi-magnify-scan');
    });
  });

  it('falls back to the no-items config for a state with no dedicated one', () => {
    TestBed.runInInjectionContext(() => {
      const empty = dataProviderEmptyState(makeProvider(EmptyType.NoPageData, 3));

      expect(empty.count()).toBe(3);
      expect(empty.message()).toBe('No records have been added yet');
      expect(empty.icon()).toBe('mdi-format-list-text');
    });
  });

  it('re-translates the message when the language changes', () => {
    TestBed.runInInjectionContext(() => {
      const empty = dataProviderEmptyState(makeProvider(EmptyType.NoSearchResults, 0));
      expect(empty.message()).toBe('No Search Results.');

      translated = () => 'Aucun résultat.';
      langChange$.next({ lang: 'fr' } as LangChangeEvent);

      expect(empty.message()).toBe('Aucun résultat.');
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
