import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, ErrorHandler } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Router, RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import {
  TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler, TranslateService,
} from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MarkdownModule } from 'ngx-markdown';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  TranslateMessageFormatCompiler,
} from 'ngx-translate-messageformat-compiler';
import { provideNgxWebstorage, withLocalStorage } from 'ngx-webstorage';
import { rootRouterConfig } from 'app/app.routing';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { createTranslateLoader } from 'app/core/classes/icu-translations-loader';
import { MockEnclosureWebsocketService } from 'app/core/testing/mock-enclosure/mock-enclosure-websocket.service';
import { getWindow, WINDOW } from 'app/helpers/window.helper';
import { FeedbackModule } from 'app/modules/feedback/feedback.module';
import { IxIconRegistry } from 'app/modules/ix-icon/ix-icon.service';
import { SnackbarModule } from 'app/modules/snackbar/snackbar.module';
import { TwoFactorGuardService } from 'app/services/auth/two-factor-guard.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { rootEffects, rootReducers } from 'app/store';
import { CustomRouterStateSerializer } from 'app/store/router/custom-router-serializer';
import { AppComponent } from './app.component';
import { AuthGuardService } from './services/auth/auth-guard.service';

@NgModule({
  declarations: [
    AppComponent,
  ],
  bootstrap: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatNativeDateModule,
    MatNativeDateModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
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
    RouterModule.forRoot(rootRouterConfig, {
      useHash: false,
      preloadingStrategy: PreloadAllModules,
      bindToComponentInputs: true,
    }),
    NgxPopperjsModule.forRoot({ appendTo: 'body', hideOnScroll: true }),
    MatSnackBarModule,
    StoreModule.forRoot(rootReducers, {
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true,
      },
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true,
    }),
    StoreRouterConnectingModule.forRoot({
      serializer: CustomRouterStateSerializer,
    }),
    EffectsModule.forRoot(rootEffects),
    MatDialogModule,
    SnackbarModule,
    NgxSkeletonLoaderModule.forRoot({
      theme: {
        'background-color': 'var(--alt-bg2)',
        opacity: 0.25,
      },
    }),
    MatButtonModule,
    MarkdownModule.forRoot({ loader: HttpClient }),
    FeedbackModule,
  ],
  providers: [
    AuthGuardService,
    TwoFactorGuardService,
    NavigationService,
    provideNgxWebstorage(
      withLocalStorage(),
    ),
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
  ],
})
export class AppModule {}
