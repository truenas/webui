import 'jest-preset-angular/setup-jest';
import { HighContrastModeDetector } from '@angular/cdk/a11y';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MATERIAL_SANITY_CHECKS, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { defineGlobalsInjections } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import {
  MissingTranslationHandler, TranslateCompiler, TranslateLoader, TranslateModule, TranslateFakeLoader,
} from '@ngx-translate/core';
import failOnConsole from 'jest-fail-on-console';
import { MockProvider } from 'ng-mocks';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import {
  Observable,
} from 'rxjs';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { EmptyAuthService } from 'app/core/testing/utils/empty-auth.service';
import { EmptyWebsocketService } from 'app/core/testing/utils/empty-ws.service';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { WINDOW } from 'app/helpers/window.helper';
import { IxIconTestingModule } from 'app/modules/ix-icon/ix-icon-testing.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarModule } from 'app/modules/snackbar/snackbar.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

failOnConsole();

jest.setTimeout(30 * 1000);

defineGlobalsInjections({
  imports: [
    HttpClientModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatMenuModule,
    IxIconModule,
    IxIconTestingModule,
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
    SnackbarModule,
    TestIdModule,
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
    MockProvider(HighContrastModeDetector),
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
    mockProvider(AppLoaderService, {
      withLoader: () => (source$: Observable<unknown>) => source$,
    }),
    mockProvider(ErrorHandlerService, {
      catchError: () => (source$: Observable<unknown>) => source$,
    }),
    {
      provide: AuthService,
      useClass: EmptyAuthService,
    },
    {
      provide: WebSocketService,
      useClass: EmptyWebsocketService,
    },
  ],
});

beforeEach(() => {
  // eslint-disable-next-line no-restricted-globals
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: unknown) => ({
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

  // eslint-disable-next-line no-restricted-globals
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      disconnect: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn(),
    })),
  });
});

// https://github.com/jsdom/jsdom/issues/3002
Range.prototype.getBoundingClientRect = () => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
} as DOMRect);
Range.prototype.getClientRects = () => ({
  item: () => null,
  length: 0,
  [Symbol.iterator]: jest.fn(),
});

// eslint-disable-next-line no-restricted-globals
Object.defineProperty(window.URL, 'createObjectURL', { value: () => '' });

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    mark: () => {},
    measure: () => {},
  },
});
