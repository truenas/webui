import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-cell-template',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class IxCellTemplateComponent<T> extends ColumnComponent<T> {}

export function templateColumn<T>(
  options: Partial<IxCellTemplateComponent<T>> = {},
): Column<T, IxCellTemplateComponent<T>> {
  return { type: IxCellTemplateComponent, ...options };
}
