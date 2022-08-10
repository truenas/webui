import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { DevicesComponent } from 'app/pages/storage2/modules/devices/components/devices/devices.component';
import {
  DiskDetailsPanelComponent,
} from 'app/pages/storage2/modules/devices/components/disk-details-panel/disk-details-panel.component';
import { DiskInfoCardComponent } from 'app/pages/storage2/modules/devices/components/disk-info-card/disk-info-card.component';
import {
  HardwareDiskEncryptionComponent,
} from 'app/pages/storage2/modules/devices/components/hardware-disk-encryption/hardware-disk-encryption.component';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage2/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { TopologyItemIconComponent } from 'app/pages/storage2/modules/devices/components/topology-item-icon/topology-item-icon.component';
import { TopologyItemNodeComponent } from 'app/pages/storage2/modules/devices/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage2/modules/devices/components/vdev-group-node/vdev-group-node.component';
import { ZfsInfoCardComponent } from 'app/pages/storage2/modules/devices/components/zfs-info-card/zfs-info-card.component';
import { routes } from 'app/pages/storage2/modules/devices/devices.routing';
import { DevicesStore } from 'app/pages/storage2/modules/devices/stores/devices-store.service';
import { SmartInfoCardComponent } from './components/smart-info-card/smart-info-card.component';
import { ExtendDialogComponent } from './components/zfs-info-card/extend-dialog/extend-dialog.component';

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
    IxIconModule,
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
    LayoutModule,
    CommonDirectivesModule,
  ],
  declarations: [
    DevicesComponent,
    DiskDetailsPanelComponent,
    DiskInfoCardComponent,
    HardwareDiskEncryptionComponent,
    ManageDiskSedDialogComponent,
    SmartInfoCardComponent,
    TopologyItemNodeComponent,
    ZfsInfoCardComponent,
    VDevGroupNodeComponent,
    TopologyItemIconComponent,
    ExtendDialogComponent,
  ],
  providers: [
    DevicesStore,
  ],
})
export class DevicesModule {
}
