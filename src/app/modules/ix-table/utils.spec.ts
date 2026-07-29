import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { NEVER, of } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import type { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  dataProviderEmptyState, dataProviderLoading, dataProviderRows, detailActionTestId, filterTableRows,
  mapTnSortToProviderSorting, mapTnSortToTableSort, perRow, rowTestIdTag, toDisplayedColumns,
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

describe('perRow', () => {
  it('derives the value from the row', () => {
    const label = perRow<{ name: string }, string>((row) => row.name.toUpperCase());

    expect(label({ name: 'tank' })).toBe('TANK');
  });

  it('derives once per row and reuses the result on later calls', () => {
    const derive = jest.fn((row: { name: string }) => row.name.toUpperCase());
    const label = perRow(derive);
    const row = { name: 'tank' };

    expect(label(row)).toBe('TANK');
    expect(label(row)).toBe('TANK');
    expect(derive).toHaveBeenCalledTimes(1);
  });

  it('keeps a separate result per row', () => {
    const label = perRow<{ name: string }, string>((row) => row.name.toUpperCase());

    expect(label({ name: 'tank' })).toBe('TANK');
    expect(label({ name: 'dozer' })).toBe('DOZER');
  });
});

describe('rowTestIdTag', () => {
  interface Row { name: string }

  const tag = rowTestIdTag<Row>((row) => 'replication-task-' + row.name);

  it('kebab-cases the base so the tag resolves the same as the legacy [ixTest] directive', () => {
    expect(tag({ name: 'My Task' })).toBe('replication-task-my-task');
  });

  it('splits letter-digit boundaries, which the library kebab does not', () => {
    expect(tag({ name: 'task1' })).toBe('replication-task-task-1');
  });

  it('strips the punctuation convertStringToId removes', () => {
    expect(tag({ name: 'pool/dataset' })).toBe('replication-task-pool-dataset');
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
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
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
