import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import {
  computed, DestroyRef, enableProdMode, ErrorHandler, importProvidersFrom, inject, provideAppInitializer, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  Router,
  NavigationEnd,
  withComponentInputBinding,
  withNavigationErrorHandler,
  NavigationError,
} from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import {
  TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler, TranslateService,
} from '@ngx-translate/core';
import { TN_TABLE_PAGER_LABELS, TnSpriteLoaderService, type TnTablePagerLabels } from '@truenas/ui-components';
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

const pagerLabelKeys = {
  itemsPerPage: T('Items per page'),
  of: T('of'),
  firstPage: T('First Page'),
  previousPage: T('Previous Page'),
  nextPage: T('Next Page'),
  lastPage: T('Last Page'),
  tablePagination: T('Table Pagination'),
};

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
    {
      provide: TN_TABLE_PAGER_LABELS,
      // Bump a tick signal on language change so the computed re-evaluates
      // translate.instant() against the freshly loaded translations.
      useFactory: () => {
        const translate = inject(TranslateService);
        const destroyRef = inject(DestroyRef);
        const tick = signal(0);
        translate.onLangChange
          .pipe(takeUntilDestroyed(destroyRef))
          .subscribe(() => tick.update((n) => n + 1));
        return computed<TnTablePagerLabels>(() => {
          tick();
          return {
            itemsPerPage: translate.instant(pagerLabelKeys.itemsPerPage) as string,
            of: translate.instant(pagerLabelKeys.of) as string,
            firstPage: translate.instant(pagerLabelKeys.firstPage) as string,
            previousPage: translate.instant(pagerLabelKeys.previousPage) as string,
            nextPage: translate.instant(pagerLabelKeys.nextPage) as string,
            lastPage: translate.instant(pagerLabelKeys.lastPage) as string,
            tablePagination: translate.instant(pagerLabelKeys.tablePagination) as string,
          };
        });
      },
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
