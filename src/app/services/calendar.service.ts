import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Option } from '../interfaces/option.interface';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  constructor(
    private translate: TranslateService,
  ) {}

  getCalendarOptions(): Option[] {
    return [
      {
        label: this.translate.instant('Monday'),
        value: 1,
      }, {
        label: this.translate.instant('Tuesday'),
        value: 2,
      }, {
        label: this.translate.instant('Wednesday'),
        value: 3,
      }, {
        label: this.translate.instant('Thursday'),
        value: 4,
      }, {
        label: this.translate.instant('Friday'),
        value: 5,
      }, {
        label: this.translate.instant('Saturday'),
        value: 6,
      }, {
        label: this.translate.instant('Sunday'),
        value: 7,
      },
    ];
  }
}
