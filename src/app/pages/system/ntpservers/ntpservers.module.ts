import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EntityModule} from '../../common/entity/entity.module';

import {NTPServerAddComponent} from './ntpserver-add/';
import {NTPServerDeleteComponent} from './ntpserver-delete/';
import {NTPServerEditComponent} from './ntpserver-edit/';
import {NTPServerListComponent} from './ntpserver-list/';
import {routing} from './ntpservers.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing
  ],
  declarations : [
    NTPServerListComponent,
    NTPServerAddComponent,
    NTPServerEditComponent,
    NTPServerDeleteComponent,
  ],
  providers : []
})
export class NTPServersModule {
}
