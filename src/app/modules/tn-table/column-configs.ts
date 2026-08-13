import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';

/**
 * Declares one `tn-table` column for {@link createTable}.
 *
 * ix-table had a builder per cell kind (`textColumn`, `yesNoColumn`, `stateButtonColumn`, …)
 * because the builder chose the component that drew the cell. `tn-table` draws every cell from
 * the template instead, so the kind carries no information any more and there is one factory —
 * it exists to infer `T` for `propertyName`, `sortBy` and `getValue`.
 */
export function column<T>(config: TableColumn<T>): TableColumn<T> {
  return config;
}

/**
 * An actions column: no title (so the column picker leaves it alone) and never sortable.
 */
export function actionsColumn<T>(config: TableColumn<T> = {}): TableColumn<T> {
  return { disableSorting: true, ...config };
}
