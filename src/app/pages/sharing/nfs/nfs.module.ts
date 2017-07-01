import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {NFSAddComponent} from './nfs-add/';
import {NFSDeleteComponent} from './nfs-delete/';
import {NFSEditComponent} from './nfs-edit/';
import {NFSListComponent} from './nfs-list/';
import {routing} from './nfs.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    NFSListComponent,
    NFSAddComponent,
    NFSEditComponent,
    NFSDeleteComponent,
  ],
  providers : []
})
export class NFSModule {
}
