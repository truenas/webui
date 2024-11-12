import { provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import { enableProdMode, ErrorHandler, importProvidersFrom } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  Router,
  withPreloading,
  provideRouter,
  PreloadAllModules,
  withComponentInputBinding,
} from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import {
  TranslateService, TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler,
} from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MarkdownModule } from 'ngx-markdown';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { provideNgxWebstorage, withLocalStorage } from 'ngx-webstorage';
import { rootRoutes } from 'app/app.routes';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { createTranslateLoader } from 'app/core/classes/icu-translations-loader';
import { MockEnclosureWebsocketService } from 'app/core/testing/mock-enclosure/mock-enclosure-websocket.service';
import { WINDOW, getWindow } from 'app/helpers/window.helper';
import { IxIconRegistry } from 'app/modules/ix-icon/ix-icon-registry.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { rootReducers, rootEffects } from 'app/store';
import { CustomRouterStateSerializer } from 'app/store/router/custom-router-serializer';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      MatNativeDateModule,
      TranslateModule.forRoot({
        defaultLanguage: 'en',
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
    provideRouterStore({
      serializer: CustomRouterStateSerializer,
    }),
    provideNgxWebstorage(withLocalStorage()),
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
      provide: WebSocketService,
      deps: [Router, WebSocketConnectionService, TranslateService],
      useFactory: (router: Router, connection: WebSocketConnectionService, translate: TranslateService) => {
        if (environment.mockConfig.enabled) {
          return new MockEnclosureWebsocketService(router, connection, translate);
        }
        return new WebSocketService(router, connection, translate);
      },
    },
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideRouter(rootRoutes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
