import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import { NgxDualListboxModule } from '../../components/common/dual-list/dual-list.module';

import { EntityModule } from '../common/entity/entity.module';

import { StorageService } from '../../services/storage.service';

import { routing } from './account.routing';
import { GroupListComponent } from './groups/group-list/';
import { GroupFormComponent } from './groups/group-form/';
import { UserListComponent } from './users/user-list/';
import { UserFormComponent } from './users/user-form/';
import { ChangePasswordComponent } from './users/change-password/';
import { MembersComponent } from './groups/members/members.component';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule, MaterialModule, NgxDualListboxModule,
    ReactiveFormsModule, routing
  ],
  declarations: [
    GroupListComponent,
    GroupFormComponent,
    UserListComponent,
    UserFormComponent,
    ChangePasswordComponent,
    MembersComponent,
  ],
  providers: [
    StorageService
  ]
})
export class AccountModule {}
