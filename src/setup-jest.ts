import 'jest-preset-angular/setup-jest';
import { APP_BASE_HREF } from '@angular/common';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { defineGlobalsInjections } from '@ngneat/spectator';
import {
  MissingTranslationHandler, TranslateCompiler, TranslateLoader, TranslateModule, TranslateFakeLoader,
} from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { MaterialModule } from 'app/app-material.module';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';

jest.setTimeout(30 * 1000);

defineGlobalsInjections({
  imports: [
    MaterialModule,
    RouterModule.forRoot([]),
    CommonDirectivesModule,
    NgxFilesizeModule,
    CastModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useClass: TranslateFakeLoader,
      },
      compiler: {
        provide: TranslateCompiler,
        useClass: TranslateMessageFormatCompiler,
      },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: IcuMissingTranslationHandler,
      },
      useDefaultLang: false,
    }),
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '',
    },
    {
      provide: MATERIAL_SANITY_CHECKS,
      useValue: false,
    },
  ],
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const localStorageMock = (() => {
  let store: { [key: string]: unknown } = {};
  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: unknown) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
