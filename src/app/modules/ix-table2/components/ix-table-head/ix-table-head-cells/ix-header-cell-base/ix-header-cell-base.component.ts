import { Component } from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-header-cell-base.component.html',
})
export class IxHeaderCellBaseComponent<T> {
  dataProvider: ArrayDataProvider<T>;
  column: TableColumn<T>;
}
