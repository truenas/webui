import { Component, OnInit } from '@angular/core';
import { format } from 'date-fns-tz';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';
import { TableColumnDateOptions } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-body-cell-date.component.html',
})
export class IxBodyCellDateComponent<T> extends IxBodyCellBaseComponent<T> implements OnInit {
  format: string;

  get formatDate(): string {
    return format(this.value as number | Date, this.format);
  }

  ngOnInit(): void {
    this.format = (this.column.options as TableColumnDateOptions<T>).format;
  }
}
