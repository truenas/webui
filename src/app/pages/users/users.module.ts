import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../theme/nga.module';
import {EntityModule} from '../common/entity/entity.module';

import {UserDeleteComponent} from './user-delete/';
import {UserFormComponent} from './user-form/';
import {UserListComponent} from './user-list/';
import {routing} from './users.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    UserListComponent,
    UserFormComponent,
    UserDeleteComponent,
  ],
  providers : []
})
export class UsersModule {
}
