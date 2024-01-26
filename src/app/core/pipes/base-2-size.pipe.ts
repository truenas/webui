import { Pipe, PipeTransform } from '@angular/core';
import { normalizeFileSizeBase2 } from 'app/helpers/filesize.utils';

@Pipe({
  name: 'base2Size',
})
export class Base2SizePipe implements PipeTransform {
  transform(
    value: number,
    { baseUnit }: { baseUnit: 'b' | 'B' },
  ): string {
    const [formatted, unit] = normalizeFileSizeBase2(value, baseUnit);

    return formatted + ' ' + unit;
  }
}
