import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Weekday } from 'app/enums/weekday.enum';
import { Option } from 'app/interfaces/option.interface';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  constructor(
    private translate: TranslateService,
  ) {}

  getWeekdayOptions(): Option[] {
    return [
      {
        label: this.translate.instant('Monday'),
        value: Weekday.Monday,
      }, {
        label: this.translate.instant('Tuesday'),
        value: Weekday.Tuesday,
      }, {
        label: this.translate.instant('Wednesday'),
        value: Weekday.Wednesday,
      }, {
        label: this.translate.instant('Thursday'),
        value: Weekday.Thursday,
      }, {
        label: this.translate.instant('Friday'),
        value: Weekday.Friday,
      }, {
        label: this.translate.instant('Saturday'),
        value: Weekday.Saturday,
      }, {
        label: this.translate.instant('Sunday'),
        value: Weekday.Sunday,
      },
    ];
  }
}
