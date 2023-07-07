import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

export function createTable<T>(columns: Column<T, ColumnComponent<T>>[]): Column<T, ColumnComponent<T>>[] {
  return columns;
}
