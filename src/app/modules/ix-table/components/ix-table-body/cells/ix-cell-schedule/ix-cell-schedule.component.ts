import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-schedule',
  templateUrl: './ix-cell-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellScheduleComponent<T> extends ColumnComponent<T> {}

export function scheduleColumn<T>(options: Partial<IxCellScheduleComponent<T>>): Column<T, IxCellScheduleComponent<T>> {
  return { type: IxCellScheduleComponent, ...options };
}
