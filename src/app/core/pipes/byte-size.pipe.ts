import { Pipe, PipeTransform } from '@angular/core';
import prettyBytes from 'pretty-bytes';

@Pipe({
  name: 'bytes',
})
export class ByteSizePipe implements PipeTransform {
  transform(value: number, { binary }: { binary: boolean } = { binary: true }): string {
    return prettyBytes(value, { binary });
  }
}
