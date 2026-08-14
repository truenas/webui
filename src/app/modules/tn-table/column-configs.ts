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
 * An actions column: the `title: undefined` is the point — a column the picker can offer has a
 * title, so stripping it is what keeps this one out of the picker, rather than every call site
 * remembering not to pass one. Sortability is the template's to decide — a column is sortable
 * only where its `[tnColumnDef]` says `[sortable]`, and an actions column never does.
 */
export function actionsColumn<T>(config: TableColumn<T> = {}): TableColumn<T> {
  return { ...config, title: undefined };
}
