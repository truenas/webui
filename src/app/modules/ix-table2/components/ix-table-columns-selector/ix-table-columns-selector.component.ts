import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-table-columns-selector',
  templateUrl: './ix-table-columns-selector.component.html',
  styleUrls: ['./ix-table-columns-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableColumnsSelectorComponent<T> {
  @Input() columns: Column<T, ColumnComponent<T>>[];

  get isAllChecked(): boolean {
    return true;
  }

  checkAll(): void {}

  isChecked(propertyName: keyof T): boolean {
    console.info('isChecked', propertyName);
    return true;
  }
}
