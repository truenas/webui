import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-table-details-row',
  templateUrl: './ix-table-details-row.component.html',
  styleUrls: ['./ix-table-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableDetailsRowComponent<T> {
  readonly hiddenColumns = input<Column<T, ColumnComponent<T>>[]>();
  readonly row = input<T>();
}
