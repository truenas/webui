import { Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  template: '',
})
export class IxCellFromTemplateComponent<T> extends ColumnComponent<T> {}

export function fromTemplateColumn<T>(
  options: Partial<IxCellFromTemplateComponent<T>> = {},
): Column<T, IxCellFromTemplateComponent<T>> {
  return { type: IxCellFromTemplateComponent, ...options };
}
