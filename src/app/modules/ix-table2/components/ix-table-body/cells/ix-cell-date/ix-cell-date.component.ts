import { Component } from '@angular/core';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-date.component.html',
})
export class IxCellDateComponent<T> extends ColumnComponent<T> {
  get value(): number | Date {
    if ((this.row[this.propertyName] as ApiTimestamp)?.$date) {
      return (this.row[this.propertyName] as ApiTimestamp).$date;
    }
    return this.row[this.propertyName] as number | Date;
  }
}

export function dateColumn<T>(options: Partial<IxCellDateComponent<T>>): Column<T, IxCellDateComponent<T>> {
  return { type: IxCellDateComponent, ...options };
}
