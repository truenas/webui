import { Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-text.component.html',
})
export class IxCellTextComponent<T> extends ColumnComponent<T> {
  get value(): T[keyof T] {
    return this.row[this.propertyName];
  }
}

export function textColumn<T>(options: Partial<IxCellTextComponent<T>>): Column<T, IxCellTextComponent<T>> {
  return { type: IxCellTextComponent, ...options };
}
