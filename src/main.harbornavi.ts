import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import {
  enableProdMode, importProvidersFrom, inject, provideAppInitializer,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import {
  NavigationError,
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withNavigationErrorHandler,
  withPreloading,
} from '@angular/router';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
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
    provideStore({
      router: routerReducer,
    }, {
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: false,
        strictActionTypeUniqueness: true,
      },
    }),
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
      provide: WINDOW,
      useFactory: getWindow,
    },
    provideAppInitializer(() => {
      const spriteLoader = inject(TnSpriteLoaderService);
      return spriteLoader.ensureSpriteLoaded();
    }),
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
