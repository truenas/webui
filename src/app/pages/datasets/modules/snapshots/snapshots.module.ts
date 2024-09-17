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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { SnapshotCloneDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotDetailsRowComponent } from 'app/pages/datasets/modules/snapshots/snapshot-details-row/snapshot-details-row.component';
import { SnapshotListComponent } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { routing } from 'app/pages/datasets/modules/snapshots/snapshots.routing';
import { SnapshotEffects } from 'app/pages/datasets/modules/snapshots/store/snapshot.effects';
import { snapshotReducer } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';
import { snapshotStateKey } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { SnapshotAddFormComponent } from './snapshot-add-form/snapshot-add-form.component';
import { SnapshotBatchDeleteDialogComponent } from './snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';

const components = [
  SnapshotListComponent,
  SnapshotCloneDialogComponent,
  SnapshotRollbackDialogComponent,
  SnapshotBatchDeleteDialogComponent,
  SnapshotAddFormComponent,
  SnapshotDetailsRowComponent,
];

@NgModule({
  providers: [],
  imports: [
    EffectsModule.forFeature([SnapshotEffects]),
    EntityModule,
    IxIconModule,
    IxTableModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTooltipModule,
    NgxSkeletonLoaderModule,
    ReactiveFormsModule,
    RouterModule,
    routing,
    SearchInput1Component,
    StoreModule.forFeature(snapshotStateKey, snapshotReducer),
    TestIdModule,
    TranslateModule,
    FileSizePipe,
    FormatDateTimePipe,
    IxFieldsetComponent,
    IxRadioGroupComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    IxSelectComponent,
    IxModalHeaderComponent,
    IxInputComponent,
    IxSlideToggleComponent,
    PageHeaderModule,
    AsyncPipe,
    RequiresRolesDirective,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
})
export class SnapshotsModule { }
