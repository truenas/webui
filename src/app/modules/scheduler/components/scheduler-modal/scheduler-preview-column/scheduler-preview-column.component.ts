import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCalendarComponent, TnIconButtonComponent } from '@truenas/ui-components';
import {
  isBefore, startOfMonth, differenceInCalendarMonths,
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

  protected readonly isPastMonth = computed(() => isBefore(this.activeDate(), startOfMonth(new Date())));

  /**
   * Where the preview starts counting from: right now while the current month is on
   * screen, otherwise the first of whichever month is being viewed.
   */
  protected readonly startDate = computed(() => {
    const activeDate = this.activeDate();
    if (differenceInCalendarMonths(activeDate, new Date()) < 1) {
      return toZonedTime(new Date(), this.timezone());
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

    try {
      return [...cronPreview.getNextDaysInMonthWithRuns(startDate)]
        .map((day) => new Date(startDate.getFullYear(), startDate.getMonth(), day));
    } catch (error: unknown) {
      console.error(error);
      return [];
    }
  });
}
