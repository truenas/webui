import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  dataProviderLoading, dataProviderRows, filterTableRows, mapTnSortToProviderSorting,
  mapTnSortToTableSort, toDisplayedColumns,
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
    } as Column<Row, ColumnComponent<Row>>;

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
      } as Column<Row, ColumnComponent<Row>>;

      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [derivedColumn] },
      );

      expect(sorting.sortBy?.(row)).toBe('1024 bytes');
    });

    it('leaves sortBy undefined for a column with neither, and when sorting is cleared', () => {
      const plainColumn = { propertyName: 'name' } as Column<Row, ColumnComponent<Row>>;

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

    it('reports an accessor lodash sortBy cannot order, once, without breaking the sort', () => {
      const error = jest.spyOn(console, 'error').mockImplementation();
      const arrayColumn = {
        propertyName: 'size',
        // A cell rendering a list: `getValue` is typed `unknown`, so nothing but this guard
        // stands between it and an arbitrary row order.
        getValue: () => ['a', 'b'],
      } as unknown as Column<Row, ColumnComponent<Row>>;

      const sorting = mapTnSortToTableSort<Row>(
        { column: 'size', direction: 'asc' },
        columns,
        { columns: [arrayColumn] },
      );

      // Degraded rather than fatal: one sloppy column shouldn't take the whole table down.
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
      } as unknown as Column<Row, ColumnComponent<Row>>;

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

  it('falls back to "actions" for a column without a propertyName', () => {
    expect(toDisplayedColumns([{ title: 'X' } as Column<Row, ColumnComponent<Row>>])).toEqual(['actions']);
  });
});
