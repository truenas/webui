import { Component } from '@angular/core';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-delete.component.html',
})
export class IxCellDeleteComponent<T> implements ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  row: T;

  onRowDelete: (row: T) => void;
}
