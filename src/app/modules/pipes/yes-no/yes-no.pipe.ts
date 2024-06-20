import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'yesNo',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class YesNoPipe implements PipeTransform {
  constructor(
    private translate: TranslateService,
  ) {}

  transform(value: unknown): string {
    return value ? this.translate.instant('Yes') : this.translate.instant('No');
  }
}
