import 'jest-preset-angular/setup-jest';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MATERIAL_SANITY_CHECKS, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { defineGlobalsInjections } from '@ngneat/spectator';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import {
  MissingTranslationHandler, TranslateCompiler, TranslateLoader, TranslateModule, TranslateFakeLoader,
} from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { WINDOW } from 'app/helpers/window.helper';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarModule } from 'app/modules/snackbar/snackbar.module';

jest.setTimeout(30 * 1000);

defineGlobalsInjections({
  imports: [
    HttpClientModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatMenuModule,
    IxIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDialogModule,
    MatSortModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatCardModule,
    MatListModule,
    MatToolbarModule,
    MatBadgeModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    RouterModule.forRoot([]),
    CommonDirectivesModule,
    NgxFilesizeModule,
    CastModule,
    SnackbarModule,
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
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    AppLoaderModule,
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
    {
      provide: WINDOW,
      // eslint-disable-next-line no-restricted-globals
      useValue: window,
    },
  ],
});

// eslint-disable-next-line no-restricted-globals
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
