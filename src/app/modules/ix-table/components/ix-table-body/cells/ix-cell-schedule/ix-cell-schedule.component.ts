import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-schedule',
  templateUrl: './ix-cell-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TestDirective, ScheduleDescriptionPipe, MatTooltip, CastPipe],
})
export class IxCellScheduleComponent<T> extends ColumnComponent<T> {}

export function scheduleColumn<T>(options: Partial<IxCellScheduleComponent<T>>): Column<T, IxCellScheduleComponent<T>> {
  return { type: IxCellScheduleComponent, ...options };
}
