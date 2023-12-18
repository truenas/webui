import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

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
