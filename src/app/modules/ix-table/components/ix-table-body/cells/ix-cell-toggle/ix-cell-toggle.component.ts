import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-toggle',
  templateUrl: './ix-cell-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellToggleComponent<T> extends ColumnComponent<T> {
  requiredRoles: Role[];
  onRowToggle: (row: T, checked: boolean) => void;
  dynamicRequiredRoles: (row: T) => Observable<Role[]>;

  get checked(): boolean {
    return this.value as boolean;
  }

  onSlideToggleChanged(event: MatSlideToggleChange): void {
    this.onRowToggle(this.row, event.checked);
  }

  getAriaLabel(row: T): string {
    return this.ariaLabels(row).join(' ');
  }
}

export function toggleColumn<T>(options: Partial<IxCellToggleComponent<T>>): Column<T, IxCellToggleComponent<T>> {
  return { type: IxCellToggleComponent, ...options };
}
