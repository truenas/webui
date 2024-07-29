import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'orNotAvailable',
  standalone: true,
})
export class OrNotAvailablePipe implements PipeTransform {
  transform<T>(value: T): T | string {
    return value ?? this.translate.instant('N/A');
  }

  constructor(
    private translate: TranslateService,
  ) {}
}
