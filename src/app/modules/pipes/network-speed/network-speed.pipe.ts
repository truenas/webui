import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';

@Pipe({
  name: 'ixNetworkSpeed',
})
export class NetworkSpeedPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: number): string {
    return this.translate.instant('{bits}/s', {
      bits: buildNormalizedFileSize(value, 'b', 10),
    });
  }
}
