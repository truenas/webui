import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDualListboxModule } from 'app/modules/common/dual-list/dual-list.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { StorageService } from 'app/services/storage.service';
import { routing } from './account.routing';
import { MembersComponent } from './groups/members/members.component';
import { UsersModule } from './users/users.module';

@NgModule({
  imports: [
    EntityModule,
    CommonModule,
    FormsModule,
    NgxDualListboxModule,
    ReactiveFormsModule,
    routing,
    TranslateModule,
    MatSortModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    IxFormsModule,
    IxTableModule,
    FlexLayoutModule,
    UsersModule,
  ],
  declarations: [
    GroupListComponent,
    GroupFormComponent,
    MembersComponent,
  ],
  providers: [
    StorageService,
  ],
})
export class AccountModule {}
