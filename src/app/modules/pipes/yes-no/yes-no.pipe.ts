import { Injectable, Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'yesNo',
})
@Injectable({
  providedIn: 'root',
})
export class YesNoPipe implements PipeTransform {
  private translate = inject(TranslateService);


  transform(value: unknown): string {
    return value ? this.translate.instant('Yes') : this.translate.instant('No');
  }
}
