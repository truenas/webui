import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import {
  enableProdMode, ErrorHandler, importProvidersFrom, inject, provideAppInitializer,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import {
  withPreloading,
  provideRouter,
  PreloadAllModules,
  withComponentInputBinding,
  withNavigationErrorHandler,
  NavigationError,
} from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import {
  TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler,
} from '@ngx-translate/core';
import { TnSpriteLoaderService } from '@truenas/ui-components';
import { environment } from 'environments/environment';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MarkdownModule } from 'ngx-markdown';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { provideNgxWebstorage, withLocalStorage } from 'ngx-webstorage';
import { AppComponent } from 'app/app.component';
import { rootRoutes } from 'app/app.routes';
import { defaultLanguage } from 'app/constants/languages.constant';
import { WINDOW, getWindow } from 'app/helpers/window.helper';
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
        // Disabled due to Angular 21 zone handling changes causing false positives
        // with conditionally loaded feature states (debug panel)
        strictActionWithinNgZone: false,
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
      provide: OVERLAY_DEFAULT_CONFIG,
      useValue: { usePopover: false },
    },
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
    provideAppInitializer(() => {
      const swService = inject(ServiceWorkerService);
      swService.register();
    }),
    provideAppInitializer(() => {
      const spriteLoader = inject(TnSpriteLoaderService);
      return spriteLoader.ensureSpriteLoaded();
    }),
    ApiService,
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(
      rootRoutes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
      withNavigationErrorHandler((error: NavigationError) => {
        const chunkFailedPattern = /Loading chunk \d+ failed|(?:failed|error)\s.*dynamically imported module/i;
        if (chunkFailedPattern.test(String(error.error))) {
          const window = inject<Window>(WINDOW);
          try {
            const reloadKey = 'chunk-reload-attempted';
            const lastAttempt = Number(window.sessionStorage.getItem(reloadKey));
            const now = Date.now();
            if (!lastAttempt || now - lastAttempt > 10_000) {
              window.sessionStorage.setItem(reloadKey, String(now));
              window.location.reload();
            } else {
              window.sessionStorage.removeItem(reloadKey);
              window.document.body.innerText = 'The application has been updated. Please refresh the page.';
            }
          } catch {
            window.location.reload();
          }
        }
        console.error(error);
      }),
    ),
  ],
});
