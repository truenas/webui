import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';

/**
 * Declares one `tn-table` column for {@link createTable}. An identity function: `tn-table` draws cells
 * from the template, so per-kind builders lost their purpose, and typing works without it. It gives
 * every column one named seam where a future column contract can grow.
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
