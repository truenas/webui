import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-actions-with-menu',
  templateUrl: './ix-cell-actions-with-menu.component.html',
  styleUrls: ['./ix-cell-actions-with-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    RequiresRolesDirective,
    MatIconButton,
    IxIconComponent,
    AsyncPipe,
    TestDirective,
    TranslateModule,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
  ],
})
export class IxCellActionsWithMenuComponent<T> extends ColumnComponent<T> {
  actions: IconActionConfig<T>[];
  Role = Role;

  get editAction(): IconActionConfig<T> | undefined {
    return this.actions?.find((action) => action.iconName === 'edit');
  }

  get otherActions(): IconActionConfig<T>[] {
    return this.actions?.filter((action) => action.iconName !== 'edit') || [];
  }
}

export function actionsWithMenuColumn<T>(
  options: Partial<IxCellActionsWithMenuComponent<T>>,
): Column<T, IxCellActionsWithMenuComponent<T>> {
  return { type: IxCellActionsWithMenuComponent, ...options };
}
