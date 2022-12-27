import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { NgxDualListboxModule } from 'app/modules/common/dual-list/dual-list.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupMembersComponent } from 'app/pages/account/groups/group-members/group-members.component';
import { routing } from 'app/pages/account/groups/groups.routing';
import { GroupEffects } from 'app/pages/account/groups/store/group.effects';
import { groupReducer } from 'app/pages/account/groups/store/group.reducer';
import { groupStateKey } from 'app/pages/account/groups/store/group.selectors';
import { DeleteGroupDialogComponent } from './group-details-row/delete-group-dialog/delete-group-dialog.component';

@NgModule({
  providers: [],
  imports: [
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EffectsModule.forFeature([GroupEffects]),
    EntityModule,
    IxFormsModule,
    IxTableModule,
    FlexLayoutModule,
    MatButtonModule,
    IxIconModule,
    MatListModule,
    MatMenuModule,
    MatRippleModule,
    MatCheckboxModule,
    MatSortModule,
    MatExpansionModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    RouterModule,
    ReactiveFormsModule,
    routing,
    StoreModule.forFeature(groupStateKey, groupReducer),
    TranslateModule,
    TranslateModule,
    NgxFilesizeModule,
    NgxDualListboxModule,
    AppCommonModule,
    MatSlideToggleModule,
    LayoutModule,
  ],
  declarations: [
    GroupListComponent,
    GroupFormComponent,
    GroupDetailsRowComponent,
    GroupMembersComponent,
    DeleteGroupDialogComponent,
  ],
  exports: [],
})
export class GroupsModule { }
