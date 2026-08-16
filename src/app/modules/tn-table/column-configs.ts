import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';

/**
 * Declares one `tn-table` column for {@link createTable}.
 *
 * ix-table had a builder per cell kind (`textColumn`, `yesNoColumn`, `stateButtonColumn`, …)
 * because the builder chose the component that drew the cell. `tn-table` draws every cell from
 * the template instead, so the kind carries no information any more and there is one factory.
 *
 * It is deliberately an identity function: inside `createTable<T>([…])` the array literal is
 * already contextually typed, so a bare object literal infers `T` for `propertyName`, `sortBy`
 * and `getValue` just as well. What it buys is a single named seam — every column in the app is
 * declared through one call, so a future column contract (a required field, a validation, a
 * default) has one place to grow and one shape to grep for.
 */
export function column<T>(config: TableColumn<T>): TableColumn<T> {
  return config;
}

/**
 * An actions column: the `title: undefined` is the point — a column the picker can offer has a
 * title, so stripping it is what keeps this one out of the picker, rather than every call site
 * remembering not to pass one. Sortability is the template's to decide — a column is sortable
 * only where its `[tnColumnDef]` says `[sortable]`, and an actions column never does.
 *
 * Takes no config: the cell is drawn from the template, the picker must not see this column, and
 * nothing else on {@link TableColumn} applies to it.
 */
export function actionsColumn<T>(): TableColumn<T> {
  return { title: undefined };
}
