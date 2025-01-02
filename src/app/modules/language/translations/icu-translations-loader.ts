import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslatedMessages } from 'app/interfaces/translated-messages.interface';

/**
 * Message format compiler treats empty strings in json as valid translations.
 * This filters them out.
 */
export class IcuTranslationsLoader extends TranslateHttpLoader {
  override getTranslation(lang: string): Observable<TranslatedMessages> {
    return super.getTranslation(lang).pipe(
      map((translations: TranslatedMessages) => {
        return Object.keys(translations).reduce((filteredMessages, key) => {
          if (translations[key] !== '') {
            filteredMessages[key] = translations[key];
          }

          return filteredMessages;
        }, {} as TranslatedMessages);
      }),
    );
  }
}

export function createTranslateLoader(http: HttpClient): IcuTranslationsLoader {
  return new IcuTranslationsLoader(http, './assets/i18n/', '.json');
}
