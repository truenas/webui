import { Pipe, PipeTransform } from '@angular/core';
import { base10Conversion } from 'app/helpers/filesize.utils';

@Pipe({
  name: 'base10Bytes',
})
export class Base10BytesPipe implements PipeTransform {
  transform(
    value: number,
    { bits }: { bits: boolean } = { bits: false },
  ): string {
    const bitByte = bits ? 'b' : 'B';
    const [formatted, unit] = base10Conversion(value, bitByte);

    return formatted + ' ' + unit;
  }
}
