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
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { StorageService } from 'app/services/storage.service';
import { routing } from './account.routing';
import { GroupsModule } from './groups/groups.module';
import { UsersModule } from './users/users.module';

@NgModule({
  imports: [
    EntityModule,
    CommonModule,
    FormsModule,
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
    GroupsModule,
  ],
  declarations: [],
  providers: [
    StorageService,
  ],
  exports: [],
})
export class AccountModule {}
