import '@ngx-translate/core';

declare module '@ngx-translate/core' {
  interface TranslateService {
    instant(key: string, interpolateParams?: Record<string, unknown>): string;
  }
}
