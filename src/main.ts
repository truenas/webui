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
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import {
  withPreloading,
  provideRouter,
  PreloadAllModules,
  Router,
  NavigationEnd,
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
import { filter, take } from 'rxjs';
import { AppComponent } from 'app/app.component';
import { rootRoutes } from 'app/app.routes';
import { defaultLanguage } from 'app/constants/languages.constant';
import { chunkReloadKey, handleChunkLoadError } from 'app/helpers/handle-chunk-load-error';
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
      /**
       * A tooltip is placed clear of its own trigger, so the area it covers belongs to whatever
       * sits next to that trigger - on the dataset Details card, the path row's "Copy to Clipboard"
       * tooltip lands squarely on the Storage Tier badge and its "Change" button one row up.
       *
       * Material's tooltips are interactive by default: the trigger's `mouseleave` deliberately
       * skips `hide()` when the pointer moves onto the tooltip itself, so a panel you walk into on
       * the way to the control underneath stays up - and, being `pointer-events: auto`, swallows
       * the click. The only way out is to retreat and re-approach along a path that misses the
       * panel, which is exactly the "different angles" workaround NAS-142236 reports.
       *
       * That interactivity only buys the ability to select tooltip text, which nothing here needs.
       * Turning it off adds `mat-mdc-tooltip-panel-non-interactive` (`pointer-events: none`), so a
       * hover tooltip stops being a hit target and `mouseleave` fires normally against whatever is
       * really underneath.
       */
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        showDelay: 0,
        hideDelay: 0,
        touchendHideDelay: 1500,
        disableTooltipInteractivity: true,
      } as MatTooltipDefaultOptions,
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
    provideAppInitializer(() => {
      const router = inject(Router);
      const windowRef = inject<Window>(WINDOW);
      router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1),
      ).subscribe(() => {
        try {
          windowRef.sessionStorage.removeItem(chunkReloadKey);
        } catch { /* sessionStorage may be unavailable */ }
      });
    }),
    ApiService,
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(
      rootRoutes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
      withNavigationErrorHandler((error: NavigationError) => {
        handleChunkLoadError(error, inject<Window>(WINDOW));
      }),
    ),
  ],
});
