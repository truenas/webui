import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Role } from 'app/enums/role.enum';
import { IconActionConfig } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-actions',
  templateUrl: './ix-cell-actions.component.html',
  styleUrls: ['./ix-cell-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellActionsComponent<T> extends ColumnComponent<T> {
  actions: IconActionConfig<T>[];
  Role = Role;
}

export function actionsColumn<T>(
  options: Partial<IxCellActionsComponent<T>>,
): Column<T, IxCellActionsComponent<T>> {
  return { type: IxCellActionsComponent, ...options };
}
