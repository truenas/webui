import { Component } from '@angular/core';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';

@Component({
  templateUrl: './ix-body-cell-delete.component.html',
})
export class IxBodyCellDeleteComponent<T> extends IxBodyCellBaseComponent<T> {
  onRowDelete: (row: T) => void;
}
