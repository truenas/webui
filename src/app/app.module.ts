import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { Http, HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';

import { rootRouterConfig } from './app.routes';
import { AppCommonModule } from "./components/common/app-common.module";
import { AppComponent } from './app.component';

import { RoutePartsService } from './services/route-parts/route-parts.service';
import { NavigationService } from "./services/navigation/navigation.service";
import { AuthService } from './services/auth/auth.service';
import { ConfirmDialog } from './pages/common/confirm-dialog/confirm-dialog.component';
import { WebSocketService } from './services/ws.service';
import { RestService } from './services/rest.service';
import { AppLoaderService } from './services/app-loader/app-loader.service';
import { AppLoaderComponent } from './services/app-loader/app-loader.component';

import {ENV_PROVIDERS} from '../environments/environment';

export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, './assets/i18n', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    AppCommonModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [Http]
    }),
    RouterModule.forRoot(rootRouterConfig, { useHash: false })
  ],
  declarations: [AppComponent, ConfirmDialog],
  providers: [
    RoutePartsService,
    NavigationService,
    AuthService,
    WebSocketService,
    RestService,
    AppLoaderService, 
    ENV_PROVIDERS],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    AppLoaderComponent,
    ConfirmDialog,
  ],
})
export class AppModule { }