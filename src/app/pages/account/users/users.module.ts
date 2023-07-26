import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { UserEffects } from 'app/pages/account/users/store/user.effects';
import { userReducer } from 'app/pages/account/users/store/user.reducer';
import { userStateKey } from 'app/pages/account/users/store/user.selectors';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { UserListComponent } from 'app/pages/account/users/user-list/user-list.component';
import { routing } from 'app/pages/account/users/users.routing';
import { DeleteUserDialogComponent } from './user-details-row/delete-user-dialog/delete-user-dialog.component';
import { UserDetailsRowComponent } from './user-details-row/user-details-row.component';

@NgModule({
  providers: [],
  imports: [
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EffectsModule.forFeature([UserEffects]),
    EntityModule,
    IxFormsModule,
    FlexLayoutModule,
    MatButtonModule,
    IxIconModule,
    MatListModule,
    MatMenuModule,
    MatRippleModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSortModule,
    MatExpansionModule,
    MatCardModule,
    MatDialogModule,
    AppCommonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    RouterModule,
    ReactiveFormsModule,
    routing,
    StoreModule.forFeature(userStateKey, userReducer),
    TranslateModule,
    TranslateModule,
    NgxFilesizeModule,
    LayoutModule,
    TestIdModule,
    IxTable2Module,
  ],
  declarations: [
    UserListComponent,
    UserFormComponent,
    UserDetailsRowComponent,
    DeleteUserDialogComponent,
  ],
  exports: [],
})
export class UsersModule { }
