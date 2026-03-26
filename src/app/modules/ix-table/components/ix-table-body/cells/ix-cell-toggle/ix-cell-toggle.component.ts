import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
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
  imports: [
    MatSlideToggle,
    MatTooltip,
    RequiresRolesDirective,
    TranslateModule,
    AsyncPipe,
    TestDirective,
  ],
})
export class IxCellToggleComponent<T> extends ColumnComponent<T> {
  requiredRoles: Role[] = [];
  onRowToggle: (row: T, checked: boolean, toggle: MatSlideToggle) => void;
  dynamicRequiredRoles?: (row: T) => Observable<Role[]>;
  isDisabled?: (row: T) => boolean;
  getDisabledTooltip?: (row: T) => string;

  get checked(): boolean {
    return this.value as boolean;
  }

  get disabled(): boolean {
    return this.isDisabled ? this.isDisabled(this.row()) : false;
  }

  get tooltip(): string {
    return this.disabled && this.getDisabledTooltip ? this.getDisabledTooltip(this.row()) : '';
  }

  onSlideToggleChanged(event: MatSlideToggleChange): void {
    this.onRowToggle(this.row(), event.checked, event.source);
  }
}

export function toggleColumn<T>(options: Partial<IxCellToggleComponent<T>>): Column<T, IxCellToggleComponent<T>> {
  return { type: IxCellToggleComponent, ...options };
}
