import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/appMaterial.module';
import { NgxDualListboxModule } from 'app/components/common/dual-list/dual-list.module';
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from '../common/entity/entity.module';

import { StorageService } from 'app/services/storage.service';

import { routing } from './account.routing';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { UserListComponent } from './users/user-list';
import { UserFormComponent } from './users/user-form';
import { ChangePasswordComponent } from './users/change-password';
import { MembersComponent } from './groups/members/members.component';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule, MaterialModule, NgxDualListboxModule,
    ReactiveFormsModule, routing, TranslateModule,
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
    StorageService,
  ],
})
export class AccountModule {}
