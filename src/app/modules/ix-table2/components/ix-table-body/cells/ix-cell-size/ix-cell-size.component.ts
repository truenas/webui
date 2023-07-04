import { Component } from '@angular/core';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-size.component.html',
})
export class IxCellSizeComponent<T> implements ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  row: T;

  constructor(
    private formatter: IxFormatterService,
  ) {}

  get size(): string {
    return this.formatter.convertBytesToHumanReadable(this.row[this.propertyName] as number);
  }
}
