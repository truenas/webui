import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatCalendar } from '@angular/material/datepicker';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker/calendar-body';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  getDate, isBefore,
  startOfMonth, differenceInCalendarMonths, format,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';

@UntilDestroy()
@Component({
  selector: 'ix-scheduler-preview-column',
  templateUrl: './scheduler-preview-column.component.html',
  styleUrls: ['./scheduler-preview-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerPreviewColumnComponent implements OnChanges, OnInit {
  @Input() crontab: string;
  @Input() timezone: string;

  @Input() startTime: string;
  @Input() endTime: string;

  scheduleExamples: Date[] = [];

  /**
   * 1 for 1st day of the month, etc.
   */
  highlightedCalendarDays = new Set<number>();

  cronPreview: CronSchedulePreview;

  @ViewChild('calendar', { static: true }) calendar: MatCalendar<Date>;

  get zonedStartDate(): string {
    const dateFormat = 'yyyy-MM-dd HH:mm:ss';
    const now = utcToZonedTime(new Date(), this.timezone);
    if (!this.calendar.activeDate || differenceInCalendarMonths(this.calendar.activeDate, new Date()) < 1) {
      return format(now, dateFormat);
    }

    const startDate = startOfMonth(this.calendar.activeDate);
    return format(startDate, dateFormat);
  }

  get isPastMonth(): boolean {
    return isBefore(this.calendar.activeDate, startOfMonth(new Date()));
  }

  ngOnInit(): void {
    this.calendar.stateChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onCalendarUpdated());
  }

  ngOnChanges(): void {
    this.updatePreviewDates();
    this.refreshCalendar();
  }

  getSelectedDateClass: MatCalendarCellClassFunction<Date> = (dateInCalendar): string => {
    const dayNumber = getDate(dateInCalendar);
    if (this.highlightedCalendarDays.has(dayNumber)) {
      return 'highlighted-date';
    }

    return '';
  };

  onCalendarUpdated(): void {
    this.updatePreviewDates();
  }

  private updatePreviewDates(): void {
    if (this.isPastMonth) {
      this.cronPreview = null;
      this.highlightedCalendarDays = new Set();
      return;
    }

    try {
      this.cronPreview = new CronSchedulePreview({
        crontab: this.crontab,
        timezone: this.timezone,
        startTime: this.startTime,
        endTime: this.endTime,
      });

      this.highlightedCalendarDays = this.cronPreview.getNextDaysInMonthWithRuns(this.zonedStartDate);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  private refreshCalendar(): void {
    if (!this.calendar.monthView) {
      return;
    }

    this.calendar.updateTodaysDate();
  }
}
