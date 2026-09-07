import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnChanges, OnInit, Signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDialogClose } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import {
  endOfMonth, getDate, isAfter, isBefore, startOfMonth,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';
import { SchedulerDateExamplesComponent } from 'app/modules/scheduler/components/scheduler-modal/scheduler-date-examples/scheduler-date-examples.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

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
    TestDirective,
    MatDialogClose,
    TnIconButtonComponent,
    MatCalendar,
    SchedulerDateExamplesComponent,
    TranslateModule,
    CrontabExplanationPipe,
  ],
})
export class SchedulerPreviewColumnComponent implements OnChanges, OnInit {
  private destroyRef = inject(DestroyRef);

  readonly crontab = input.required<string>();
  readonly timezone = input.required<string>();

  readonly startTime = input<string>();
  readonly endTime = input<string>();

  /**
   * 1 for 1st day of the month, etc.
   */
  highlightedCalendarDays = new Set<number>();

  /**
   * Null means there is nothing to preview in the month on screen: the system time zone
   * is already past the end of it, or the crontab failed to parse. The marked days and the
   * example list are both derived from this, so they cannot disagree about the start date.
   */
  preview: SchedulePreview | null = null;

  readonly calendar: Signal<MatCalendar<Date>> = viewChild.required('calendar', { read: MatCalendar });

  ngOnChanges(): void {
    this.updatePreviewDates();
    this.refreshCalendar();
  }

  ngOnInit(): void {
    this.calendar().stateChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onCalendarUpdated());
  }

  getSelectedDateClass: MatCalendarCellClassFunction<Date> = (dateInCalendar): string => {
    const dayNumber = getDate(dateInCalendar);
    if (this.highlightedCalendarDays.has(dayNumber)) {
      return 'highlighted-date';
    }

    return '';
  };

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
   */
  private getStartDate(): Date | null {
    const activeDate = this.calendar().activeDate || new Date();
    const zonedNow = toZonedTime(new Date(), this.timezone());

    if (isBefore(zonedNow, startOfMonth(activeDate))) {
      return startOfMonth(activeDate);
    }

    if (isAfter(zonedNow, endOfMonth(activeDate))) {
      return null;
    }

    return zonedNow;
  }

  private onCalendarUpdated(): void {
    this.updatePreviewDates();
  }

  private updatePreviewDates(): void {
    const startDate = this.getStartDate();
    if (!startDate) {
      this.preview = null;
      this.highlightedCalendarDays = new Set();
      return;
    }

    try {
      const cron = new CronSchedulePreview({
        crontab: this.crontab(),
        startTime: this.startTime(),
        endTime: this.endTime(),
      });

      this.preview = { cron, startDate };
      this.highlightedCalendarDays = cron.getNextDaysInMonthWithRuns(startDate);
    } catch (error: unknown) {
      console.error(error);
      this.preview = null;
      this.highlightedCalendarDays = new Set();
    }
  }

  private refreshCalendar(): void {
    if (!this.calendar().monthView) {
      return;
    }

    this.calendar().updateTodaysDate();
  }
}
