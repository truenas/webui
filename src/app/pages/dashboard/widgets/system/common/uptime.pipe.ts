import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'uptime',
  standalone: true,
})
export class UptimePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(uptime: number, dateTime: string): string {
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor(uptime % (3600 * 24) / 3600);
    const minutes = Math.floor(uptime % 3600 / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStrings = [];

    if (days > 0) {
      uptimeStrings.push(this.translate.instant('{days, plural, =1 {# day} other {# days}}', { days }));
    }

    if (hours > 0) {
      uptimeStrings.push(this.translate.instant('{hours, plural, =1 {# hour} other {# hours}}', { hours }));
    }

    if (minutes > 0) {
      uptimeStrings.push(this.translate.instant('{minutes, plural, =1 {# minute} other {# minutes}}', { minutes }));
    }

    if (seconds > 0 && hours < 1 && days === 0) {
      uptimeStrings.push(this.translate.instant('{seconds, plural, =1 {# second} other {# seconds}}', { seconds }));
    }

    if (uptimeStrings.length === 0) {
      return this.translate.instant('N/A');
    }

    const uptimeString = uptimeStrings.join(' ');
    const dateTimeString = dateTime ? this.translate.instant(' as of {dateTime}', { dateTime }) : '';
    return uptimeString + dateTimeString;
  }
}
