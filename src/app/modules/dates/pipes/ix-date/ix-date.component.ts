import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { LocaleService } from 'app/modules/language/locale.service';

@Component({
  selector: 'ix-date',
  styleUrls: ['./ix-date.component.scss'],
  templateUrl: './ix-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    TranslateModule,
    FormatDateTimePipe,
  ],
})
export class IxDateComponent {
  /** Date must be in browser timezone */
  readonly date = input.required<number | Date>();

  machineTimezone: string;
  defaultTz: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  get machineTime(): Date {
    const utc = fromZonedTime(this.date(), this.defaultTz);
    return toZonedTime(utc, this.machineTimezone);
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
