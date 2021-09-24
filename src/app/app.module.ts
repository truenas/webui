import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgModule, Injector } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import {
  TranslateModule, TranslateLoader, TranslateCompiler, MissingTranslationHandler,
} from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { NgxPopperjsModule } from 'ngx-popperjs';
import {
  TranslateMessageFormatCompiler,
} from 'ngx-translate-messageformat-compiler';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { MaterialModule } from 'app/app-material.module';
import { ConsolePanelDialogComponent } from 'app/components/common/dialog/console-panel/console-panel-dialog.component';
import { DownloadKeyDialogComponent } from 'app/components/common/dialog/download-key/download-key-dialog.component';
import { JobItemComponent } from 'app/components/common/dialog/jobs-manager/components/job-item/job-item.component';
import { JobsManagerComponent } from 'app/components/common/dialog/jobs-manager/jobs-manager.component';
import { JobsManagerStore } from 'app/components/common/dialog/jobs-manager/jobs-manager.store';
import { IcuMissingTranslationHandler } from 'app/core/classes/icu-missing-translation-handler';
import { createTranslateLoader } from 'app/core/classes/icu-translations-loader';
import { CoreComponents } from 'app/core/components/core-components.module';
import { setCoreServiceInjector } from 'app/core/services/core-service-injector';
import { CoreServices } from 'app/core/services/core-services.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { TerminalModule } from 'app/pages/common/terminal/terminal.module';
import { ErdService } from 'app/services/erd.service';
import { NotificationsService } from 'app/services/notifications.service';
import { AppComponent } from './app.component';
import { rootRouterConfig } from './app.routes';
import { AppCommonModule } from './components/common/app-common.module';
import { AboutDialogComponent } from './components/common/dialog/about/about-dialog.component';
import { DirectoryServicesMonitorComponent } from './components/common/dialog/directory-services-monitor/directory-services-monitor.component';
import { ResilverProgressDialogComponent } from './components/common/dialog/resilver-progress/resilver-progress.component';
import { TruecommandComponent } from './components/common/dialog/truecommand/truecommand.component';
import { ConfirmDialogComponent } from './pages/common/confirm-dialog/confirm-dialog.component';
import { EntityDialogComponent } from './pages/common/entity/entity-dialog/entity-dialog.component';
import { FormCheckboxComponent } from './pages/common/entity/entity-form/components/form-checkbox/form-checkbox.component';
import { FormInputComponent } from './pages/common/entity/entity-form/components/form-input/form-input.component';
import { FormParagraphComponent } from './pages/common/entity/entity-form/components/form-paragraph/form-paragraph.component';
import { FormSelectComponent } from './pages/common/entity/entity-form/components/form-select/form-select.component';
import { EntityModule } from './pages/common/entity/entity.module';
import { ErrorDialogComponent } from './pages/common/error-dialog/error-dialog.component';
import { GeneralDialogComponent } from './pages/common/general-dialog/general-dialog.component';
import { InfoDialogComponent } from './pages/common/info-dialog/info-dialog.component';
import { PasswordDialogComponent } from './pages/common/password-dialog/password-dialog.component';
import { SelectDialogComponent } from './pages/common/select-dialog/select-dialog.component';
import { AppLoaderComponent } from './services/app-loader/app-loader.component';
import { AppLoaderModule } from './services/app-loader/app-loader.module';
import { AppLoaderService } from './services/app-loader/app-loader.service';
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
    MaterialModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: false }),
    NgxPopperjsModule.forRoot({ appendTo: 'body' }),
    MarkdownModule.forRoot(),
    CoreServices.forRoot(),
    CoreComponents,
    FormsModule,
    ReactiveFormsModule,
    EntityModule,
    TerminalModule,
    CommonDirectivesModule,
    NgxWebstorageModule.forRoot(),
  ],
  declarations: [
    AppComponent,
    ConfirmDialogComponent,
    PasswordDialogComponent,
    ErrorDialogComponent,
    InfoDialogComponent,
    GeneralDialogComponent,
    AboutDialogComponent,
    TruecommandComponent,
    DirectoryServicesMonitorComponent,
    ConsolePanelDialogComponent,
    DownloadKeyDialogComponent,
    ResilverProgressDialogComponent,
    SelectDialogComponent,
    JobsManagerComponent,
    JobItemComponent,
  ],
  providers: [
    RoutePartsService,
    NavigationService,
    AuthService,
    WebSocketService,
    AppLoaderService,
    NotificationsService,
    ErdService,
    JobsManagerStore,
  ],
  bootstrap: [
    AppComponent,
  ],
  entryComponents: [
    AppLoaderComponent,
    ConfirmDialogComponent,
    PasswordDialogComponent,
    ErrorDialogComponent,
    InfoDialogComponent,
    GeneralDialogComponent,
    AboutDialogComponent,
    TruecommandComponent,
    DirectoryServicesMonitorComponent,
    ConsolePanelDialogComponent,
    DownloadKeyDialogComponent,
    ResilverProgressDialogComponent,
    SelectDialogComponent,
    EntityDialogComponent,
    FormCheckboxComponent,
    FormInputComponent,
    FormSelectComponent,
    FormParagraphComponent,
    JobsManagerComponent,
  ],
})
export class AppModule {
  /**
   * Allows for retrieving singletons using `AppModule.injector.get(MyService)`
   * This is good to prevent injecting the service as constructor parameter.
   * */
  static injector: Injector;
  constructor(injector: Injector) {
    setCoreServiceInjector(injector);
  }
}
