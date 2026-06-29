import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { filterTableRows, toDisplayedColumns } from './utils';

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
