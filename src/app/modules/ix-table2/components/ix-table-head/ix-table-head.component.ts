import { Component, Input } from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-table-head, thead[ix-table-head]',
  templateUrl: './ix-table-head.component.html',
  styleUrls: ['ix-table-head.component.scss'],
})
export class IxTableHeadComponent<T> {
  @Input() columns!: TableColumn<T>[];
  @Input() dataProvider!: ArrayDataProvider<T>;
}
