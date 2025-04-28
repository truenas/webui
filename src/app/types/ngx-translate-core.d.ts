import '@ngx-translate/core';
import { TranslatedString } from 'app/helpers/translate.helper';

declare module '@ngx-translate/core' {
  interface TranslateService {
    instant(key: string, interpolateParams?: Record<string, unknown>): TranslatedString;
  }

  interface TranslatePipe {
    transform(query: string | undefined, ...args: unknown[]): TranslatedString;
  }
}
