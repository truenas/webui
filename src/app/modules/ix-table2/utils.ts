import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

export function createTable<T>(
  ixTestPrefix: string,
  columns: Column<T, ColumnComponent<T>>[],
): Column<T, ColumnComponent<T>>[] {
  return columns.map((column) => ({ ...column, ixTestPrefix }));
}
