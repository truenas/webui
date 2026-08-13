import { SortValue } from 'app/modules/tn-table/interfaces/table-sort.interface';

/**
 * A column of a `tn-table`, as everything *around* the table needs to know it: the column picker
 * lists it, `toDisplayedColumns` turns it into `[displayedColumns]`, the data provider sorts by
 * it, and a details row renders it while it is hidden.
 *
 * It deliberately does not name a renderer. `tn-table` renders every cell from the template
 * (`<ng-template tnCellDef>`), so unlike ix-table's `Column`, which carried the component class
 * that drew the cell, this is pure metadata.
 */
export interface TableColumn<T> {
  /**
   * User-facing column name. Also the column picker's persistence key, so it must stay stable
   * across releases. A column without one (an actions column) is not user-toggleable.
   */
  title?: string;

  /** Row property the column shows, and the `[tnColumnDef]` name unless `columnName` overrides it. */
  propertyName?: keyof T;

  /**
   * `[tnColumnDef]` name for a computed column that has no `propertyName`. Must match the literal
   * the template passes — see `toDisplayedColumns`.
   */
  columnName?: string;

  /** Whether the column starts hidden. The column picker writes this back. */
  hidden?: boolean;

  disableSorting?: boolean;

  /**
   * Marker class for a column that something outside the table has to find later — the tier
   * column, which `SharingTierService` un-hides once tiering is on. `tn-table` does not render it.
   */
  cssClass?: string;

  /** Explicit sort key, for a column whose displayed value is not what it should order by. */
  sortBy?: (row: T) => SortValue;

  /** The column's underlying value: what a details row falls back to, and the sort key if no `sortBy`. */
  getValue?: (row: T) => unknown;

  /**
   * How a details row prints this column while it is hidden from the table. Only needed when the
   * value is not already display-ready — a timestamp shown as "2 hours ago", a boolean shown as
   * "Yes" — because the table's own cell does that formatting in the template, where a details
   * row cannot reach it.
   */
  formatValue?: (row: T) => string;
}
