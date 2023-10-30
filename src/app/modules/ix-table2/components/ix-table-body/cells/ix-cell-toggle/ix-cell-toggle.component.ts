import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-toggle',
  templateUrl: './ix-cell-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellToggleComponent<T> extends ColumnComponent<T> {
  onRowToggle: (row: T, checked: boolean) => void;

  get checked(): boolean {
    return this.value as boolean;
  }

  onSlideToggleChanged(event: MatSlideToggleChange): void {
    this.onRowToggle(this.row, event.checked);
  }
}

export function toggleColumn<T>(options: Partial<IxCellToggleComponent<T>>): Column<T, IxCellToggleComponent<T>> {
  return { type: IxCellToggleComponent, ...options };
}
