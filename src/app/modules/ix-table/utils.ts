import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/table-column.interface';

function convertStringToId(inputString: string): string {
  let result = inputString;

  if (!result || result.includes('undefined')) {
    result = result?.replace('undefined', '') || '';
  }

  return result.toLowerCase().replace(/\s+/g, '-');
}

export function createTable<T>(
  columns: Column<T, ColumnComponent<T>>[],
  config: { rowTestId: (row: T) => string },
): Column<T, ColumnComponent<T>>[] {
  return columns.map((column) => ({ ...column, rowTestId: (row) => convertStringToId(config.rowTestId(row)) }));
}

export function getColumnNestedValue<T>(object: T, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, object);
}

export function filterTableColumns<T>(filter: {
  query: string;
  columnKeys: (keyof T)[];
  list?: T[];
  preprocessMap?: Partial<Record<keyof T, (value: T[keyof T]) => string>>;
}): T[] {
  const {
    list = [], query, columnKeys, preprocessMap,
  } = filter;

  const filterString = query.toLowerCase();
  return list.filter((item) => {
    return columnKeys.some((columnKey) => {
      let value = getColumnNestedValue(item, columnKey as string);
      if (preprocessMap && preprocessMap[columnKey]) {
        value = preprocessMap[columnKey]?.(value as T[keyof T]);
      }
      return value?.toString().toLowerCase().includes(filterString);
    });
  });
}
