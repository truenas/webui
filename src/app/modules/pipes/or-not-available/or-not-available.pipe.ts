import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'orNotAvailable',
})
export class OrNotAvailablePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform<T>(value: T): T | string {
    return value ?? this.translate.instant('N/A');
  }
}
