import { Pipe, PipeTransform } from '@angular/core';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';

@Pipe({
  name: 'ixFileSize',
})
export class IxFileSizePipe implements PipeTransform {
  transform(
    value: number,
    { baseUnit, base }: { baseUnit: 'b' | 'B'; base: 10 | 2 } = { baseUnit: 'B', base: 2 },
  ): string {
    return buildNormalizedFileSize(value, baseUnit, base);
  }
}
