import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslatedString, translateOptions } from 'app/modules/translate/translate.helper';

@Pipe({
  name: 'translateOptions',
})
export class TranslateOptionsPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform<
    Value,
    OptionLike extends { label: string; value: Value },
  >(
    options$: Observable<OptionLike[]>,
  ): Observable<(Omit<OptionLike, 'label'> & { label: TranslatedString })[]> {
    return options$.pipe(
      map((options) => translateOptions(this.translate, options)),
    );
  }
}
