import { Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  template: '',
})
export class IxCellWithTemplateComponent<T> extends ColumnComponent<T> {}

export function withTemplateColumn<T>(
  options: Partial<IxCellWithTemplateComponent<T>> = {},
): Column<T, IxCellWithTemplateComponent<T>> {
  return { type: IxCellWithTemplateComponent, ...options };
}
