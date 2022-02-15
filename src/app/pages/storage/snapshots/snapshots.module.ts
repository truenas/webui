import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CoreComponents } from 'app/core/components/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { SnapshotAddComponent } from 'app/pages/storage/snapshots/snapshot-add/snapshot-add.component';
import { SnapshotCloneDialogComponent } from 'app/pages/storage/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotListComponent } from 'app/pages/storage/snapshots/snapshot-list/snapshot-list.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { routing } from 'app/pages/storage/snapshots/snapshots.routing';
import { SnapshotEffects } from 'app/pages/storage/snapshots/store/snapshot.effects';
import { snapshotReducer } from 'app/pages/storage/snapshots/store/snapshot.reducer';
import { snapshotStateKey } from 'app/pages/storage/snapshots/store/snapshot.selectors';
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterModule,
    ReactiveFormsModule,
    routing,
    StoreModule.forFeature(snapshotStateKey, snapshotReducer),
    TranslateModule,
    TranslateModule,
    NgxFilesizeModule,
  ],
  declarations: [
    SnapshotListComponent,
    SnapshotAddComponent,
    SnapshotCloneDialogComponent,
    SnapshotRollbackDialogComponent,
    SnapshotBatchDeleteDialogComponent,
  ],
  exports: [
    SnapshotListComponent,
    SnapshotAddComponent,
    SnapshotCloneDialogComponent,
    SnapshotRollbackDialogComponent,
    SnapshotBatchDeleteDialogComponent,
  ],
})
export class SnapshotsModule { }
