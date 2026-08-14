import {
  Component, ChangeDetectionStrategy, input,
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
    return value == null ? '' : String(value);
  }
}
