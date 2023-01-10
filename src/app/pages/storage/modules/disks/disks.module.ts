import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  DiskBulkEditComponent,
} from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { DiskListComponent } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.component';
import {
  DiskWipeDialogComponent,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import {
  ManualTestDialogComponent,
} from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { ReplaceDiskDialogComponent } from 'app/pages/storage/modules/disks/components/replace-disk-dialog/replace-disk-dialog.component';
import {
  SmartResultsComponent,
} from 'app/pages/storage/modules/disks/components/smart-results/smart-results.component';
import { routes } from 'app/pages/storage/modules/disks/disks.routing';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    IxFormsModule,
    MatButtonModule,
    MatDialogModule,
    CoreComponents,
    RouterModule.forChild(routes),
    EntityModule,
    MatCardModule,
    MatDividerModule,
  ],
  declarations: [
    DiskBulkEditComponent,
    DiskFormComponent,
    DiskListComponent,
    DiskWipeDialogComponent,
    ManualTestDialogComponent,
    SmartResultsComponent,
    ReplaceDiskDialogComponent,
  ],
})
export class DisksModule {}
