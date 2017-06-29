import 'style-loader!angular2-busy/build/style/busy.css';
import 'hammerjs';

import {ApplicationRef, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';

/*
 * Platform and Environment providers/directives/pipes
 */
import {ENV_PROVIDERS} from '../environments/environment';

// App is our top level component
import {App} from './app.component';
import {routing} from './app.routing';
import {AppState, InternalStateType} from './app.service';
import {GlobalState} from './global.state';
import {PagesModule} from './pages/pages.module';
import {NgaModule} from './theme/nga.module';

// Application wide providers
const APP_PROVIDERS = [ AppState, GlobalState ];

export type StoreType = {
  state : InternalStateType,
  restoreInputValues : () => void,
  disposeOldHosts : () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [App],
  declarations: [
    App,
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    MaterialModule,
    BrowserAnimationsModule,
    NgxDatatableModule,
    HttpModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule.forRoot(),
    PagesModule,
    routing,
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS
  ]
})

export class AppModule {
}
