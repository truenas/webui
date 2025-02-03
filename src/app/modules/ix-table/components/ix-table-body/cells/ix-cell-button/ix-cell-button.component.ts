import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-button',
  templateUrl: './ix-cell-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
  ],
})
export class IxCellButtonComponent<T> extends ColumnComponent<T> {
  onClick: (row: T) => void;
  text = '';
  requiredRoles: Role[] = [];
}

export function buttonColumn<T>(options: Partial<IxCellButtonComponent<T>>): Column<T, IxCellButtonComponent<T>> {
  return { type: IxCellButtonComponent, ...options };
}
