import {
  ChangeDetectionStrategy, Component, Input, OnChanges, TrackByFunction,
} from '@angular/core';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
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
  @Input() machineTimezone: string;

  protected localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  trackByIndex: TrackByFunction<number> = (index: number): number => index;
  scheduleExamples: Date[] = [];

  readonly maxExamples = 25;

  ngOnChanges(): void {
    this.scheduleExamples = this.cronPreview.listNextRunsInMonth(
      this.startDate,
      this.maxExamples + 1,
      this.machineTimezone,
    );
  }

  convertTimezone(date: Date, tz: string): Date {
    return utcToZonedTime(zonedTimeToUtc(date, Intl.DateTimeFormat().resolvedOptions().timeZone), tz);
  }
}
