import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DevicesComponent } from 'app/pages/storage2/modules/devices/components/devices/devices.component';
import {
  DiskDetailsPanelComponent,
} from 'app/pages/storage2/modules/devices/components/disk-details-panel/disk-details-panel.component';
import {
  HardwareDiskEncryptionComponent,
} from 'app/pages/storage2/modules/devices/components/hardware-disk-encryption/hardware-disk-encryption.component';

@NgModule({
  imports: [
    MatCardModule,
    CommonModule,
  ],
  exports: [],
  declarations: [
    DevicesComponent,
    DiskDetailsPanelComponent,
    HardwareDiskEncryptionComponent,
  ],
  providers: [],
})
export class DevicesModule {
}
