import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appVersion',
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
