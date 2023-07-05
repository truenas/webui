import { Component } from '@angular/core';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-header-cell-text.component.html',
})
export class IxHeaderCellTextComponent<T> extends ColumnComponent<T> {}
