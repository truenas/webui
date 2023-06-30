import { Component } from '@angular/core';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';

@Component({
  templateUrl: './ix-body-cell-size.component.html',
})
export class IxBodyCellSizeComponent<T> extends IxBodyCellBaseComponent<T> {
  constructor(
    private formatter: IxFormatterService,
  ) {
    super();
  }

  get size(): string {
    return this.formatter.convertBytesToHumanReadable(this.value as number);
  }
}
