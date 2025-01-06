import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-toggle',
  templateUrl: './ix-cell-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatSlideToggle,
    RequiresRolesDirective,
    TranslateModule,
    AsyncPipe,
    TestDirective,
  ],
})
export class IxCellToggleComponent<T> extends ColumnComponent<T> {
  requiredRoles: Role[];
  onRowToggle: (row: T, checked: boolean, toggle: MatSlideToggle) => void;
  dynamicRequiredRoles?: (row: T) => Observable<Role[]>;

  get checked(): boolean {
    return this.value as boolean;
  }

  onSlideToggleChanged(event: MatSlideToggleChange): void {
    this.onRowToggle(this.row(), event.checked, event.source);
  }
}

export function toggleColumn<T>(options: Partial<IxCellToggleComponent<T>>): Column<T, IxCellToggleComponent<T>> {
  return { type: IxCellToggleComponent, ...options };
}
