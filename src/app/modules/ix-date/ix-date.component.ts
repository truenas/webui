import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

@Component({
  templateUrl: './ix-date.component.html',
  selector: 'ix-date',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDateComponent {
  @Input() date: number | Date;
  @Input() dateFormat: string = null;
  @Input() timeFormat: string = null;
  @Input() tooltipTimezone: string;
  @Input() defaultTimezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  get tooltipTime(): Date {
    return utcToZonedTime(zonedTimeToUtc(this.date, this.defaultTimezone), this.tooltipTimezone);
  }

  get isTimezoneDifference(): boolean {
    return this.tooltipTime < this.date || this.tooltipTime > this.date;
  }
}
