import { Component } from '@angular/core';
import { format } from 'date-fns-tz';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-date.component.html',
})
export class IxCellDateComponent<T> implements ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  row: T;

  format = 'yyyy-MM-dd HH:mm:ss';

  get formatDate(): string {
    return format(this.row[this.propertyName] as number | Date, this.format);
  }
}
