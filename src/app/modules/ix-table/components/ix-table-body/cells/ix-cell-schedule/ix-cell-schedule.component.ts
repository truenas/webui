import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-cell-schedule',
  templateUrl: './ix-cell-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellScheduleComponent<T> extends ColumnComponent<T> {}

export function scheduleColumn<T>(options: Partial<IxCellScheduleComponent<T>>): Column<T, IxCellScheduleComponent<T>> {
  return { type: IxCellScheduleComponent, ...options };
}
