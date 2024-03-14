import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { utcToZonedTime } from 'date-fns-tz';
import { LocaleService } from 'app/services/locale.service';

@Component({
  templateUrl: './ix-date.component.html',
  selector: 'ix-date',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDateComponent {
  @Input() date: number | Date;
  @Input() dateFormat: string = null;
  @Input() timeFormat: string = null;

  get serverTime(): Date {
    return utcToZonedTime(this.date, this.localeService.timezone);
  }

  get serverTimezone(): string {
    return this.localeService.timezone;
  }

  constructor(
    private localeService: LocaleService,
  ) { }
}
