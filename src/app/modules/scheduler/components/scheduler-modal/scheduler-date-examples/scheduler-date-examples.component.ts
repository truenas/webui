import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';

@Component({
  selector: 'ix-scheduler-date-examples',
  templateUrl: './scheduler-date-examples.component.html',
  styleUrls: ['./scheduler-date-examples.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerDateExamplesComponent implements OnChanges {
  @Input() cronPreview: CronSchedulePreview;
  @Input() startDate: Date;

  scheduleExamples: Date[] = [];

  readonly maxExamples = 25;

  ngOnChanges(): void {
    this.scheduleExamples = this.cronPreview.listNextRunsInMonth(
      this.startDate,
      this.maxExamples + 1,
    );
  }
}
