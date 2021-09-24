import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

export const fakeTranslateService = {
  instant: (str) => str,
  get: (str) => of(str),
} as TranslateService;
jest.spyOn(fakeTranslateService, 'instant');
