import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { NgxDualListboxModule } from 'app/components/common/dual-list/dual-list.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { StorageService } from 'app/services/storage.service';
import { EntityModule } from '../../modules/entity/entity.module';
import { routing } from './account.routing';
import { MembersComponent } from './groups/members/members.component';
import { UserDetailsRowComponent } from './users/user-details-row/user-details-row.component';
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
    UserDetailsRowComponent,
  ],
  providers: [
    StorageService,
  ],
})
export class AccountModule {}
