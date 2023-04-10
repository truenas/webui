import '@ngx-translate/core';

declare module '@ngx-translate/core/lib/translate.service' {
  interface TranslateService {
    instant(key: string, interpolateParams?: Record<string, unknown>): string;
  }
}
