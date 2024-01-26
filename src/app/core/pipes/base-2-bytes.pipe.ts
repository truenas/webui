import { Pipe, PipeTransform } from '@angular/core';
import { base2Conversion } from 'app/helpers/filesize.utils';

@Pipe({
  name: 'base2Bytes',
})
export class Base2BytesPipe implements PipeTransform {
  transform(
    value: number,
    { bits }: { bits: boolean } = { bits: false },
  ): string {
    const bitByte = bits ? 'b' : 'B';
    const [formatted, unit] = base2Conversion(value, bitByte);

    return formatted + ' ' + unit;
  }
}
