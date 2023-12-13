import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

export function createTable<T>(
  columns: Column<T, ColumnComponent<T>>[],
  config: { rowTestId: (row: T) => string },
): Column<T, ColumnComponent<T>>[] {
  return columns.map((column) => ({ ...column, rowTestId: config.rowTestId }));
}
