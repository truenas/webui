import { TranslateService } from '@ngx-translate/core';

export const fakeTranslateService = {
  instant: (str) => str,
  get: (str) => of(str),
} as TranslateService;
jest.spyOn(fakeTranslateService, 'instant');
