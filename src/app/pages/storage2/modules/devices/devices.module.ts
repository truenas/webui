import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { DevicesComponent } from 'app/pages/storage2/modules/devices/components/devices/devices.component';
import {
  DiskDetailsPanelComponent,
} from 'app/pages/storage2/modules/devices/components/disk-details-panel/disk-details-panel.component';
import {
  HardwareDiskEncryptionComponent,
} from 'app/pages/storage2/modules/devices/components/hardware-disk-encryption/hardware-disk-encryption.component';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage2/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { routes } from 'app/pages/storage2/modules/devices/devices.routing';

@NgModule({
  imports: [
    MatCardModule,
    CommonModule,
    TranslateModule,
    RouterModule.forChild(routes),
    MatDialogModule,
    ReactiveFormsModule,
    IxFormsModule,
    MatButtonModule,
  ],
  exports: [],
  declarations: [
    DevicesComponent,
    DiskDetailsPanelComponent,
    HardwareDiskEncryptionComponent,
    ManageDiskSedDialogComponent,
  ],
  providers: [],
})
export class DevicesModule {
}
