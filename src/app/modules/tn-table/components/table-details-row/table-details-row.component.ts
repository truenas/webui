import {
  Component, ChangeDetectionStrategy, input, isDevMode,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnDividerComponent, TnTestIdDirective } from '@truenas/ui-components';
import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';

/**
 * Detail row of a `tn-table` list: prints the columns the user has hidden, then projects whatever
 * row actions the list declares.
 *
 * The hidden columns are printed as text rather than rendered through the cell each one would use
 * in the table, because a `tn-table` cell only exists as an `<ng-template tnCellDef>` inside the
 * list's own template — there is nothing here to reach for. A column whose value is not already
 * display-ready says how to print it with `formatValue`.
 */
@Component({
  selector: 'ix-table-details-row',
  templateUrl: './table-details-row.component.html',
  styleUrls: ['./table-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDividerComponent,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class IxTableDetailsRowComponent<T> {
  readonly hiddenColumns = input<TableColumn<T>[]>([]);
  readonly row = input<T>();
  /** Row tag the printed values carry in their test ids, matching the list's own cells. */
  readonly uniqueRowTag = input<string>('');

  /** Columns the dev-mode guard below has already reported, so it fires once each. */
  private readonly reported = new Set<TableColumn<T>>();

  protected value(column: TableColumn<T>): string {
    const row = this.row();
    if (!row) {
      return '';
    }
    if (column.formatValue) {
      return column.formatValue(row);
    }

    let value: unknown;
    if (column.getValue) {
      value = column.getValue(row);
    } else if (column.propertyName) {
      value = row[column.propertyName];
    }
    if (value == null) {
      return '';
    }
    const text = String(value);
    this.reportUnprintable(column, text);
    return text;
  }

  /**
   * Dev-mode guard for the one way this row goes wrong quietly: a column whose value is an object
   * — a `Schedule`, a nested record — prints "[object Object]" here, while its own cell renders it
   * through a pipe or a cell component the row cannot reach. Keyed on the printed text rather than
   * `typeof`, so an array of strings (which prints readably, and prints the same in the cell) does
   * not trip it. Reports rather than throws — the trade `guardSortValue` makes on the sort path —
   * and at most once per column per session.
   */
  private reportUnprintable(column: TableColumn<T>, text: string): void {
    if (!isDevMode() || !text.includes('[object ') || this.reported.has(column)) {
      return;
    }
    this.reported.add(column);
    console.error(
      `[ix-table-details-row] column "${column.title}" prints as "${text}". Give it a \`formatValue\` `
      + 'saying how a detail row should print it — the table\'s own cell does that formatting in '
      + 'the template, where a detail row cannot reach it.',
    );
  }
}
