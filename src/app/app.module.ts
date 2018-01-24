import { NgModule, Injector } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from "@angular/flex-layout";
import { Http, HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';
import { MaterialModule } from '@angular/material';
import { NgIdleModule } from '@ng-idle/core';
import { rootRouterConfig } from './app.routes';
import { AppCommonModule } from "./components/common/app-common.module";
import { AppComponent } from './app.component';

import { RoutePartsService } from './services/route-parts/route-parts.service';
import { NavigationService } from "./services/navigation/navigation.service";
import { AuthService } from './services/auth/auth.service';
import { ConfirmDialog } from './pages/common/confirm-dialog/confirm-dialog.component';
import { AboutModalDialog } from './components/common/dialog/about/about-dialog.component';
import { ConsolePanelModalDialog } from './components/common/dialog/consolepanel/consolepanel-dialog.component';
import { DownloadKeyModalDialog } from './components/common/dialog/downloadkey/downloadkey-dialog.component';
import { ErrorDialog } from './pages/common/error-dialog/error-dialog.component';
import { InfoDialog } from './pages/common/info-dialog/info-dialog.component';
import { WebSocketService } from './services/ws.service';
import { RestService } from './services/rest.service';
import { AppLoaderService } from './services/app-loader/app-loader.service';

import { ENV_PROVIDERS } from '../environments/environment';
import { AppLoaderComponent } from './services/app-loader/app-loader.component';
import { AppLoaderModule } from './services/app-loader/app-loader.module';
import { NotificationsService } from 'app/services/notifications.service';
import { MarkdownModule } from 'angular2-markdown';

// Core Application Services and Service Injector
import { CoreServices} from 'app/core/services/coreservices.module';
import { setCoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { TestAlertModalDialogComponent } from 'app/pages/system/alertservice/test-alerts/testalerts-dialog.component';
import { ErdService } from 'app/services/erd.service';

export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, './assets/i18n', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    AppLoaderModule,
    HttpModule,
    AppCommonModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [Http]
    }),
    MaterialModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: false }),
    NgIdleModule.forRoot(),
    MarkdownModule.forRoot(),
    CoreServices.forRoot(),
    CoreComponents
  ],
  declarations: [AppComponent, ConfirmDialog, ErrorDialog, InfoDialog, AboutModalDialog, TestAlertModalDialogComponent, ConsolePanelModalDialog, DownloadKeyModalDialog],
  providers: [
    RoutePartsService,
    NavigationService,
    AuthService,
    WebSocketService,
    RestService,
    AppLoaderService, 
    NotificationsService,
    ErdService,
    ENV_PROVIDERS],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    AppLoaderComponent,
    ConfirmDialog,
    ErrorDialog,
    InfoDialog,
    AboutModalDialog,
    TestAlertModalDialogComponent,
    ConsolePanelModalDialog,
    DownloadKeyModalDialog
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
