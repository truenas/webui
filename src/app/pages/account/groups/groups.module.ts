import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { SearchInputModule } from 'app/modules/forms/search-input/search-input.module';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import {
  IxTableExpandableRowComponent,
} from 'app/modules/ix-table/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { DualListModule } from 'app/modules/lists/dual-list/dual-list.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupMembersComponent } from 'app/pages/account/groups/group-members/group-members.component';
import { routing } from 'app/pages/account/groups/groups.routing';
import { PrivilegeFormComponent } from 'app/pages/account/groups/privilege/privilege-form/privilege-form.component';
import { PrivilegeListComponent } from 'app/pages/account/groups/privilege/privilege-list/privilege-list.component';
import { GroupEffects } from 'app/pages/account/groups/store/group.effects';
import { groupReducer } from 'app/pages/account/groups/store/group.reducer';
import { groupStateKey } from 'app/pages/account/groups/store/group.selectors';
import { DeleteGroupDialogComponent } from './group-details-row/delete-group-dialog/delete-group-dialog.component';

@NgModule({
  providers: [],
  imports: [
    EffectsModule.forFeature([GroupEffects]),
    EntityModule,
    MatButtonModule,
    IxIconComponent,
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
    DualListModule,
    MatSlideToggleModule,
    SearchInputModule,
    SearchInput1Component,
    IxFieldsetComponent,
    IxModalHeaderComponent,
    IxInputComponent,
    IxChipsComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    IxSelectComponent,
    ReadOnlyComponent,
    PageHeaderModule,
    AsyncPipe,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableDetailsRowDirective,
    IxTablePagerComponent,
    IxTableBodyComponent,
    IxTableHeadComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableExpandableRowComponent,
    TestDirective,
  ],
  declarations: [
    GroupListComponent,
    GroupFormComponent,
    GroupDetailsRowComponent,
    GroupMembersComponent,
    DeleteGroupDialogComponent,
    PrivilegeListComponent,
    PrivilegeFormComponent,
  ],
  exports: [],
})
export class GroupsModule { }
