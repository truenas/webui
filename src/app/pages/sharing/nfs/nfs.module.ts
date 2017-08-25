import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EntityModule } from '../../common/entity/entity.module';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { UserService } from '../../../services/user.service';

import { NFSListComponent } from './nfs-list/';
import { NFSFormComponent } from './nfs-form/';
import { routing } from './nfs.routing';

@NgModule({
  imports : [
    EntityModule,
    CommonModule, FormsModule,
    ReactiveFormsModule,
    routing
  ],
  declarations : [
    NFSListComponent,
    NFSFormComponent,
  ],
  providers : [EntityFormService, UserService]
})
export class NFSModule {
}
