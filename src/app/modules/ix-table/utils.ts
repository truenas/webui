import { get } from 'lodash-es';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/table-column.interface';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';

function convertStringToId(inputString: string): string {
  let result = inputString;

  if (!result || result.includes('undefined')) {
    result = result?.replace('undefined', '') || '';
  }

  return result.toLowerCase().replace(/\s+/g, '-');
}

export function createTable<T>(
  columns: Column<T, ColumnComponent<T>>[],
  config: { rowTestId: (row: T) => string; ariaLabels: (row: T) => string[] },
): Column<T, ColumnComponent<T>>[] {
  return columns.map((column) => ({
    ...column,
    rowTestId: (row) => convertStringToId(config.rowTestId(row)),
    ariaLabels: (row) => config.ariaLabels(row),
  }));
}

export function filterTableRows<T>(filter: TableFilter<T>): T[] {
  const {
    list = [], query = '', columnKeys = [], preprocessMap,
  } = filter;

  const filterString = query.toLowerCase();
  return list.filter((item) => {
    return columnKeys.some((columnKey) => {
      let value = get(item, columnKey) as string | undefined;
      if (preprocessMap?.[columnKey]) {
        value = preprocessMap[columnKey]?.(value as T[keyof T]);
      }
      return value?.toString()?.toLowerCase()?.includes(filterString);
    });
  });
}
