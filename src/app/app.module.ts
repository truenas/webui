import { NgModule, Injector } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';

import { MaterialModule } from './appMaterial.module'; // customized MaterialModule
import { rootRouterConfig } from './app.routes';
import { AppCommonModule } from './components/common/app-common.module';
import { AppComponent } from './app.component';

import { RoutePartsService } from './services/route-parts/route-parts.service';
import { NavigationService } from './services/navigation/navigation.service';
import { AuthService } from './services/auth/auth.service';
import { ConfirmDialog } from './pages/common/confirm-dialog/confirm-dialog.component';
import { PasswordDialog } from './pages/common/password-dialog/password-dialog.component';
import { AboutModalDialog } from './components/common/dialog/about/about-dialog.component';
import { TaskManagerComponent } from './components/common/dialog/task-manager/task-manager.component';
import { TruecommandComponent } from './components/common/dialog/truecommand/truecommand.component';
import { DirectoryServicesMonitorComponent } from './components/common/dialog/directory-services-monitor/directory-services-monitor.component';
import { ConsolePanelModalDialog } from './components/common/dialog/consolepanel/consolepanel-dialog.component';
import { DownloadKeyModalDialog } from './components/common/dialog/downloadkey/downloadkey-dialog.component';
import { ResilverProgressDialogComponent } from './components/common/dialog/resilver-progress/resilver-progress.component';
import { SelectDialogComponent } from './pages/common/select-dialog/select-dialog.component';
import { ErrorDialog } from './pages/common/error-dialog/error-dialog.component';
import { InfoDialog } from './pages/common/info-dialog/info-dialog.component';
import { GeneralDialogComponent } from './pages/common/general-dialog/general-dialog.component';
import { WebSocketService } from './services/ws.service';
import { RestService } from './services/rest.service';
import { AppLoaderService } from './services/app-loader/app-loader.service';

import { AppLoaderComponent } from './services/app-loader/app-loader.component';
import { AppLoaderModule } from './services/app-loader/app-loader.module';
import { NotificationsService } from 'app/services/notifications.service';
import { MarkdownModule } from 'ngx-markdown';

// Core Application Services and Service Injector
import { CoreServices } from 'app/core/services/coreservices.module';
import { setCoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreComponents } from 'app/core/components/corecomponents.module';

import { ErdService } from 'app/services/erd.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EntityDialogComponent } from './pages/common/entity/entity-dialog/entity-dialog.component';
import { FormCheckboxComponent } from './pages/common/entity/entity-form/components/form-checkbox/form-checkbox.component';
import { FormInputComponent } from './pages/common/entity/entity-form/components/form-input/form-input.component';
import { FormSelectComponent } from './pages/common/entity/entity-form/components/form-select/form-select.component';
import { FormParagraphComponent } from './pages/common/entity/entity-form/components/form-paragraph/form-paragraph.component';
import { EntityModule } from './pages/common/entity/entity.module';
import { getWindow, WINDOW } from 'app/helpers/window.helper';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    AppLoaderModule,
    HttpClientModule,
    AppCommonModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient],
      },
    }),
    MaterialModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: false }),
    MarkdownModule.forRoot(),
    CoreServices.forRoot(),
    CoreComponents,
    FormsModule,
    ReactiveFormsModule,
    EntityModule,
    CommonDirectivesModule,
    NgxWebstorageModule.forRoot(),
  ],
  declarations: [
    AppComponent,
    ConfirmDialog,
    PasswordDialog,
    ErrorDialog, InfoDialog,
    GeneralDialogComponent,
    AboutModalDialog,
    TaskManagerComponent,
    TruecommandComponent,
    DirectoryServicesMonitorComponent,
    ConsolePanelModalDialog,
    DownloadKeyModalDialog,
    ResilverProgressDialogComponent,
    SelectDialogComponent,
  ],
  providers: [
    RoutePartsService,
    NavigationService,
    AuthService,
    WebSocketService,
    RestService,
    AppLoaderService,
    NotificationsService,
    ErdService,
    {
      provide: WINDOW,
      useFactory: getWindow,
    },
  ],
  bootstrap: [
    AppComponent,
  ],
  entryComponents: [
    AppLoaderComponent,
    ConfirmDialog,
    PasswordDialog,
    ErrorDialog,
    InfoDialog,
    GeneralDialogComponent,
    AboutModalDialog,
    TaskManagerComponent,
    TruecommandComponent,
    DirectoryServicesMonitorComponent,
    ConsolePanelModalDialog,
    DownloadKeyModalDialog,
    ResilverProgressDialogComponent,
    SelectDialogComponent,
    EntityDialogComponent,
    FormCheckboxComponent,
    FormInputComponent,
    FormSelectComponent,
    FormParagraphComponent,
  ],
})
export class AppModule {
  /**
   *      * Allows for retrieving singletons using `AppModule.injector.get(MyService)`
   *           * This is good to prevent injecting the service as constructor parameter.
   *                */
  static injector: Injector;
  constructor(injector: Injector) {
    setCoreServiceInjector(injector);
  }
}
