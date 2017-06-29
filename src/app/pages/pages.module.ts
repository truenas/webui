import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {RestService, WebSocketService} from '../services/index';
import {NgaModule} from '../theme/nga.module';

import {AuthGuard} from './login/auth-guard.service';
import {Pages} from './pages.component';
import {routing} from './pages.routing';

@NgModule({
  imports : [
    CommonModule,
    NgaModule,
    FormsModule,
    routing,
  ],
  declarations : [ Pages ],
  providers : [ AuthGuard, WebSocketService, RestService ]
})
export class PagesModule {
}
