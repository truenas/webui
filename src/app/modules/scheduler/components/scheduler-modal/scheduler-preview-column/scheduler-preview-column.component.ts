import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCalendarComponent, TnIconButtonComponent, TnTestIdDirective } from '@truenas/ui-components';
import {
  endOfMonth, isAfter, isBefore, startOfMonth,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { SchedulerDateExamplesComponent } from 'app/modules/scheduler/components/scheduler-modal/scheduler-date-examples/scheduler-date-examples.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';

interface SchedulePreview {
  cron: CronSchedulePreview;
  /** Where counting starts, as a wall clock in the system time zone. */
  startDate: Date;
}

@Component({
  selector: 'ix-scheduler-preview-column',
  templateUrl: './scheduler-preview-column.component.html',
  styleUrls: ['./scheduler-preview-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
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
  private readonly activeDate = signal<Date>(new Date());

  /**
   * Where the preview starts counting, as a wall clock in the system time zone the schedule runs in.
   * The calendar pages in browser months, and the two clocks can disagree about the month, so
   * counting from the wrong one can blank the whole month on screen. Null when the system zone is
   * already past the month shown. "Now" is memoized until `activeDate` or `timezone` changes, which
   * is fine for a modal: navigating the calendar invalidates it.
   */
  protected readonly startDate = computed<Date | null>(() => {
    const activeDate = this.activeDate();
    const zonedNow = toZonedTime(new Date(), this.timezone());

    if (isBefore(zonedNow, startOfMonth(activeDate))) {
      return startOfMonth(activeDate);
    }

    if (isAfter(zonedNow, endOfMonth(activeDate))) {
      return null;
    }

    return zonedNow;
  });

  protected readonly preview = computed<SchedulePreview | null>(() => {
    const startDate = this.startDate();
    if (!startDate) {
      return null;
    }

    try {
      return {
        startDate,
        cron: new CronSchedulePreview({
          crontab: this.crontab(),
          startTime: this.startTime(),
          endTime: this.endTime(),
        }),
      };
    } catch (error: unknown) {
      // Reachable: the scheduler modal withholds `crontab` while the form is *editing*
      // invalid input, but its initial value is round-tripped straight from the task's saved
      // crontab with no such check, so a malformed expression stored server-side lands here.
      // Logging from a computed is a side effect, but it is memoized to at most once per
      // crontab and there is no user-facing state to report the failure through.
      console.error(error);
      return null;
    }
  });

  /** The days of the month on screen that the task is scheduled to run on. */
  protected readonly markedDates = computed<Date[]>(() => {
    const preview = this.preview();
    if (!preview) {
      return [];
    }

    const { cron, startDate } = preview;

    return [...cron.getNextDaysInMonthWithRuns(startDate)]
      .map((day) => new Date(startDate.getFullYear(), startDate.getMonth(), day));
  });

  protected onActiveDateChange(date: Date): void {
    this.activeDate.set(date);
  }
}
