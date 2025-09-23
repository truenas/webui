import { provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import {
  enableProdMode, ErrorHandler, importProvidersFrom, inject, provideAppInitializer,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import {
  withPreloading,
  provideRouter,
  PreloadAllModules,
  withComponentInputBinding,
  withNavigationErrorHandler,
  NavigationError, Router,
} from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import {
  TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler,
} from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
import { environment } from 'environments/environment';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MarkdownModule } from 'ngx-markdown';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { provideNgxWebstorage, withLocalStorage } from 'ngx-webstorage';
import { enableSentry } from 'sentry';
import { AppComponent } from 'app/app.component';
import { rootRoutes } from 'app/app.routes';
import { defaultLanguage } from 'app/constants/languages.constant';
import { WINDOW, getWindow } from 'app/helpers/window.helper';
import { IxIconRegistry } from 'app/modules/ix-icon/ix-icon-registry.service';
import { IcuMissingTranslationHandler } from 'app/modules/language/translations/icu-missing-translation-handler';
import { createTranslateLoader } from 'app/modules/language/translations/icu-translations-loader';
import { ApiService } from 'app/modules/websocket/api.service';
import { provideWebSocketDebugState } from 'app/modules/websocket-debug-panel/providers/websocket-debug.providers';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServiceWorkerService } from 'app/services/service-worker.service';
import { rootReducers, rootEffects } from 'app/store';
import { CustomRouterStateSerializer } from 'app/store/router/custom-router-serializer';

if (environment.production) {
  enableProdMode();
  enableSentry();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      TranslateModule.forRoot({
        defaultLanguage,
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
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
      NgxPopperjsModule.forRoot({ appendTo: 'body', hideOnScroll: true }),
      NgxSkeletonLoaderModule.forRoot({
        theme: {
          'background-color': 'var(--alt-bg2)',
          opacity: 0.25,
        },
      }),
      MatButtonModule,
      MarkdownModule.forRoot({ loader: HttpClient }),
    ),
    provideStore(rootReducers, {
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true,
      },
    }),
    provideEffects(rootEffects),
    ...(environment.debugPanel?.enabled ? [provideWebSocketDebugState()] : []),
    provideRouterStore({
      serializer: CustomRouterStateSerializer,
    }),
    provideNgxWebstorage(withLocalStorage()),
    provideNativeDateAdapter(),
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        verticalPosition: 'top',
        duration: 3000,
      } as MatSnackBarConfig,
    },
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
    {
      provide: WINDOW,
      useFactory: getWindow,
    },
    {
      provide: MatIconRegistry,
      useClass: IxIconRegistry,
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
    }),
    provideAppInitializer(() => {
      const swService = inject(ServiceWorkerService);
      swService.register();
    }),
    ApiService,
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(
      rootRoutes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
      withNavigationErrorHandler((error: NavigationError) => {
        const chunkFailedMessage = /Loading chunk \d+ failed/;
        if (chunkFailedMessage.test(String(error.error))) {
          inject<Window>(WINDOW).location.reload();
        }
        console.error(error);
      }),
    ),
  ],
});
