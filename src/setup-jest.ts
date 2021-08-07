import 'jest-preset-angular/setup-jest';
import { APP_BASE_HREF } from '@angular/common';
import { RouterModule } from '@angular/router';
import { defineGlobalsInjections } from '@ngneat/spectator';
import {
  MissingTranslationHandler, TranslateCompiler, TranslateLoader, TranslateModule, TranslateFakeLoader,
} from '@ngx-translate/core';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { MaterialModule } from 'app/app-material.module';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';

defineGlobalsInjections({
  imports: [
    MaterialModule,
    RouterModule.forRoot([]),
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
  ],
});
