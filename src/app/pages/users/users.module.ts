import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NgaModule} from '../../theme/nga.module';
import {EntityModule} from '../common/entity/entity.module';

import {UserDeleteComponent} from './user-delete/';
import {UserFormComponent} from './user-form/';
import {UserListComponent} from './user-list/';
import {routing} from './users.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
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
