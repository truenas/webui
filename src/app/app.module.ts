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
  declarations: [AppComponent],
  providers: [RoutePartsService, NavigationService, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }