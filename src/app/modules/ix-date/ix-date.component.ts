import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'ix-date',
  templateUrl: './ix-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDateComponent {
  /** Must be in browser timezone */
  @Input() date: number | Date;
  machineTimezone: string;
  defaultTz: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  get machineTime(): Date {
    const utc = zonedTimeToUtc(this.date, this.defaultTz);
    return utcToZonedTime(utc, this.machineTimezone);
  }

  get isTimezoneDifference(): boolean {
    return this.machineTime < this.date || this.machineTime > this.date;
  }

  constructor(
    private localeService: LocaleService,
  ) {
    this.machineTimezone = this.localeService.timezone;
  }
}
