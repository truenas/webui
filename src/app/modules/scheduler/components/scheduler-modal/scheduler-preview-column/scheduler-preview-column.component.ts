import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCalendarComponent, TnIconButtonComponent } from '@truenas/ui-components';
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
   * Where the preview starts counting from, as a wall clock in the system time zone — the
   * zone the schedule actually runs in, and the one the example times are shown in.
   *
   * The calendar pages in the browser's months, so the month on screen is the frame and
   * where "now" falls within it decides where counting starts. The two clocks disagree
   * about the date most of the day and about the *month* on the first and last day of one,
   * which is what made this worth spelling out: counting from the system clock while the
   * browser had already rolled over left the whole month on screen blank (NAS-142970).
   *
   * Null means there is nothing left to preview in the month on screen, because the system
   * time zone is already past the end of it — a month the user paged back to, and equally
   * the tail of the browser's current month once the system time zone has rolled over.
   *
   * `new Date()` is not a signal read, so "now" is memoized until `activeDate` — or
   * `timezone` — next changes, rather than tracking the wall clock. That is fine for a
   * modal: it cannot outlive a month rollover by long enough to matter, and navigating the
   * calendar — the only way to reach a stale month — invalidates it anyway.
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
