import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {EntityModule} from '../common/entity/entity.module';

import {GroupDeleteComponent} from './group-delete/';
import {GroupFormComponent} from './group-form/';
import {GroupListComponent} from './group-list/';
import {routing} from './groups.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing
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
