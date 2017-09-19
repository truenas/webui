import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EntityModule } from '../common/entity/entity.module';

import { StorageService } from '../../services/storage.service';

import { routing } from './account.routing';
import { GroupListComponent } from './groups/group-list/';
import { GroupFormComponent } from './groups/group-form/';
import { UserListComponent } from './users/user-list/';
import { UserFormComponent } from './users/user-form/';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing
  ],
  declarations: [
    GroupListComponent,
    GroupFormComponent,
    UserListComponent,
    UserFormComponent,
  ],
  providers: [
    StorageService
  ]
})
export class AccountModule {}
