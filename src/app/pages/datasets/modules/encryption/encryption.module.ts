import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DatasetUnlockComponent } from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';
import {
  EncryptionOptionsDialogComponent,
} from 'app/pages/datasets/modules/encryption/components/encyption-options-dialog/encryption-options-dialog.component';
import { ExportAllKeysDialogComponent } from 'app/pages/datasets/modules/encryption/components/export-all-keys-dialog/export-all-keys-dialog.component';
import { UnlockSummaryDialogComponent } from 'app/pages/datasets/modules/encryption/components/unlock-summary-dialog/unlock-summary-dialog.component';
import {
  ZfsEncryptionCardComponent,
} from 'app/pages/datasets/modules/encryption/components/zfs-encryption-card/zfs-encryption-card.component';
import { ExportDatasetKeyDialogComponent } from './components/export-dataset-key-dialog/export-dataset-key-dialog.component';
import { LockDatasetDialogComponent } from './components/lock-dataset-dialog/lock-dataset-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    MatDividerModule,
    TranslateModule,
    MatCardModule,
    RouterModule,
    MatButtonModule,
    EntityModule,
    IxFormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    CommonDirectivesModule,
    FlexModule,
    TestIdModule,
    IxIconModule,
  ],
  exports: [
    ZfsEncryptionCardComponent,
  ],
  declarations: [
    ZfsEncryptionCardComponent,
    EncryptionOptionsDialogComponent,
    UnlockSummaryDialogComponent,
    DatasetUnlockComponent,
    ExportDatasetKeyDialogComponent,
    ExportAllKeysDialogComponent,
    LockDatasetDialogComponent,
  ],
  providers: [],
})
export class EncryptionModule {}
