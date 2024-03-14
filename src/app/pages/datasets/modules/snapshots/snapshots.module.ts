import { CommonModule } from '@angular/common';
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
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFileSizeModule } from 'app/modules/ix-file-size/ix-file-size.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
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

@NgModule({
  providers: [],
  imports: [
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EffectsModule.forFeature([SnapshotEffects]),
    EntityModule,
    IxFileSizeModule,
    IxFormsModule,
    IxIconModule,
    IxTable2Module,
    LayoutModule,
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
  ],
  declarations: [
    SnapshotListComponent,
    SnapshotCloneDialogComponent,
    SnapshotRollbackDialogComponent,
    SnapshotBatchDeleteDialogComponent,
    SnapshotAddFormComponent,
    SnapshotDetailsRowComponent,
  ],
  exports: [
    SnapshotListComponent,
    SnapshotCloneDialogComponent,
    SnapshotRollbackDialogComponent,
    SnapshotBatchDeleteDialogComponent,
    SnapshotAddFormComponent,
  ],
})
export class SnapshotsModule { }
