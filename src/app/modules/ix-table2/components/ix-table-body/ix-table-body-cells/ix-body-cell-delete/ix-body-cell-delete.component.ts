import { Component, OnInit } from '@angular/core';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';
import { TableColumnDeleteOptions } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-body-cell-delete.component.html',
})
export class IxBodyCellDeleteComponent<T> extends IxBodyCellBaseComponent<T> implements OnInit {
  onRowDelete: (row: T) => void;

  ngOnInit(): void {
    this.onRowDelete = (this.column.options as TableColumnDeleteOptions<T>).onRowDelete;
  }
}
