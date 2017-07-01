import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {NTPServerAddComponent} from './ntpserver-add/';
import {NTPServerDeleteComponent} from './ntpserver-delete/';
import {NTPServerEditComponent} from './ntpserver-edit/';
import {NTPServerListComponent} from './ntpserver-list/';
import {routing} from './ntpservers.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
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
