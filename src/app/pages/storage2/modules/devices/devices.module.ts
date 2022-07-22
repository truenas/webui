import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { DevicesComponent } from 'app/pages/storage2/modules/devices/components/devices/devices.component';
import {
  DiskDetailsPanelComponent,
} from 'app/pages/storage2/modules/devices/components/disk-details-panel/disk-details-panel.component';
import { DiskIconComponent } from 'app/pages/storage2/modules/devices/components/disk-icon/disk-icon.component';
import { DiskInfoCardComponent } from 'app/pages/storage2/modules/devices/components/disk-info-card/disk-info-card.component';
import { DiskNodeComponent } from 'app/pages/storage2/modules/devices/components/disk-node/disk-node.component';
import {
  HardwareDiskEncryptionComponent,
} from 'app/pages/storage2/modules/devices/components/hardware-disk-encryption/hardware-disk-encryption.component';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage2/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { VDevGroupNodeComponent } from 'app/pages/storage2/modules/devices/components/vdev-group-node/vdev-group-node.component';
import { ZfsInfoCardComponent } from 'app/pages/storage2/modules/devices/components/zfs-info-card/zfs-info-card.component';
import { routes } from 'app/pages/storage2/modules/devices/devices.routing';
import { DevicesStore } from 'app/pages/storage2/modules/devices/stores/devices-store.service';
import { SmartInfoCardComponent } from './components/smart-info-card/smart-info-card.component';

@NgModule({
  imports: [
    AppCommonModule,
    CommonModule,
    EntityModule,
    FlexLayoutModule,
    IxFormsModule,
    IxTreeModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    NgxFilesizeModule,
    NgxSkeletonLoaderModule.forRoot({
      theme: {
        'background-color': 'var(--alt-bg2)',
        opacity: 0.25,
      },
    }),
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslateModule,
    CoreComponents,
    CastModule,
    AppLoaderModule,
  ],
  declarations: [
    DevicesComponent,
    DiskDetailsPanelComponent,
    DiskInfoCardComponent,
    HardwareDiskEncryptionComponent,
    ManageDiskSedDialogComponent,
    SmartInfoCardComponent,
    DiskNodeComponent,
    ZfsInfoCardComponent,
    VDevGroupNodeComponent,
    DiskIconComponent,
  ],
  providers: [
    DevicesStore,
  ],
})
export class DevicesModule {
}
