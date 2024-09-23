import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
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
    MatDividerModule,
    TranslateModule,
    MatCardModule,
    RouterModule,
    MatButtonModule,
    EntityModule,
    ReactiveFormsModule,
    MatDialogModule,
    TestIdModule,
    IxIconComponent,
    IxCheckboxComponent,
    IxRadioGroupComponent,
    IxFileInputComponent,
    IxListComponent,
    IxListItemComponent,
    IxInputComponent,
    IxTextareaComponent,
    IxSelectComponent,
    FormActionsComponent,
    AsyncPipe,
    RequiresRolesDirective,
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
