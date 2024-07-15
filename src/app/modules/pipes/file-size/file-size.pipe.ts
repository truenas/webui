import { Pipe, PipeTransform } from '@angular/core';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';

@Pipe({
  name: 'ixFileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  transform(value: number): string {
    return buildNormalizedFileSize(value, 'B', 2);
  }
}
