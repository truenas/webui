import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

@Component({
  selector: 'ix-date',
  templateUrl: './ix-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDateComponent {
  @Input() date: number | Date;
  @Input() appliedTimezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
  @Input() machineTimezone: string;
  defaultTz: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  get machineTime(): Date {
    return utcToZonedTime(zonedTimeToUtc(this.date, this.appliedTimezone), this.machineTimezone);
  }

  get browserTime(): Date {
    return utcToZonedTime(zonedTimeToUtc(this.date, this.appliedTimezone), this.defaultTz);
  }

  get isTimezoneDifference(): boolean {
    return this.machineTime < this.date || this.machineTime > this.date;
  }
}
