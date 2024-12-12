import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { ScheduleToCrontabPipe } from 'app/modules/pipes/schedule-to-crontab/schedule-to-crontab.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-schedule',
  templateUrl: './ix-cell-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScheduleToCrontabPipe, TestDirective],
})
export class IxCellScheduleComponent<T> extends ColumnComponent<T> {}

export function scheduleColumn<T>(options: Partial<IxCellScheduleComponent<T>>): Column<T, IxCellScheduleComponent<T>> {
  return { type: IxCellScheduleComponent, ...options };
}
