import { Component } from '@angular/core';
import { CellActionConfig } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/cell-action-config.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-actions',
  templateUrl: './ix-cell-actions.component.html',
  styleUrls: ['./ix-cell-actions.component.scss'],
})
export class IxCellActionsComponent<T> extends ColumnComponent<T> {
  actions: CellActionConfig<T>[];

  getRowId(): string {
    return (this.row as { id: unknown })?.id?.toString() || '';
  }
}

export function actionsColumn<T>(
  options: Partial<IxCellActionsComponent<T>>,
): Column<T, IxCellActionsComponent<T>> {
  return { type: IxCellActionsComponent, ...options };
}
