import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCalendarComponent, TnIconButtonComponent } from '@truenas/ui-components';
import {
  isBefore, isSameMonth, startOfMonth,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { SchedulerDateExamplesComponent } from 'app/modules/scheduler/components/scheduler-modal/scheduler-date-examples/scheduler-date-examples.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';

@Component({
  selector: 'ix-scheduler-preview-column',
  templateUrl: './scheduler-preview-column.component.html',
  styleUrls: ['./scheduler-preview-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    TnCalendarComponent,
    SchedulerDateExamplesComponent,
    TranslateModule,
    CrontabExplanationPipe,
  ],
})
export class SchedulerPreviewColumnComponent {
  readonly crontab = input.required<string>();
  readonly timezone = input.required<string>();

  readonly startTime = input<string>();
  readonly endTime = input<string>();

  readonly closeRequested = output();

  /** The month currently on screen. The calendar owns navigation; this mirrors it. */
  protected readonly activeDate = signal<Date>(new Date());

  private readonly isPastMonth = computed(() => isBefore(this.activeDate(), startOfMonth(new Date())));

  /**
   * Where the preview starts counting from: right now while the month on screen is still
   * running, otherwise the first of whichever month is being viewed.
   *
   * The month this lands in has to be the month the calendar is showing — `markedDates`
   * places run days within it. Near a month boundary the system time zone and the browser
   * disagree about which month "now" is in, and either one can be the month on screen, so
   * try both clocks before falling back to the first of the month. Falling back too eagerly
   * would rewind into a month already half over and mark days that have already passed.
   */
  protected readonly startDate = computed(() => {
    const activeDate = this.activeDate();
    const now = new Date();
    const zonedNow = toZonedTime(now, this.timezone());

    if (isSameMonth(zonedNow, activeDate)) {
      return zonedNow;
    }

    if (isSameMonth(now, activeDate)) {
      return now;
    }

    return startOfMonth(activeDate);
  });

  protected readonly cronPreview = computed<CronSchedulePreview | null>(() => {
    if (this.isPastMonth()) {
      return null;
    }

    try {
      return new CronSchedulePreview({
        crontab: this.crontab(),
        startTime: this.startTime(),
        endTime: this.endTime(),
      });
    } catch (error: unknown) {
      console.error(error);
      return null;
    }
  });

  /** The days of the month on screen that the task is scheduled to run on. */
  protected readonly markedDates = computed<Date[]>(() => {
    const cronPreview = this.cronPreview();
    if (!cronPreview) {
      return [];
    }

    const startDate = this.startDate();

    return [...cronPreview.getNextDaysInMonthWithRuns(startDate)]
      .map((day) => new Date(startDate.getFullYear(), startDate.getMonth(), day));
  });
}
