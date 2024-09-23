import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-cell-actions',
  templateUrl: './ix-cell-actions.component.html',
  styleUrls: ['./ix-cell-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    RequiresRolesDirective,
    MatIconButton,
    TestIdModule,
    IxIconModule,
    AsyncPipe,
  ],
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
