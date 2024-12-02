import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'ix-date',
  templateUrl: './ix-date.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    TranslateModule,
    FormatDateTimePipe,
  ],
})
export class IxDateComponent {
  /** Date must be in browser timezone */
  readonly date = input<number | Date>();

  machineTimezone: string;
  defaultTz: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  get machineTime(): Date {
    const utc = zonedTimeToUtc(this.date(), this.defaultTz);
    return utcToZonedTime(utc, this.machineTimezone);
  }

  get isTimezoneDifference(): boolean {
    return this.machineTime < this.date() || this.machineTime > this.date();
  }

  constructor(
    private localeService: LocaleService,
  ) {
    this.machineTimezone = this.localeService.timezone;
  }
}
