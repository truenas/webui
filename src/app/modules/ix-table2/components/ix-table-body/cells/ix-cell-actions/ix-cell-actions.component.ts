import { Component } from '@angular/core';
import { CellActionConfig } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/cell-action-config.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-actions',
  templateUrl: './ix-cell-actions.component.html',
  styleUrls: ['./ix-cell-actions.component.scss'],
})
export class IxCellActionsComponent<T> extends ColumnComponent<T> {
  ixTestPrefix: string;
  actions: CellActionConfig<T>[];
}

export function actionsColumn<T>(
  options: Partial<IxCellActionsComponent<T>> & { actions: CellActionConfig<T>[]; ixTestPrefix: string },
): Column<T, IxCellActionsComponent<T>> {
  return { type: IxCellActionsComponent, ...options };
}
