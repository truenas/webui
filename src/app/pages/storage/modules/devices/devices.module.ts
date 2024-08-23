import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DevicesComponent } from 'app/pages/storage/modules/devices/components/devices/devices.component';
import {
  DiskDetailsPanelComponent,
} from 'app/pages/storage/modules/devices/components/disk-details-panel/disk-details-panel.component';
import { DiskInfoCardComponent } from 'app/pages/storage/modules/devices/components/disk-info-card/disk-info-card.component';
import {
  ReplaceDiskDialogComponent,
} from 'app/pages/storage/modules/devices/components/disk-info-card/replace-disk-dialog/replace-disk-dialog.component';
import {
  HardwareDiskEncryptionComponent,
} from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/hardware-disk-encryption.component';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/devices/components/topology-item-icon/topology-item-icon.component';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/devices/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/devices/components/vdev-group-node/vdev-group-node.component';
import {
  RaidzExtendDialogComponent,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/raidz-extend-dialog/raidz-extend-dialog.component';
import { ZfsInfoCardComponent } from 'app/pages/storage/modules/devices/components/zfs-info-card/zfs-info-card.component';
import { routes } from 'app/pages/storage/modules/devices/devices.routing';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { SmartInfoCardComponent } from './components/smart-info-card/smart-info-card.component';
import { ExtendDialogComponent } from './components/zfs-info-card/extend-dialog/extend-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    EntityModule,
    IxFormsModule,
    TreeModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    IxIconModule,
    NgxSkeletonLoaderModule.forRoot({
      theme: {
        'background-color': 'var(--alt-bg2)',
        opacity: 0.25,
      },
    }),
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslateModule,
    AppLoaderModule,
    LayoutModule,
    CommonDirectivesModule,
    TestIdModule,
    MatTooltipModule,
    SearchInput1Component,
    UnusedDiskSelectComponent,
    CastPipe,
    FileSizePipe,
    CopyButtonComponent,
    OrNotAvailablePipe,
  ],
  declarations: [
    DevicesComponent,
    DiskDetailsPanelComponent,
    DiskInfoCardComponent,
    HardwareDiskEncryptionComponent,
    ManageDiskSedDialogComponent,
    SmartInfoCardComponent,
    ZfsInfoCardComponent,
    ExtendDialogComponent,
    TopologyItemNodeComponent,
    TopologyItemIconComponent,
    VDevGroupNodeComponent,
    RaidzExtendDialogComponent,
    ReplaceDiskDialogComponent,
  ],
  providers: [
    DevicesStore,
  ],
})
export class DevicesModule {
}
