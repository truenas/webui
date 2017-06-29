import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../theme/nga.module';
import {EntityModule} from '../common/entity/entity.module';

import {GroupDeleteComponent} from './group-delete/';
import {GroupEditComponent} from './group-edit/';
import {GroupFormComponent} from './group-form/';
import {GroupListComponent} from './group-list/';
import {routing} from './groups.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    GroupListComponent,
    GroupFormComponent,
    GroupDeleteComponent,
  ],
  providers : []
})
export class GroupsModule {
}
