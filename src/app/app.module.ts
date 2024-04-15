import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgModule, ErrorHandler } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import {
  TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler,
} from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MarkdownModule } from 'ngx-markdown';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  TranslateMessageFormatCompiler,
} from 'ngx-translate-messageformat-compiler';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { createTranslateLoader } from 'app/core/classes/icu-translations-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { getWindow, WINDOW } from 'app/helpers/window.helper';
import { DialogModule } from 'app/modules/dialog/dialog.module';
import { FeedbackModule } from 'app/modules/feedback/feedback.module';
import { SnackbarModule } from 'app/modules/snackbar/snackbar.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { AuthService } from 'app/services/auth/auth.service';
import { TwoFactorGuardService } from 'app/services/auth/two-factor-guard.service';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FocusService } from 'app/services/focus.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { rootEffects, rootReducers } from 'app/store';
import { CustomRouterStateSerializer } from 'app/store/router/custom-router-serializer';
import { AppComponent } from './app.component';
import { rootRouterConfig } from './app.routes';
import { AppLoaderModule } from './modules/loader/app-loader.module';
import { AppLoaderService } from './modules/loader/app-loader.service';
import { AuthGuardService } from './services/auth/auth-guard.service';
import { RoutePartsService } from './services/route-parts/route-parts.service';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    AppLoaderModule,
    HttpClientModule,
    MatNativeDateModule,
    TooltipModule,
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
    CoreComponents,
    MatSnackBarModule,
    CommonDirectivesModule,
    NgxWebstorageModule.forRoot(),
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
    TestIdModule,
    MarkdownModule.forRoot({ loader: HttpClient }),
    FeedbackModule,
    DialogModule,
  ],
  declarations: [
    AppComponent,
  ],
  providers: [
    RoutePartsService,
    FocusService,
    AuthGuardService,
    TwoFactorGuardService,
    NavigationService,
    AuthService,
    WebSocketService,
    AppLoaderService,
    IxSlideInService,
    IxChainedSlideInService,
    IxFileUploadService,
    DisksUpdateService,
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
    ThemeService,
    {
      provide: WINDOW,
      useFactory: getWindow,
    },
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [
    AppComponent,
  ],
})
export class AppModule {}
