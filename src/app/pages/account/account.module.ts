import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { NgxDualListboxModule } from 'app/components/common/dual-list/dual-list.module';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { IxUserComboboxProvider } from 'app/pages/common/ix-forms/services/ix-user-combobox-provider.service';
import { IxTableModule } from 'app/pages/common/ix-tables/ix-table.module';
import { StorageService } from 'app/services/storage.service';
import { EntityModule } from '../common/entity/entity.module';
import { routing } from './account.routing';
import { MembersComponent } from './groups/members/members.component';
import { UserListDetailsComponent } from './users/user-list-details/user-list-details.component';
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
    IxTableModule,
    FlexLayoutModule,
  ],
  declarations: [
    GroupListComponent,
    GroupFormComponent,
    UserListComponent,
    UserFormComponent,
    MembersComponent,
    UserListDetailsComponent,
  ],
  providers: [
    StorageService,
    IxUserComboboxProvider,
  ],
})
export class AccountModule {}
