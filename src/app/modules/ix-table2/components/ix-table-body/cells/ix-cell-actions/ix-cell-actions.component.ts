import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-actions.component.html',
  styleUrls: ['./ix-cell-actions.component.scss'],
})
export class IxCellInlineIconActionsComponent<T> extends ColumnComponent<T> {
  actions: {
    iconName: string;
    onClick: (row: T) => void;
    tooltip?: string;
    hidden?: (row: T) => Observable<boolean>;
  }[];
}

export function inlineIconActionsColumn<T>(
  options: Partial<IxCellInlineIconActionsComponent<T>>,
): Column<T, IxCellInlineIconActionsComponent<T>> {
  return { type: IxCellInlineIconActionsComponent, ...options };
}
