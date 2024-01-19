import { Pipe, PipeTransform } from '@angular/core';
import prettyBytes from 'pretty-bytes';

@Pipe({
  name: 'bits',
})
export class BitSizePipe implements PipeTransform {
  transform(value: number): string {
    return prettyBytes(value, { bits: true });
  }
}
