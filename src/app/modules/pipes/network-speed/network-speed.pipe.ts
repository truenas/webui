import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';

@Pipe({
  name: 'ixNetworkSpeed',
  standalone: true,
})
export class NetworkSpeedPipe implements PipeTransform {
  transform(value: number): string {
    return this.translate.instant('{bits}/s', {
      bits: buildNormalizedFileSize(value, 'b', 10),
    });
  }

  constructor(
    private translate: TranslateService,
  ) {}
}
