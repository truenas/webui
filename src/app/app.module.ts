import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgModule, ErrorHandler } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import {
  TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler,
} from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
import { environment } from 'environments/environment';
import { MarkdownModule } from 'ngx-markdown';
import { NgxPopperjsModule } from 'ngx-popperjs';
import {
  TranslateMessageFormatCompiler,
} from 'ngx-translate-messageformat-compiler';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { createTranslateLoader } from 'app/core/classes/icu-translations-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { DownloadKeyDialogComponent } from 'app/modules/common/dialog/download-key/download-key-dialog.component';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { rootEffects, rootReducers } from 'app/store';
import { CustomRouterStateSerializer } from 'app/store/router/custom-router-serializer';
import { AppComponent } from './app.component';
import { rootRouterConfig } from './app.routes';
import { AppLoaderModule } from './modules/app-loader/app-loader.module';
import { AppLoaderService } from './modules/app-loader/app-loader.service';
import { AppCommonModule } from './modules/common/app-common.module';
import { EntityModule } from './modules/entity/entity.module';
import { AuthService } from './services/auth/auth.service';
import { NavigationService } from './services/navigation/navigation.service';
import { RoutePartsService } from './services/route-parts/route-parts.service';
import { WebSocketService } from './services/ws.service';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    AppLoaderModule,
    HttpClientModule,
    AppCommonModule,
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
    RouterModule.forRoot(rootRouterConfig, { useHash: false }),
    NgxPopperjsModule.forRoot({ appendTo: 'body' }),
    MarkdownModule.forRoot(),
    CoreComponents,
    FormsModule,
    ReactiveFormsModule,
    EntityModule,
    MatSnackBarModule,
    TerminalModule,
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
    }),
    StoreRouterConnectingModule.forRoot({
      serializer: CustomRouterStateSerializer,
    }),
    EffectsModule.forRoot(rootEffects),
    MatDialogModule,
  ],
  declarations: [
    AppComponent,
    DownloadKeyDialogComponent,
  ],
  providers: [
    RoutePartsService,
    NavigationService,
    AuthService,
    WebSocketService,
    AppLoaderService,
    IxSlideInService,
    IxFileUploadService,
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    },
  ],
  bootstrap: [
    AppComponent,
  ],
})
export class AppModule {}
