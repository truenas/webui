import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from "@angular/flex-layout";
import { Http, HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
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
import { RxCommunicatingService } from './services/rx-communicating.service';

import { ENV_PROVIDERS } from '../environments/environment';
import { AppLoaderComponent } from './services/app-loader/app-loader.component';
import { AppLoaderModule } from './services/app-loader/app-loader.module';
import { NotificationsService } from 'app/services/notifications.service';
import { MarkdownModule } from 'angular2-markdown';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    AppLoaderModule,
    HttpModule,
    AppCommonModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    RouterModule.forRoot(rootRouterConfig, { useHash: false }),
    NgIdleModule.forRoot(),
    MarkdownModule.forRoot(),
  ],
  declarations: [AppComponent, ConfirmDialog, ErrorDialog, InfoDialog, AboutModalDialog, ConsolePanelModalDialog, DownloadKeyModalDialog],
  providers: [
    RoutePartsService,
    NavigationService,
    AuthService,
    WebSocketService,
    RestService,
    AppLoaderService, 
    NotificationsService,
    RxCommunicatingService,
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
    ConsolePanelModalDialog,
    DownloadKeyModalDialog
  ],
})
export class AppModule { }
