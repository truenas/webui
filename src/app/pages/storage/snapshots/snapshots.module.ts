import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
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
import { NgxFilesizeModule } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SnapshotCloneDialogComponent } from 'app/pages/storage/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotListComponent } from 'app/pages/storage/snapshots/snapshot-list/snapshot-list.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { routing } from 'app/pages/storage/snapshots/snapshots.routing';
import { SnapshotEffects } from 'app/pages/storage/snapshots/store/snapshot.effects';
import { snapshotReducer } from 'app/pages/storage/snapshots/store/snapshot.reducer';
import { snapshotStateKey } from 'app/pages/storage/snapshots/store/snapshot.selectors';
import { CreateSnapshotDialogComponent } from 'app/pages/storage/volumes/create-snapshot-dialog/create-snapshot-dialog.component';
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
    IxFormsModule,
    IxTableModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatRippleModule,
    MatSortModule,
    MatExpansionModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterModule,
    ReactiveFormsModule,
    routing,
    StoreModule.forFeature(snapshotStateKey, snapshotReducer),
    TranslateModule,
    TranslateModule,
    NgxFilesizeModule,
    AppCommonModule,
    MatSlideToggleModule,
    LayoutModule,
  ],
  declarations: [
    SnapshotListComponent,
    SnapshotCloneDialogComponent,
    SnapshotRollbackDialogComponent,
    SnapshotBatchDeleteDialogComponent,
    SnapshotAddFormComponent,
    CreateSnapshotDialogComponent,
  ],
  exports: [
    SnapshotListComponent,
    SnapshotCloneDialogComponent,
    SnapshotRollbackDialogComponent,
    SnapshotBatchDeleteDialogComponent,
    SnapshotAddFormComponent,
    CreateSnapshotDialogComponent,
  ],
})
export class SnapshotsModule { }
