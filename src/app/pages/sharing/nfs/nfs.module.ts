import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import {UserService} from '../../../services/user.service';

import {NFSFormComponent} from './nfs-form/';
import {NFSDeleteComponent} from './nfs-delete/';
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
    NFSFormComponent,
    NFSDeleteComponent,
  ],
  providers : [EntityFormService, UserService]
})
export class NFSModule {
}
