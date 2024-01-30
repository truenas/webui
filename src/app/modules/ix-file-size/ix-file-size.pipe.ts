import { Pipe, PipeTransform } from '@angular/core';
import { normalizeFileSize } from 'app/helpers/filesize.utils';

@Pipe({
  name: 'ixFileSize',
})
export class FileSizePipe implements PipeTransform {
  transform(
    value: number,
    { baseUnit, base }: { baseUnit: 'b' | 'B'; base: 10 | 2 } = { baseUnit: 'B', base: 2 },
  ): string {
    const [formatted, unit] = normalizeFileSize(value, baseUnit, base);

    return formatted + ' ' + unit;
  }
}
