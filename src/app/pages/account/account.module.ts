import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { StorageService } from 'app/services/storage.service';
import { GroupsModule } from './groups/groups.module';
import { UsersModule } from './users/users.module';

@NgModule({
  imports: [
    EntityModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatSortModule,
    MatCardModule,
    IxIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    IxFormsModule,
    IxTableModule,
    FlexLayoutModule,
    UsersModule,
    GroupsModule,
  ],
  declarations: [],
  providers: [
    StorageService,
  ],
  exports: [],
})
export class AccountModule {}
