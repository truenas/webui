import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appVersion',
  standalone: true,
})
export class AppVersionPipe implements PipeTransform {
  transform(value: string): string {
    if (value?.startsWith('v')) {
      return value;
    }

    if (!value) {
      return '';
    }

    return `v${value}`;
  }
}
