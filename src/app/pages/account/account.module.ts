import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { GroupsModule } from './groups/groups.module';
import { UsersModule } from './users/users.module';

@NgModule({
  imports: [
    EntityModule,
    ReactiveFormsModule,
    TranslateModule,
    MatSortModule,
    MatCardModule,
    IxIconComponent,
    MatListModule,
    MatProgressSpinnerModule,
    UsersModule,
    GroupsModule,
  ],
})
export class AccountModule {}
