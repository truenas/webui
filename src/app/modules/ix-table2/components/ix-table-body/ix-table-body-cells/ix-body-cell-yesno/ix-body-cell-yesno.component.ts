import { Component } from '@angular/core';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';

@Component({
  templateUrl: './ix-body-cell-yesno.component.html',
})
export class IxBodyCellYesNoComponent<T> extends IxBodyCellBaseComponent<T> {}
