import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { NgxDualListboxModule } from 'app/components/common/dual-list/dual-list.module';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { StorageService } from 'app/services/storage.service';
import { EntityModule } from '../common/entity/entity.module';
import { routing } from './account.routing';
import { MembersComponent } from './groups/members/members.component';
import { ChangePasswordComponent } from './users/change-password/change-password.component';
import { UserListComponent } from './users/user-list/user-list.component';

@NgModule({
  imports: [
    EntityModule,
    CommonModule,
    FormsModule,
    MaterialModule,
    NgxDualListboxModule,
    ReactiveFormsModule,
    routing,
    TranslateModule,
    IxFormsModule,
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
