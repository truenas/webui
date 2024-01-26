import { Pipe, PipeTransform } from '@angular/core';
import { normalizeFileSizeBase10 } from 'app/helpers/filesize.utils';

@Pipe({
  name: 'base10Size',
})
export class Base10SizePipe implements PipeTransform {
  transform(
    value: number,
    { baseUnit }: { baseUnit: 'b' | 'B' },
  ): string {
    const [formatted, unit] = normalizeFileSizeBase10(value, baseUnit);

    return formatted + ' ' + unit;
  }
}
