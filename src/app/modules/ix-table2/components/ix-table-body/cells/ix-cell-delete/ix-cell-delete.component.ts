import { Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-delete.component.html',
})
export class IxCellDeleteComponent<T> extends ColumnComponent<T> {
  onRowDelete: (row: T) => void;
}

export function deleteColumn<T>(options: Partial<IxCellDeleteComponent<T>>): Column<T, IxCellDeleteComponent<T>> {
  return { type: IxCellDeleteComponent, ...options };
}
