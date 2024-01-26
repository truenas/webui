import { Pipe, PipeTransform } from '@angular/core';
import { normalizeFileSizeBase10 } from 'app/helpers/filesize.utils';

@Pipe({
  name: 'fileSizeBase10',
})
export class FileSizeBase10Pipe implements PipeTransform {
  transform(
    value: number,
    { baseUnit }: { baseUnit: 'b' | 'B' },
  ): string {
    const [formatted, unit] = normalizeFileSizeBase10(value, baseUnit);

    return formatted + ' ' + unit;
  }
}
