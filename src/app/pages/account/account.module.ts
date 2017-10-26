import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';

import { EntityModule } from '../common/entity/entity.module';

import { StorageService } from '../../services/storage.service';

import { routing } from './account.routing';
import { GroupListComponent } from './groups/group-list/';
import { GroupFormComponent } from './groups/group-form/';
import { UserListComponent } from './users/user-list/';
import { UserFormComponent } from './users/user-form/';
import { ChangePasswordComponent } from './users/change-password/';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule, MaterialModule,
    ReactiveFormsModule, routing
  ],
  declarations: [
    GroupListComponent,
    GroupFormComponent,
    UserListComponent,
    UserFormComponent,
    ChangePasswordComponent,
  ],
  providers: [
    StorageService
  ]
})
export class AccountModule {}
