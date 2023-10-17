import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-actions',
  templateUrl: './ix-cell-actions.component.html',
  styleUrls: ['./ix-cell-actions.component.scss'],
})
export class IxCellActionsComponent<T> extends ColumnComponent<T> {
  actions: {
    iconName: string;
    tooltip?: string;
    onClick: (row: T) => void;
    dynamicTooltip?: (row: T) => Observable<string>;
    hidden?: (row: T) => Observable<boolean>;
    disabled?: (row: T) => Observable<boolean>;
  }[];
}

export function actionsColumn<T>(
  options: Partial<IxCellActionsComponent<T>>,
): Column<T, IxCellActionsComponent<T>> {
  return { type: IxCellActionsComponent, ...options };
}
