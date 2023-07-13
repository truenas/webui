import { Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-date.component.html',
})
export class IxCellDateComponent<T> extends ColumnComponent<T> {
  formatDate: string = undefined;
  formatTime: string = undefined;

  get value(): number | Date {
    return this.row[this.propertyName] as number | Date;
  }
}

export function dateColumn<T>(options: Partial<IxCellDateComponent<T>>): Column<T, IxCellDateComponent<T>> {
  return { type: IxCellDateComponent, ...options };
}
